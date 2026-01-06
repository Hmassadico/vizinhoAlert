from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets

from app.core.database import get_db
from app.core.security import hash_vehicle_id, verify_token
from app.core.rate_limiter import limiter
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleRegisterRequest,
    VehicleResponse,
    VehicleQRResponse,
)
from app.services.qr_service import generate_qr_code


router = APIRouter()


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_vehicle(
    request: Request,
    data: VehicleRegisterRequest,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new vehicle.
    Vehicle ID is hashed - original value is never stored.
    """
    vehicle_hash = hash_vehicle_id(data.vehicle_id)
    
    # Check if vehicle already registered
    result = await db.execute(
        select(Vehicle).where(Vehicle.vehicle_id_hash == vehicle_hash)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle already registered"
        )
    
    # Create vehicle
    vehicle = Vehicle(
        device_id=device_id,
        vehicle_id_hash=vehicle_hash,
        qr_code_token=secrets.token_urlsafe(32),
        nickname=data.nickname,
    )
    
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    
    return vehicle


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """List all vehicles registered by this device"""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.device_id == device_id,
            Vehicle.is_active == True
        )
    )
    vehicles = result.scalars().all()
    return vehicles


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: str,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Get vehicle details"""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.device_id == device_id
        )
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    return vehicle


@router.get("/{vehicle_id}/qr", response_model=VehicleQRResponse)
async def get_vehicle_qr_code(
    vehicle_id: str,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Generate QR code for vehicle"""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.device_id == device_id
        )
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    qr_url, qr_data = generate_qr_code(vehicle.qr_code_token)
    
    return VehicleQRResponse(
        qr_code_url=qr_url,
        qr_code_data=qr_data,
        vehicle_id=vehicle.id,
    )


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: str,
    device_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Delete a vehicle registration"""
    result = await db.execute(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.device_id == device_id
        )
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    await db.delete(vehicle)
    await db.commit()
