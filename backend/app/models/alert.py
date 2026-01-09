from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
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


class AlertStatus(str, enum.Enum):
    """Alert lifecycle status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    EXPIRED = "expired"
    FLAGGED = "flagged"


# Alert expiry in days (GDPR compliance - auto-delete)
ALERT_EXPIRY_DAYS = 30


class Alert(Base):
    """
    Community alert for a vehicle.
    Predefined types only - no free text to prevent misuse.
    Auto-expires after 30 days for GDPR compliance.
    """
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who created the alert (anonymous device) - matches Postgres "sender_device_id"
    sender_device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    # Which vehicle the alert is for
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    
    # Alert type (predefined only) - uses existing Postgres enum "alert_type"
    alert_type = Column(
        SQLEnum(AlertType, name="alert_type", create_type=False),
        nullable=False
    )
    
    # Alert status - uses existing Postgres enum "alert_status"
    status = Column(
        SQLEnum(AlertStatus, name="alert_status", create_type=False),
        default=AlertStatus.ACTIVE
    )
    
    # Location where alert was created (approximate)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Timestamps (timezone-aware to match Postgres schema)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.utcnow() + timedelta(days=ALERT_EXPIRY_DAYS)
    )
    
    # Notification tracking
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Abuse tracking
    is_flagged = Column(Boolean, default=False)
    flagged_at = Column(DateTime(timezone=True), nullable=True)
    flag_reason = Column(String(50), nullable=True)
    
    # Relationships
    device = relationship("Device", back_populates="alerts", foreign_keys=[sender_device_id])
    vehicle = relationship("Vehicle", back_populates="alerts")
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f"<Alert {self.alert_type.value} for vehicle {str(self.vehicle_id)[:8]}...>"
