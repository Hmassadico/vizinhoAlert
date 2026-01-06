from sqlalchemy import Column, String, DateTime, Float, Boolean
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
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id_hash = Column(String(64), unique=True, nullable=False, index=True)
    anonymous_token = Column(String(64), unique=True, nullable=False)
    
    # Location (approximate, for alert radius)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    
    # Settings
    alert_radius_km = Column(Float, default=2.0)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    vehicles = relationship("Vehicle", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device", cascade="all, delete-orphan")
    push_tokens = relationship("PushToken", back_populates="device", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Device {self.id[:8]}...>"
