from fastapi import APIRouter

from app.api.routes import auth, vehicles, alerts, push, health


api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(push.router, prefix="/push", tags=["push notifications"])
