from app.schemas.device import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceUpdateLocationRequest,
    DeviceResponse,
)
from app.schemas.vehicle import (
    VehicleRegisterRequest,
    VehicleResponse,
    VehicleQRResponse,
)
from app.schemas.alert import (
    AlertCreateRequest,
    AlertResponse,
    AlertListResponse,
)
from app.schemas.push import (
    PushTokenRegisterRequest,
    PushTokenResponse,
)

__all__ = [
    "DeviceRegisterRequest",
    "DeviceRegisterResponse",
    "DeviceUpdateLocationRequest",
    "DeviceResponse",
    "VehicleRegisterRequest",
    "VehicleResponse",
    "VehicleQRResponse",
    "AlertCreateRequest",
    "AlertResponse",
    "AlertListResponse",
    "PushTokenRegisterRequest",
    "PushTokenResponse",
]
