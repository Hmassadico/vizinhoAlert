from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_vehicle_id(vehicle_id: str) -> str:
    """Hash vehicle ID for privacy - one-way hash using pepper from settings"""
    return hashlib.sha256(f"{settings.VEHICLE_HASH_PEPPER}{vehicle_id}".encode()).hexdigest()


def hash_device_id(device_id: str) -> str:
    """Hash device ID for privacy using pepper from settings"""
    return hashlib.sha256(f"{settings.DEVICE_HASH_PEPPER}{device_id}".encode()).hexdigest()


def generate_anonymous_token() -> str:
    """Generate a random anonymous token for device"""
    return secrets.token_urlsafe(32)


def create_access_token(device_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token for device"""
    to_encode = {"sub": device_id, "type": "device"}
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return device_id"""
    token = credentials.credentials
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        device_id: str = payload.get("sub")
        
        if device_id is None:
            raise credentials_exception
            
        return device_id
        
    except JWTError:
        raise credentials_exception


def verify_token_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[str]:
    """Optionally verify JWT token"""
    if credentials is None:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None
