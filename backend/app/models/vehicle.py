from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
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
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    # Hashed vehicle identifier (one-way hash of license plate or VIN)
    vehicle_id_hash = Column(String(64), unique=True, nullable=False, index=True)
    
    # QR code unique identifier (for generating QR)
    qr_code_token = Column(String(64), unique=True, nullable=False)
    
    # Optional nickname (user-defined, stored locally preferred)
    nickname = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", back_populates="vehicles")
    alerts = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Vehicle {self.id[:8]}...>"
