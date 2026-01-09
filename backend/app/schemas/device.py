from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID


class DeviceRegisterRequest(BaseModel):
    """Request to register a new anonymous device"""
    device_id: str = Field(..., min_length=16, max_length=64, description="Unique device identifier")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class DeviceRegisterResponse(BaseModel):
    """Response after device registration"""
    access_token: str
    token_type: str = "bearer"
    device_uuid: str
    
    class Config:
        from_attributes = True


class DeviceUpdateLocationRequest(BaseModel):
    """Request to update device location"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    alert_radius_km: Optional[float] = Field(None, ge=0.5, le=5.0)


class DeviceResponse(BaseModel):
    """Device information response"""
    id: UUID
    alert_radius_km: float
    is_active: bool
    created_at: datetime
    last_seen_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
