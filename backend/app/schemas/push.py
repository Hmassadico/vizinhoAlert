from pydantic import BaseModel, Field
from datetime import datetime


class PushTokenRegisterRequest(BaseModel):
    """Request to register push notification token"""
    token: str = Field(..., min_length=10, max_length=255)
    platform: str = Field(..., pattern="^(ios|android)$")


class PushTokenResponse(BaseModel):
    """Push token registration response"""
    id: str
    platform: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
