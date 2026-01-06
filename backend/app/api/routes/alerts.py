from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from app.core.database import get_db
from app.core.security import verify_token
from app.core.rate_limiter import limiter
from app.models.alert import Alert
from app.models.vehicle import Vehicle
from app.schemas.alert import (
    AlertCreateRequest,
    AlertResponse,
    AlertListResponse,
)
from app.services.push_service import send_push_notification


router = APIRouter()


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")  # Strict rate limit for alert creation
async def create_alert(
    request: Request,
    data: AlertCreateRequest,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Create an alert for a vehicle by scanning its QR code.
    Only predefined alert types allowed - no free text.
    """
    # Find vehicle by QR token
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.qr_code_token == data.vehicle_qr_token,
            Vehicle.is_active == True
        )
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Prevent self-alerting
    if vehicle.device_id == device_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create alert for your own vehicle"
        )
    
    # Create alert
    alert = Alert(
        device_id=device_id,
        vehicle_id=vehicle.id,
        alert_type=data.alert_type,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    # Send push notification to vehicle owner
    await send_push_notification(db, vehicle.device_id, alert)
    await db.commit()
    
    return alert


@router.get("", response_model=AlertListResponse)
async def list_my_alerts(
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List alerts for vehicles owned by this device.
    Only shows non-expired alerts.
    """
    # Get all vehicle IDs for this device
    vehicle_result = await db.execute(
        select(Vehicle.id).where(Vehicle.device_id == device_id)
    )
    vehicle_ids = [v for v in vehicle_result.scalars().all()]
    
    if not vehicle_ids:
        return AlertListResponse(alerts=[], total=0, has_more=False)
    
    # Get alerts for these vehicles
    now = datetime.utcnow()
    result = await db.execute(
        select(Alert)
        .where(
            and_(
                Alert.vehicle_id.in_(vehicle_ids),
                Alert.expires_at > now
            )
        )
        .order_by(Alert.created_at.desc())
        .offset(offset)
        .limit(limit + 1)  # Fetch one extra to check has_more
    )
    alerts = result.scalars().all()
    
    has_more = len(alerts) > limit
    if has_more:
        alerts = alerts[:limit]
    
    # Get total count
    count_result = await db.execute(
        select(Alert)
        .where(
            and_(
                Alert.vehicle_id.in_(vehicle_ids),
                Alert.expires_at > now
            )
        )
    )
    total = len(count_result.scalars().all())
    
    return AlertListResponse(
        alerts=alerts,
        total=total,
        has_more=has_more,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific alert"""
    # Get vehicles for this device
    vehicle_result = await db.execute(
        select(Vehicle.id).where(Vehicle.device_id == device_id)
    )
    vehicle_ids = [v for v in vehicle_result.scalars().all()]
    
    result = await db.execute(
        select(Alert).where(
            and_(
                Alert.id == alert_id,
                Alert.vehicle_id.in_(vehicle_ids)
            )
        )
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return alert
