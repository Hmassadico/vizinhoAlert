from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import uuid

from app.core.database import get_db
from app.core.security import hash_vehicle_id, verify_token
from app.core.rate_limiter import limiter
from app.core.plate_validation import detect_country, normalize_plate
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleRegisterRequest,
    VehicleResponse,
    VehicleQRResponse,
)
from app.services.qr_service import generate_qr_code


router = APIRouter()


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")  # Rate limit for brute-force protection
async def register_vehicle(
    request: Request,
    data: VehicleRegisterRequest,
    device_id: uuid.UUID = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new vehicle.
    
    - License plate is validated against GB, IE, and EU formats
    - Plate is normalized (uppercase, no spaces/dashes)
    - Country is auto-detected from plate format
    - Vehicle ID is hashed - original plate is NEVER stored
    """
    # Plate is already normalized by Pydantic validator
    plate_norm = normalize_plate(data.vehicle_id)
    vehicle_hash = hash_vehicle_id(plate_norm)
    
    # Get country from auto-detected fields (populated by model_validator)
    country_code = data.detected_country_code
    country_name = data.detected_country_name
    
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
    
    # Create vehicle - device_id is already a UUID object
    vehicle = Vehicle(
        device_id=device_id,
        vehicle_id_hash=vehicle_hash,
        qr_code_token=secrets.token_urlsafe(32),
        nickname=data.nickname,
    )
    
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    
    # Return response with country detection
    return VehicleResponse(
        id=vehicle.id,
        qr_code_token=vehicle.qr_code_token,
        nickname=vehicle.nickname,
        is_active=vehicle.is_active,
        created_at=vehicle.created_at,
        country_code=country_code,
        country_name=country_name,
    )


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    device_id: uuid.UUID = Depends(verify_token),
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
    vehicle_id: uuid.UUID,
    device_id: uuid.UUID = Depends(verify_token),
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
    vehicle_id: uuid.UUID,
    device_id: uuid.UUID = Depends(verify_token),
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
        vehicle_id=str(vehicle.id),  # Convert UUID to string for response
    )


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    device_id: uuid.UUID = Depends(verify_token),
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
