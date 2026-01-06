from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.models.alert import Alert


async def cleanup_expired_alerts(db: AsyncSession) -> int:
    """
    Remove expired alerts from database.
    GDPR compliance: auto-delete after 30 days.
    Returns number of deleted alerts.
    """
    result = await db.execute(
        delete(Alert).where(Alert.expires_at < datetime.utcnow())
    )
    await db.commit()
    return result.rowcount


async def cleanup_inactive_devices(db: AsyncSession, days_inactive: int = 90) -> int:
    """
    Remove devices that haven't been active for specified days.
    Cascades to delete related vehicles, alerts, and push tokens.
    """
    from datetime import timedelta
    from app.models.device import Device
    
    cutoff = datetime.utcnow() - timedelta(days=days_inactive)
    
    result = await db.execute(
        delete(Device).where(Device.last_seen_at < cutoff)
    )
    await db.commit()
    return result.rowcount
