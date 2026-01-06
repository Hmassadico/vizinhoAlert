from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    hash_device_id,
    generate_anonymous_token,
    create_access_token,
    verify_token,
)
from app.core.rate_limiter import limiter
from app.models.device import Device
from app.schemas.device import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceUpdateLocationRequest,
    DeviceResponse,
)


router = APIRouter()


@router.post("/register", response_model=DeviceRegisterResponse)
@limiter.limit("10/minute")
async def register_device(
    request: Request,
    data: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new anonymous device or login existing one.
    No personal data required - only device ID.
    """
    device_hash = hash_device_id(data.device_id)
    
    # Check if device already exists
    result = await db.execute(
        select(Device).where(Device.device_id_hash == device_hash)
    )
    device = result.scalar_one_or_none()
    
    if device:
        # Update last seen
        device.last_seen_at = datetime.utcnow()
        if data.latitude and data.longitude:
            device.last_latitude = data.latitude
            device.last_longitude = data.longitude
    else:
        # Create new device
        device = Device(
            device_id_hash=device_hash,
            anonymous_token=generate_anonymous_token(),
            last_latitude=data.latitude,
            last_longitude=data.longitude,
        )
        db.add(device)
    
    await db.commit()
    await db.refresh(device)
    
    # Generate JWT token
    access_token = create_access_token(device.id)
    
    return DeviceRegisterResponse(
        access_token=access_token,
        device_uuid=device.id,
    )


@router.get("/me", response_model=DeviceResponse)
async def get_current_device(
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Get current device information"""
    result = await db.execute(
        select(Device).where(Device.id == device_id)
    )
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return device


@router.patch("/me", response_model=DeviceResponse)
async def update_device(
    data: DeviceUpdateLocationRequest,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Update device location and settings"""
    result = await db.execute(
        select(Device).where(Device.id == device_id)
    )
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    device.last_latitude = data.latitude
    device.last_longitude = data.longitude
    
    if data.alert_radius_km is not None:
        device.alert_radius_km = data.alert_radius_km
    
    await db.commit()
    await db.refresh(device)
    
    return device


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete device and all associated data.
    GDPR: Right to erasure (Article 17).
    """
    result = await db.execute(
        select(Device).where(Device.id == device_id)
    )
    device = result.scalar_one_or_none()
    
    if device:
        await db.delete(device)
        await db.commit()
