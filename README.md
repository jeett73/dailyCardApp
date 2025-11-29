# DailyCardApp (Expo + React Native)

## Prerequisites
- Node.js 24.x
- npm 10.x
- Android phone with Expo Go
- iPhone with Expo Go

## Install
```
npm install
```

## Start (recommended for phones)
```
npm run start -- --tunnel
```
- Use the QR code from the terminal or DevTools to open in Expo Go on both phones.
- Ensure both phones and your Windows PC are connected to the internet.

## Android
```
npm run android
```
Opens Expo Go automatically if connected via USB or same network.

## iOS without macOS
- Use `--tunnel` when starting: `npm run start -- --tunnel`
- Scan the QR code with the Camera app, open in Expo Go.

## Troubleshooting
- Firewall: Allow Node and `node.exe` through Windows Defender Firewall.
- Network: If LAN fails, use `--tunnel`.
- Cache: `expo start -c` to clear cache.

## Project Structure
- `app/` file-based routing via Expo Router
- `app/_layout.tsx` root navigation
- `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx` tab screens
- `components/` shared UI utilities
- `assets/` icons, fonts, images
- `app.json` Expo config with typed routes and new architecture enabled

## Scripts
- `npm run start` start the dev server
- `npm run android` open in Expo Go (Android)
- `npm run ios` open in Expo Go (iOS via QR on Windows)
- `npm run web` experimental web preview

## Notes
- Only use libraries supported by Expo Go (managed workflow).
- No native modules requiring config changes unless building a dev client.
