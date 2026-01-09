from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Vehicle(Base):
    """
    Vehicle registration with hashed identifier.
    No license plate stored - only one-way hash.
    GDPR Compliant: No PII, hash cannot be reversed.
    """
    __tablename__ = "vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    # Hashed vehicle identifier (one-way hash of license plate or VIN)
    vehicle_id_hash = Column(String(64), unique=True, nullable=False, index=True)
    
    # QR code unique identifier (for generating QR)
    qr_code_token = Column(String(64), unique=True, nullable=False)
    
    # Optional nickname (user-defined, stored locally preferred)
    nickname = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Abuse tracking (matching Postgres schema)
    alert_count_received = Column(Integer, default=0)
    false_alert_count = Column(Integer, default=0)
    
    # Timestamps (timezone-aware to match Postgres schema)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", back_populates="vehicles")
    alerts = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Vehicle {str(self.id)[:8]}...>"
