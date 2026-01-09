from pydantic import BaseModel, Field, field_serializer
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.alert import AlertType


class AlertCreateRequest(BaseModel):
    """Request to create an alert for a vehicle"""
    vehicle_qr_token: str = Field(..., description="QR code token from scanned vehicle")
    alert_type: AlertType
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class AlertResponse(BaseModel):
    """Alert information response"""
    id: UUID
    alert_type: AlertType
    latitude: float
    longitude: float
    created_at: datetime
    expires_at: datetime
    notification_sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
    
    @field_serializer('id')
    def serialize_id(self, id: UUID) -> str:
        return str(id)


class AlertListResponse(BaseModel):
    """List of alerts response"""
    alerts: List[AlertResponse]
    total: int
    has_more: bool
