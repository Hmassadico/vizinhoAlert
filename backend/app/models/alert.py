from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
import enum

from app.core.database import Base


class AlertType(str, enum.Enum):
    """Predefined alert types - no free text allowed"""
    LIGHTS_ON = "lights_on"
    WINDOW_OPEN = "window_open"
    ALARM_TRIGGERED = "alarm_triggered"
    PARKING_ISSUE = "parking_issue"
    DAMAGE_SPOTTED = "damage_spotted"
    TOWING_RISK = "towing_risk"
    OBSTRUCTION = "obstruction"
    GENERAL = "general"


# Alert expiry in days (GDPR compliance - auto-delete)
ALERT_EXPIRY_DAYS = 30


class Alert(Base):
    """
    Community alert for a vehicle.
    Predefined types only - no free text to prevent misuse.
    Auto-expires after 30 days for GDPR compliance.
    """
    __tablename__ = "alerts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Who created the alert (anonymous device)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    # Which vehicle the alert is for
    vehicle_id = Column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    
    # Alert type (predefined only)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    
    # Location where alert was created (approximate)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(
        DateTime, 
        default=lambda: datetime.utcnow() + timedelta(days=ALERT_EXPIRY_DAYS)
    )
    
    # Notification status
    notification_sent = Column(DateTime, nullable=True)
    
    # Relationships
    device = relationship("Device", back_populates="alerts")
    vehicle = relationship("Vehicle", back_populates="alerts")
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f"<Alert {self.alert_type.value} for vehicle {self.vehicle_id[:8]}...>"
