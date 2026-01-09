from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class PushToken(Base):
    """
    Push notification token storage.
    Tokens are device-specific, not user-specific.
    """
    __tablename__ = "push_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    
    # Push token (Expo/Firebase)
    token = Column(String(255), unique=True, nullable=False)
    platform = Column(String(20), nullable=False)  # ios, android
    
    # Status
    is_active = Column(Boolean, default=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    failure_count = Column(Integer, default=0)
    
    # Timestamps (timezone-aware to match Postgres schema)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", back_populates="push_tokens")
    
    def __repr__(self):
        return f"<PushToken {self.platform} for device {str(self.device_id)[:8]}...>"
