"""
Custom Rate Limiting Middleware for VizinhoAlert.

This provides in-memory rate limiting that works without Redis.
For production with multiple replicas, use Redis-backed slowapi instead.

Usage:
    from app.middleware.rate_limit import RateLimitMiddleware, RateLimitConfig
    
    # In main.py:
    app.add_middleware(
        RateLimitMiddleware,
        config=RateLimitConfig(
            default_limit=60,
            default_window=60,
            endpoint_limits={
                "POST:/api/v1/auth/register": (20, 60),
                "POST:/api/v1/vehicles": (10, 60),
                "POST:/api/v1/alerts": (30, 60),
            }
        )
    )
"""

import time
import os
from typing import Dict, Tuple, Optional
from dataclasses import dataclass, field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    # Default rate limit (requests per window)
    default_limit: int = 60
    # Default window in seconds
    default_window: int = 60
    # Per-endpoint limits: {"METHOD:/path": (limit, window_seconds)}
    endpoint_limits: Dict[str, Tuple[int, int]] = field(default_factory=dict)
    # Whether to trust X-Forwarded-For header
    trust_proxy: bool = True


class InMemoryRateLimiter:
    """
    Simple in-memory rate limiter using sliding window.
    
    Note: This won't work across multiple server instances.
    For production with multiple replicas, use Redis.
    """
    
    def __init__(self):
        # Store: {key: [(timestamp, count), ...]}
        self._store: Dict[str, list] = {}
        self._last_cleanup = time.time()
        self._cleanup_interval = 60  # Clean up every 60 seconds
    
    def _cleanup_old_entries(self, window: int) -> None:
        """Remove entries older than the window"""
        now = time.time()
        
        # Only cleanup periodically
        if now - self._last_cleanup < self._cleanup_interval:
            return
        
        self._last_cleanup = now
        cutoff = now - window
        
        keys_to_remove = []
        for key, timestamps in self._store.items():
            # Filter out old timestamps
            self._store[key] = [ts for ts in timestamps if ts > cutoff]
            if not self._store[key]:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._store[key]
    
    def is_rate_limited(self, key: str, limit: int, window: int) -> Tuple[bool, int, int]:
        """
        Check if a key is rate limited.
        
        Returns:
            (is_limited, current_count, retry_after_seconds)
        """
        now = time.time()
        cutoff = now - window
        
        # Get or create timestamp list for this key
        if key not in self._store:
            self._store[key] = []
        
        # Filter out old timestamps
        self._store[key] = [ts for ts in self._store[key] if ts > cutoff]
        
        # Check if over limit
        current_count = len(self._store[key])
        
        if current_count >= limit:
            # Calculate retry after (when oldest request will expire)
            oldest = min(self._store[key]) if self._store[key] else now
            retry_after = int(oldest + window - now)
            return True, current_count, max(1, retry_after)
        
        # Add new timestamp
        self._store[key].append(now)
        
        # Periodic cleanup
        self._cleanup_old_entries(window)
        
        return False, current_count + 1, 0


# Global limiter instance
_limiter = InMemoryRateLimiter()


def get_client_ip(request: Request, trust_proxy: bool = True) -> str:
    """
    Get client IP address, handling proxies safely.
    
    Priority:
    1. CF-Connecting-IP (Cloudflare)
    2. X-Forwarded-For (first IP)
    3. X-Real-IP
    4. request.client.host
    """
    if trust_proxy:
        # Cloudflare header
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
        
        # X-Forwarded-For (take first IP, which is the original client)
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
        
        # X-Real-IP (nginx default)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware for FastAPI.
    
    Implements per-IP rate limiting with configurable limits per endpoint.
    """
    
    def __init__(self, app, config: Optional[RateLimitConfig] = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
    
    async def dispatch(self, request: Request, call_next):
        # Get rate limit for this endpoint
        method = request.method
        path = request.url.path
        endpoint_key = f"{method}:{path}"
        
        # Check for endpoint-specific limit
        if endpoint_key in self.config.endpoint_limits:
            limit, window = self.config.endpoint_limits[endpoint_key]
        else:
            limit = self.config.default_limit
            window = self.config.default_window
        
        # Get client IP
        client_ip = get_client_ip(request, self.config.trust_proxy)
        
        # Create rate limit key
        rate_key = f"{client_ip}:{endpoint_key}"
        
        # Check rate limit
        is_limited, count, retry_after = _limiter.is_rate_limited(rate_key, limit, window)
        
        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + retry_after)),
                },
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + window))
        
        return response


# Default endpoint limits configuration
DEFAULT_ENDPOINT_LIMITS = {
    "POST:/api/v1/auth/register": (20, 60),  # 20 per minute
    "POST:/api/v1/vehicles": (10, 60),       # 10 per minute
    "POST:/api/v1/alerts": (30, 60),         # 30 per minute
}


def get_rate_limit_config() -> RateLimitConfig:
    """Get rate limit config from environment variables"""
    return RateLimitConfig(
        default_limit=int(os.getenv("RATE_LIMIT_DEFAULT", "60")),
        default_window=int(os.getenv("RATE_LIMIT_WINDOW", "60")),
        endpoint_limits=DEFAULT_ENDPOINT_LIMITS,
        trust_proxy=os.getenv("TRUST_PROXY", "true").lower() == "true",
    )
