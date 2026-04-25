# CineVault — Complete Setup & Build Guide
### Built for Xiaomi Pad 7 · Android APK

---

## What's Inside

| Feature | Status |
|---|---|
| Home screen — trending, hero banner, mood picker | ✅ |
| Smart search with genre/rating/sort filters | ✅ |
| Movie detail — cast, trailer, ratings, notes | ✅ |
| Watchlist / Watching / Watched tracker | ✅ |
| Mood engine (6 moods → TMDb discovery) | ✅ |
| AI recommendations (Claude-powered) | ✅ |
| Stats dashboard — hours, avg rating, progress | ✅ |
| PIN lock (4-digit) | ✅ |
| Fingerprint / Face unlock (biometric) | ✅ |
| Portrait + Landscape support | ✅ |
| Home screen widget (watched/queue/hours) | ✅ |
| Local SQLite storage (fully offline) | ✅ |
| TMDb auto-metadata (poster, cast, rating) | ✅ |

---

## Step 1 — Prerequisites

Install these on your PC/Mac:

```bash
# 1. Node.js (v18 or newer)
https://nodejs.org

# 2. Expo CLI
npm install -g expo-cli eas-cli

# 3. Git (optional but helpful)
https://git-scm.com
```

---

## Step 2 — Project Setup

```bash
# Navigate into the project folder
cd cinevault

# Install all dependencies
npm install

# Verify it starts (optional — needs Android emulator or Expo Go)
npx expo start
```

---

## Step 3 — Test on Your Xiaomi Pad 7 (Without Building APK)

The fastest way to test during development:

1. Install **Expo Go** from Google Play Store on your Xiaomi Pad 7
2. Run `npx expo start` on your PC
3. Scan the QR code shown in terminal with Expo Go
4. The app loads instantly on your tablet

> Note: Biometric lock and widget require a real APK build (Step 4).

---

## Step 4 — Build the APK (One-Time Setup)

### 4a. Create Expo / EAS account (free)
```
https://expo.dev/signup
```

### 4b. Login from terminal
```bash
eas login
```

### 4c. Configure your project
```bash
eas build:configure
```

### 4d. Build the APK
```bash
npm run build:apk
# or directly:
eas build --platform android --profile preview
```

This builds in the cloud (free tier available). Takes ~10-15 minutes.
You'll get a download link for the `.apk` file.

### 4e. Install on Xiaomi Pad 7
1. Download the APK to your tablet
2. Enable: **Settings → Install unknown apps → Files → Allow**
3. Tap the APK file to install
4. Done!

---

## Step 5 — Widget Setup (After APK Install)

### If using EAS Build (recommended):
The widget is pre-registered via the Android manifest. After installing the APK:

1. Long-press your **home screen**
2. Tap **Widgets**
3. Scroll to find **CineVault**
4. Drag it to your home screen
5. Resize as needed (it's resizable!)

### If doing local build (expo prebuild):
```bash
# Generate native Android project
npx expo prebuild --platform android

# Add widget files (already in android/ folder)
# Register in AndroidManifest.xml — see:
# android/WIDGET_MANIFEST_SNIPPET.xml

# Build locally
cd android && ./gradlew assembleRelease
```

---

## Step 6 — PIN & Biometric Lock Setup

Inside the app:
1. Go to **Settings** tab (gear icon)
2. Tap **App Lock**
3. Tap **Set PIN** — enter 4 digits twice
4. Toggle **Fingerprint / Face Unlock** if your Xiaomi Pad 7 has it enrolled

To unlock the app:
- Enter 4-digit PIN, **or**
- Tap fingerprint icon → use your fingerprint

To disable:
- Settings → App Lock → Disable (requires current PIN)

---

## Step 7 — Landscape Mode

The app fully supports landscape and portrait:
- **Rotate your Xiaomi Pad 7** — UI adapts automatically
- Hero banner shrinks in landscape to show more content
- Tab bar compresses in landscape
- Movie grids use available width intelligently
- No need to change any settings — it's automatic

---

## API Keys Reference

| Key | Value |
|---|---|
| TMDb API Key | `8514773b31bcb2e70b7d4a18f70510a7` |
| TMDb Read Token | `eyJhbGci...` (in src/utils/constants.ts) |
| Claude API | Auto-handled via claude.ai artifact |

---

## Project File Structure

```
cinevault/
├── App.tsx                          # Entry point + lock gate
├── app.json                         # Expo config (orientation, permissions)
├── eas.json                         # Build profiles
├── assets/
│   ├── icon.png
│   ├── splash.png
│   ├── no-poster.png
│   └── no-avatar.png
├── src/
│   ├── utils/
│   │   └── constants.ts             # Colors, API keys, moods
│   ├── services/
│   │   ├── tmdb.ts                  # All TMDb API calls
│   │   └── database.ts              # SQLite local storage
│   ├── store/
│   │   └── useStore.ts              # Zustand global state
│   ├── hooks/
│   │   └── useOrientation.ts        # Portrait/landscape detection
│   ├── components/
│   │   └── AppLock.tsx              # PIN pad + biometric + lock gate
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Tab + stack navigation
│   └── screens/
│       ├── HomeScreen.tsx           # Hero banner, trending, moods
│       ├── SearchScreen.tsx         # Search + smart filters
│       ├── MovieDetailScreen.tsx    # Full movie info + actions
│       ├── LibraryScreen.tsx        # Watchlist/watching/watched
│       ├── DiscoverScreen.tsx       # Mood-based discovery
│       ├── StatsScreen.tsx          # Analytics dashboard
│       ├── AIScreen.tsx             # Claude AI recommendations
│       └── SettingsScreen.tsx       # Lock, display, export
└── android/
    ├── WIDGET_MANIFEST_SNIPPET.xml  # Copy this into AndroidManifest
    └── app/src/main/
        ├── java/com/infash/cinevault/
        │   └── CineVaultWidget.java # Widget provider
        └── res/
            ├── xml/cinevault_widget_info.xml
            ├── layout/cinevault_widget.xml
            └── drawable/widget_*.xml
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Run `npm install --legacy-peer-deps` |
| Expo Go can't connect | Make sure PC and tablet are on same WiFi |
| Biometric not showing | Enroll fingerprint in Xiaomi Pad 7 Settings first |
| Widget not appearing | Must install as APK (not via Expo Go) |
| TMDb images not loading | Check internet connection; TMDb CDN requires HTTPS |
| AI screen shows error | Claude API requires internet; check connection |
| App crashes on launch | Run `npx expo start --clear` to clear Metro cache |

---

## Next Features (Phase 2)

- [ ] Collections — custom movie lists (Horror Night, Date Movies…)
- [ ] Barcode scan — scan DVD/Blu-ray to add movie
- [ ] Import from Letterboxd CSV
- [ ] Advanced stats — genre pie chart, watched by year
- [ ] Friends / share your watchlist
- [ ] Push notifications — reminder to watch queued films
- [ ] Multiple widget sizes (2x1, 4x2, 4x4)

---

*CineVault v1.0 · Built by Claude for Infash · Xiaomi Pad 7 optimized*
