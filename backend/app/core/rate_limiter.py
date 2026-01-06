from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

from app.core.config import settings


def get_device_id_or_ip(request: Request) -> str:
    """Get device ID from token or fall back to IP"""
    # Try to get device_id from request state (set by auth middleware)
    device_id = getattr(request.state, "device_id", None)
    if device_id:
        return f"device:{device_id}"
    
    # Fall back to IP address
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=get_device_id_or_ip)


def rate_limit_per_minute():
    """Standard rate limit decorator"""
    return limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")


def rate_limit_alerts():
    """Alert-specific rate limit (more restrictive)"""
    return limiter.limit(f"{settings.RATE_LIMIT_ALERTS_PER_HOUR}/hour")
