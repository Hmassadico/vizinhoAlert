from pydantic import BaseModel, Field, field_serializer
from datetime import datetime
from uuid import UUID


class PushTokenRegisterRequest(BaseModel):
    """Request to register push notification token"""
    token: str = Field(..., min_length=10, max_length=255)
    platform: str = Field(..., pattern="^(ios|android)$")


class PushTokenResponse(BaseModel):
    """Push token registration response"""
    id: UUID
    platform: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)
