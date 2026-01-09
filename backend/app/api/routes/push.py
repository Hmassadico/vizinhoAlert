from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import get_db
from app.core.security import verify_token
from app.models.push_token import PushToken
from app.schemas.push import PushTokenRegisterRequest, PushTokenResponse


router = APIRouter()


@router.post("/token", response_model=PushTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_push_token(
    data: PushTokenRegisterRequest,
    device_id: uuid.UUID = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Register or update push notification token"""
    # Check if token already exists
    result = await db.execute(
        select(PushToken).where(PushToken.token == data.token)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing token
        existing.device_id = device_id
        existing.platform = data.platform
        existing.is_active = True
        await db.commit()
        await db.refresh(existing)
        return existing
    
    # Deactivate old tokens for this device/platform
    old_tokens_result = await db.execute(
        select(PushToken).where(
            PushToken.device_id == device_id,
            PushToken.platform == data.platform
        )
    )
    old_tokens = old_tokens_result.scalars().all()
    for token in old_tokens:
        token.is_active = False
    
    # Create new token - device_id is already a UUID object
    push_token = PushToken(
        device_id=device_id,
        token=data.token,
        platform=data.platform,
    )
    
    db.add(push_token)
    await db.commit()
    await db.refresh(push_token)
    
    return push_token


@router.delete("/token", status_code=status.HTTP_204_NO_CONTENT)
async def delete_push_token(
    token: str,
    device_id: uuid.UUID = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Remove push notification token"""
    result = await db.execute(
        select(PushToken).where(
            PushToken.token == token,
            PushToken.device_id == device_id
        )
    )
    push_token = result.scalar_one_or_none()
    
    if push_token:
        await db.delete(push_token)
        await db.commit()
