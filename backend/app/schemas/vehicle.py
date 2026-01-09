from pydantic import BaseModel, Field, field_serializer, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.core.license_plate import validate_license_plate, normalize_license_plate


class VehicleRegisterRequest(BaseModel):
    """Request to register a vehicle"""
    vehicle_id: str = Field(
        ..., 
        min_length=4, 
        max_length=20, 
        description="Vehicle license plate (UK or EU format)"
    )
    nickname: Optional[str] = Field(None, max_length=50)
    
    @field_validator('vehicle_id')
    @classmethod
    def validate_license_plate_format(cls, v: str) -> str:
        """Validate and normalize the license plate"""
        is_valid, country = validate_license_plate(v)
        if not is_valid:
            raise ValueError("Invalid license plate format for UK or EU")
        # Return normalized plate
        return normalize_license_plate(v)


class VehicleResponse(BaseModel):
    """Vehicle information response"""
    id: UUID
    qr_code_token: str
    nickname: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)


class VehicleQRResponse(BaseModel):
    """QR code generation response"""
    qr_code_url: str
    qr_code_data: str  # Base64 encoded PNG
    vehicle_id: str
