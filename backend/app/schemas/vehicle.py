from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VehicleRegisterRequest(BaseModel):
    """Request to register a vehicle"""
    vehicle_id: str = Field(
        ..., 
        min_length=4, 
        max_length=20, 
        description="Vehicle identifier (license plate or custom ID)"
    )
    nickname: Optional[str] = Field(None, max_length=50)


class VehicleResponse(BaseModel):
    """Vehicle information response"""
    id: str
    qr_code_token: str
    nickname: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class VehicleQRResponse(BaseModel):
    """QR code generation response"""
    qr_code_url: str
    qr_code_data: str  # Base64 encoded PNG
    vehicle_id: str
