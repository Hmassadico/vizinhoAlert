import time
from dataclasses import dataclass
from typing import Dict, Tuple, Optional

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, HTTPException

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """
    Get client IP, preferring Cloudflare/proxy headers.
    """
    # If behind Cloudflare, prefer CF-Connecting-IP
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip

    # X-Forwarded-For for reverse proxies
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()

    return request.client.host if request.client else "unknown"


def get_device_id_or_ip(request: Request) -> str:
    """Get device ID from token or fall back to IP"""
    # Try to get device_id from request state (set by auth middleware)
    device_id = getattr(request.state, "device_id", None)
    if device_id:
        return f"device:{device_id}"
    
    # Fall back to IP address
    return f"ip:{get_client_ip(request)}"


# slowapi-based limiter (requires Redis for multi-replica)
limiter = Limiter(key_func=get_device_id_or_ip)


def rate_limit_per_minute():
    """Standard rate limit decorator"""
    return limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")


def rate_limit_alerts():
    """Alert-specific rate limit (more restrictive)"""
    return limiter.limit(f"{settings.RATE_LIMIT_ALERTS_PER_HOUR}/hour")


# ============================================================
# In-Memory Rate Limiter (no Redis required, single instance)
# ============================================================

@dataclass
class RateLimitRule:
    """Define a rate limit rule"""
    window_seconds: int
    max_requests: int


# In-memory store: key -> (count, window_start_timestamp)
_memory_store: Dict[str, Tuple[int, float]] = {}


def rate_limit_memory(request: Request, key_suffix: str, rule: RateLimitRule) -> None:
    """
    In-memory rate limiter (works without Redis).
    
    Raises HTTPException 429 if rate limit exceeded.
    
    Args:
        request: FastAPI request object
        key_suffix: Unique key suffix per endpoint (e.g., "auth_register")
        rule: RateLimitRule with window_seconds and max_requests
    
    Usage:
        rate_limit_memory(request, "vehicle_register", RateLimitRule(60, 20))
    """
    now = time.time()
    ip = get_client_ip(request)
    key = f"{ip}:{key_suffix}"

    count, start = _memory_store.get(key, (0, now))
    
    # Reset window if expired
    if now - start >= rule.window_seconds:
        _memory_store[key] = (1, now)
        return

    # Check if over limit
    if count >= rule.max_requests:
        retry_after = int(rule.window_seconds - (now - start))
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )

    # Increment counter
    _memory_store[key] = (count + 1, start)
