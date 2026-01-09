# VizinhoAlert Backend

Privacy-first community car alert system API for European communities.

## Features

- **Device-based Authentication**: Anonymous JWT tokens, no personal data required
- **Vehicle Registration**: Hashed vehicle identifiers (license plates never stored)
- **QR Code Generation**: Unique QR codes for each registered vehicle
- **Alert System**: Predefined alert types only (no free text)
- **Push Notifications**: Expo/Firebase push notification support
- **Rate Limiting**: Per-device rate limits to prevent abuse
- **GDPR Compliant**: Auto-deletion, data minimization, right to erasure

## Tech Stack

- FastAPI (Python 3.11+)
- PostgreSQL 15+
- SQLAlchemy (async)
- JWT Authentication
- QR Code generation
- Expo Push Notifications

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py        # Device registration/login
│   │       ├── vehicles.py    # Vehicle CRUD + QR codes
│   │       ├── alerts.py      # Alert creation/listing
│   │       ├── push.py        # Push token management
│   │       └── health.py      # Health checks
│   ├── core/
│   │   ├── config.py          # Settings
│   │   ├── database.py        # DB connection
│   │   ├── security.py        # JWT + hashing
│   │   └── rate_limiter.py    # Rate limiting
│   ├── models/
│   │   ├── device.py
│   │   ├── vehicle.py
│   │   ├── alert.py
│   │   └── push_token.py
│   ├── schemas/               # Pydantic models
│   ├── services/
│   │   ├── qr_service.py
│   │   ├── push_service.py
│   │   └── cleanup_service.py
│   └── main.py
├── migrations/
│   └── 001_initial_schema.sql
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Using Docker

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your values (especially JWT_SECRET_KEY)
nano .env

# Start services
docker-compose up -d

# API available at http://localhost:8000
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL and run migrations
psql -U postgres -c "CREATE DATABASE vizinhoalert;"
psql -U postgres -d vizinhoalert -f migrations/001_initial_schema.sql

# Copy and configure environment
cp .env.example .env

# Run server
uvicorn app.main:app --reload
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register device (anonymous)
- `GET /api/v1/auth/me` - Get device info
- `PATCH /api/v1/auth/me` - Update location/radius
- `DELETE /api/v1/auth/me` - Delete device (GDPR erasure)

### Vehicles
- `POST /api/v1/vehicles` - Register vehicle
- `GET /api/v1/vehicles` - List my vehicles
- `GET /api/v1/vehicles/{id}` - Get vehicle
- `GET /api/v1/vehicles/{id}/qr` - Generate QR code
- `DELETE /api/v1/vehicles/{id}` - Delete vehicle

### Alerts
- `POST /api/v1/alerts` - Create alert (scan QR)
- `GET /api/v1/alerts` - List alerts for my vehicles
- `GET /api/v1/alerts/{id}` - Get alert details

### Push Notifications
- `POST /api/v1/push/token` - Register push token
- `DELETE /api/v1/push/token` - Remove push token

### Health
- `GET /api/v1/health` - API health check
- `GET /api/v1/health/db` - Database health check

## Push Notifications Setup (Expo)

VizinhoAlert uses the **Expo Push API** for notifications. No Firebase configuration is required.

### Registering Push Tokens from the Expo App

1. **Get the Expo Push Token** in your app:

```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  
  return token.data; // e.g., "ExponentPushToken[xxxxxx]"
}
```

2. **Send the token to the backend** after device registration:

```typescript
const pushToken = await registerForPushNotifications();

if (pushToken) {
  await fetch('https://your-api.com/api/v1/push/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: pushToken,
      platform: Platform.OS, // 'ios' or 'android'
    }),
  });
}
```

3. **Request payload format**:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios"
}
```

### How Notifications Work

1. User A scans the QR code on User B's vehicle
2. User A selects an alert type and submits
3. Backend creates alert and calls `send_push_notification()`
4. Backend sends notification via `https://exp.host/--/api/v2/push/send`
5. User B receives push notification on their device

## Privacy & GDPR Compliance

1. **No Personal Data**: Only device UUIDs and hashed vehicle IDs stored
2. **One-Way Hashing**: Vehicle identifiers cannot be reversed
3. **Auto-Deletion**: Alerts expire after 30 days, devices after 90 days inactive
4. **Right to Erasure**: DELETE /auth/me removes all data
5. **Data Minimization**: Only essential data collected
6. **EU Hosting**: Designed for EU-hosted PostgreSQL

## Rate Limits

- General API: 60 requests/minute per device
- Alert Creation: 10 alerts/hour per device
- Device Registration: 10 requests/minute per IP

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET_KEY | Secret for JWT signing (min 32 chars) | - |
| JWT_ACCESS_TOKEN_EXPIRE_MINUTES | Token expiry | 10080 (7 days) |
| DEVICE_HASH_PEPPER | Pepper for device ID hashing (min 32 chars) | - |
| VEHICLE_HASH_PEPPER | Pepper for vehicle ID hashing (min 32 chars) | - |
| RATE_LIMIT_PER_MINUTE | General rate limit | 60 |
| RATE_LIMIT_ALERTS_PER_HOUR | Alert creation limit | 10 |
| QR_CODE_BASE_URL | Base URL for QR codes | https://vizinhoalert.eu/vehicle |
| DEBUG | Enable debug mode | false |

## Developer Testing

### Quick Test with curl

**1. Register a device:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"device_id": "test-device-abc123def456", "latitude": null, "longitude": null}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "device_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**2. Register a vehicle (requires JWT):**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIs..."  # from step 1

curl -X POST http://localhost:8000/api/v1/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"vehicle_id": "AB12CDE", "nickname": "My Car"}'
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "qr_code_token": "abc123...",
  "nickname": "My Car",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**3. List vehicles:**
```bash
curl http://localhost:8000/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN"
```

**4. Health check:**
```bash
curl http://localhost:8000/api/v1/health
```

## License

MIT
