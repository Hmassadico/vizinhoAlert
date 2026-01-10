from pydantic import BaseModel, Field, field_serializer, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.core.license_plate import validate_plate_or_raise, normalize_license_plate, detect_plate_country


class VehicleRegisterRequest(BaseModel):
    """Request to register a vehicle"""
    vehicle_id: str = Field(
        ..., 
        min_length=4, 
        max_length=20, 
        description="Vehicle license plate (UK or EU format)"
    )
    nickname: Optional[str] = Field(None, max_length=50)
    
    # Auto-detected country info (populated after validation)
    detected_country_code: Optional[str] = None
    detected_country_name: Optional[str] = None
    
    @field_validator('vehicle_id')
    @classmethod
    def validate_and_normalize_plate(cls, v: str) -> str:
        """Validate and normalize the license plate"""
        plate_norm, _, _ = validate_plate_or_raise(v)
        return plate_norm  # Return normalized plate
    
    @field_validator('nickname')
    @classmethod
    def nickname_strip(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from nickname"""
        return v.strip() if v else v


class VehicleResponse(BaseModel):
    """Vehicle information response"""
    id: UUID
    qr_code_token: str
    nickname: Optional[str]
    is_active: bool
    created_at: datetime
    
    # Auto-detected country from plate format
    country_code: Optional[str] = None
    country_name: Optional[str] = None
    
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
