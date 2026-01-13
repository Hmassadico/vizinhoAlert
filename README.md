# VizinhoAlert — Privacy-First Neighborhood Alert System 🚨

VizinhoAlert is a privacy-first neighborhood alert system for European communities. Residents anonymously broadcast safety alerts to nearby neighbors without sharing personal information.

Built with **Expo (SDK 54)**, **React Native**, and **FastAPI**.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set the API base URL (default is production):

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.vizinhoalert.eu/api/v1
```

### 3. Start the development server

```bash
npx expo start
```

---

## 📱 Platform Support

### Expo Go (Limited)
- ✅ Works for basic UI testing
- ❌ Push notifications disabled (Expo Go limitation in SDK 53+)
- ❌ Some native features may be restricted

### Development Build (Recommended)
For full functionality including push notifications, create a development build:

```bash
# iOS
npx eas build --profile development --platform ios

# Android
npx eas build --profile development --platform android
```

Then install the built app on your device and run:

```bash
npx expo start --dev-client
```

[Learn more about development builds](https://docs.expo.dev/develop/development-builds/introduction/)

---

## 🔐 Privacy & Security

- **No personal data collection**: Device IDs are generated locally using `expo-crypto`
- **License plates are hashed**: Raw plates never stored (SHA-256 with pepper)
- **Location used only for alerts**: Never stored permanently
- **HTTPS required**: All API calls use secure connections

---

## 🛠️ Key Technologies

- **Expo SDK 54** — React Native framework
- **TypeScript** — Type-safe development
- **NativeWind** — Tailwind CSS for React Native
- **expo-camera** — QR code scanning
- **expo-location** — Geolocation with permission handling
- **expo-crypto** — Secure random ID generation
- **expo-notifications** — Push notifications (dev builds only)

---

## 📂 Project Structure

```
app/              # File-based routing (Expo Router)
  index.tsx       # Home screen (Alert Feed)
  scan.tsx        # QR Scanner
  vehicles.tsx    # My Vehicles
  settings.tsx    # Settings
components/       # Reusable UI components
lib/              # API client & utilities
types/            # TypeScript type definitions
backend/          # FastAPI backend (separate service)
```

---

## 🔧 Runtime Issue Fixes

### ✅ UUID Generation
- **Fixed**: Replaced `uuid` package with `expo-crypto` (works in RN runtime)
- Device IDs are 64-char alphanumeric strings stored in AsyncStorage

### ✅ Location Permissions
- **Fixed**: Added permission request before `getCurrentPositionAsync`
- User-friendly error if location denied
- iOS/Android permissions configured in `app.json`

### ✅ Camera Overlay
- **Fixed**: Removed children from `<CameraView>` (not supported)
- Overlay now uses absolute positioning outside CameraView

### ✅ Push Notifications
- **Fixed**: Detects Expo Go and skips remote push registration
- Works in development builds and production

### ✅ Web Mixed Content
- **Fixed**: API defaults to HTTPS (`https://api.vizinhoalert.eu/api/v1`)
- Web requires HTTPS for API calls

---

## 🎨 Design System

**Swiss International + HUD Overlay**

- **Colors**: Deep charcoal (#1a1d23), warm off-white (#f4f1ea)
- **Typography**: Space Grotesk (bold), IBM Plex Mono (data)
- **Layout**: Strict 8px grid, generous spacing
- **Motion**: Functional animations only (no decorative effects)

---

## 📦 Backend Setup

The FastAPI backend is in the `backend/` directory. See `backend/README.md` for setup instructions.

API documentation: [https://api.vizinhoalert.eu/docs](https://api.vizinhoalert.eu/docs)

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Troubleshooting

### "Failed to fetch" error on web
- **Solution**: Ensure `EXPO_PUBLIC_API_BASE_URL` uses HTTPS

### Push notifications not working
- **Solution**: Create a development build (push disabled in Expo Go)

### Location permission denied
- **Solution**: Check device settings and grant location access

### Camera not working
- **Solution**: Check app.json permissions and rebuild app

---

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)

---

**Built with ❤️ for privacy-conscious communities**
