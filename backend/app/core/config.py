from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/vizinhoalert"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Hash Peppers (for device/vehicle ID hashing)
    DEVICE_HASH_PEPPER: str = "change-this-device-pepper-in-production"
    VEHICLE_HASH_PEPPER: str = "change-this-vehicle-pepper-in-production"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_ALERTS_PER_HOUR: int = 10
    
    # Firebase (for push notifications)
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_CLIENT_ID: str = ""
    
    # QR Code
    QR_CODE_BASE_URL: str = "https://vizinhoalert.eu/vehicle"
    
    # Application
    APP_ENV: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "https://vizinhoalert.eu,https://www.vizinhoalert.eu,http://localhost:3000,http://localhost:19006,http://localhost:8081"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
