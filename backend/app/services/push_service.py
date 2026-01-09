import httpx
from typing import List, Optional
from datetime import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.push_token import PushToken
from app.models.alert import Alert, AlertType


ALERT_TYPE_MESSAGES = {
    AlertType.LIGHTS_ON: "Your vehicle's lights appear to be on",
    AlertType.WINDOW_OPEN: "A window on your vehicle appears to be open",
    AlertType.ALARM_TRIGGERED: "Your vehicle's alarm has been triggered",
    AlertType.PARKING_ISSUE: "There's a parking issue with your vehicle",
    AlertType.DAMAGE_SPOTTED: "Damage has been spotted on your vehicle",
    AlertType.TOWING_RISK: "Your vehicle may be at risk of towing",
    AlertType.OBSTRUCTION: "Your vehicle may be causing an obstruction",
    AlertType.GENERAL: "Someone has sent an alert about your vehicle",
}


async def send_push_notification(
    db: AsyncSession,
    device_id: uuid.UUID,
    alert: Alert,
) -> bool:
    """
    Send push notification to a device about an alert.
    Uses Expo Push Notification service.
    device_id should be a UUID object.
    """
    # Get active push tokens for device
    result = await db.execute(
        select(PushToken).where(
            PushToken.device_id == device_id,
            PushToken.is_active == True
        )
    )
    tokens = result.scalars().all()
    
    if not tokens:
        return False
    
    # Prepare notification payload
    message = ALERT_TYPE_MESSAGES.get(alert.alert_type, "New alert for your vehicle")
    
    notifications = []
    for token in tokens:
        notifications.append({
            "to": token.token,
            "title": "VizinhoAlert",
            "body": message,
            "data": {
                "alert_id": str(alert.id),  # Convert UUID to string for JSON
                "alert_type": alert.alert_type.value,
            },
            "sound": "default",
            "priority": "high",
        })
    
    # Send via Expo Push API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=notifications,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            
            if response.status_code == 200:
                # Update alert notification status
                alert.notification_sent_at = datetime.utcnow()
                return True
                
    except Exception as e:
        print(f"Push notification error: {e}")
        
    return False


async def deactivate_invalid_tokens(
    db: AsyncSession,
    invalid_tokens: List[str]
) -> None:
    """Deactivate push tokens that are no longer valid"""
    if not invalid_tokens:
        return
        
    result = await db.execute(
        select(PushToken).where(PushToken.token.in_(invalid_tokens))
    )
    tokens = result.scalars().all()
    
    for token in tokens:
        token.is_active = False
