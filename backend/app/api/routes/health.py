from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db


router = APIRouter()


@router.get("")
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "service": "vizinhoalert-api"}


@router.get("/db")
async def database_health(db: AsyncSession = Depends(get_db)):
    """Database connectivity check"""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
