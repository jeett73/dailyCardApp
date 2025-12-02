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

## Linting & Formatting

- Dev dependencies: `eslint`, `eslint-config-expo`, `prettier`, `eslint-plugin-prettier`, `eslint-config-prettier`, `globals`
- Run lint: `npx eslint .`
- Auto-fix lint issues: `npx eslint --fix .`
- Check formatting: `npx prettier --check .`
- Format files: `npx prettier --write .`

### Configuration notes

- ESLint uses Expo's flat config to support JavaScript, TypeScript, and platform file extensions.
- Prettier is configured with `endOfLine: auto` for Windows/macOS/Linux compatibility.
- `eslint-config-prettier` is included to disable stylistic rules that conflict with Prettier.
- Both tools ignore large platform/build folders: `android/`, `ios/`, `.expo/`, `web-build/`, `dist/`, `node_modules/`.

## Notes

- Only use libraries supported by Expo Go (managed workflow).
- No native modules requiring config changes unless building a dev client.

## Folders

- `src/api` — HTTP client and method helpers
  - Import via `@/api/...` or `@api/...`
- `src/services` — cross-cutting utilities (storage, logger, etc.)
  - Import via `@/services/...` or `@services/...`

## Path Aliases

- Configured in `tsconfig.json` and `babel.config.js`
- Aliases:
  - `@` → `src`
  - `@api` → `src/api`
  - `@services` → `src/services`
  - `@/assets` → `assets`

## Development

- Lint: `npx eslint .`
- Type check: `npx tsc --noEmit`
- Expo dev: `npm run start`
