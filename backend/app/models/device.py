from sqlalchemy import Column, String, DateTime, Float, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Device(Base):
    """
    Anonymous device registration.
    No personal data stored - only hashed device ID and anonymous token.
    GDPR Compliant: No PII, auto-deletion supported.
    """
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id_hash = Column(String(64), unique=True, nullable=False, index=True)
    anonymous_token = Column(String(64), unique=True, nullable=False)
    
    # Location (approximate, for alert radius)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    
    # Settings
    alert_radius_km = Column(Float, default=2.0)
    is_active = Column(Boolean, default=True)
    
    # Ban/trust fields (matching Postgres schema)
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String(50), nullable=True)
    ban_expires_at = Column(DateTime(timezone=True), nullable=True)
    trust_score = Column(Integer, default=100)
    
    # Timestamps (timezone-aware to match Postgres schema)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # GDPR retention marker
    delete_after = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    vehicles = relationship("Vehicle", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device", cascade="all, delete-orphan", foreign_keys="Alert.sender_device_id")
    push_tokens = relationship("PushToken", back_populates="device", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Device {str(self.id)[:8]}...>"
