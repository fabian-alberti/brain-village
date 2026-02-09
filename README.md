# Brain Village 🏘️

A mobile application designed to help users reduce their screen time and build healthier digital habits through gamification.

## Features

### Goals Management
- Create custom screen time goals
- Choose from three goal types:
  - **Overall Screen Time**: Limit your total daily screen time
  - **App Time Limit**: Limit time spent on specific apps
  - **App Opens Limit**: Limit how often you open specific apps
- Track progress with visual indicators
- Earn XP for completing goals

### Village (Gamification Hub)
- Watch your village grow as you earn XP
- 5 village levels from "Humble Beginnings" to "Thriving Kingdom"
- Each level has two states:
  - **Flourishing**: When you're meeting your goals
  - **Destroyed**: When you miss goals consecutively (2+ times)

### Profile & Settings
- View your stats: Total XP, Level, Goals Completed, Streak
- Configure notifications and reminder times
- Theme preferences (Light/Dark/System)

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **Backend**: Firebase (Auth + Firestore)
- **Styling**: NativeWind (Tailwind CSS)
- **Graphics**: React Native SVG

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator or physical device with Expo Go

### Installation

1. Clone the repository:
```bash
cd Brain_Village
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Update the Firebase config in `lib/firebase.ts` with your project credentials

4. Start the development server:
```bash
npm start
```

5. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Project Structure

```
Brain_Village/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Goals screen
│   │   ├── village.tsx    # Village screen
│   │   └── profile.tsx    # Profile screen
│   ├── goal/              # Goal-related screens
│   │   ├── create.tsx     # Create/edit goal
│   │   └── [id].tsx       # Goal detail view
│   ├── _layout.tsx        # Root layout
│   └── login.tsx          # Authentication screen
├── components/            # Reusable components
│   ├── goals/            # Goal-related components
│   ├── village/          # Village illustrations
│   └── ui/               # Shared UI components
├── context/              # React Context providers
│   └── AppContext.tsx    # Global app state
├── lib/                  # Utilities and configuration
│   ├── firebase.ts       # Firebase configuration
│   ├── types.ts          # TypeScript interfaces
│   └── xp.ts             # XP/leveling utilities
└── assets/               # Images and fonts
```

## XP System

| Goal Type | Base XP | With Strict Limit |
|-----------|---------|-------------------|
| Overall Screen Time | 50 XP | 75 XP (≤30min) |
| App Time Limit | 30 XP | 45 XP (≤30min) |
| App Opens Limit | 20 XP | 30 XP (≤5 opens) |

## Level Thresholds

| Level | XP Required | Village State |
|-------|-------------|---------------|
| 1 | 0 | Small Hut |
| 2 | 100 | Cottage |
| 3 | 300 | Town Square |
| 4 | 600 | Busy Village |
| 5 | 1000 | Kingdom |

## Firebase Security Rules

For production, add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dailyLogs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Building for Production

### iOS
```bash
npx expo build:ios
# or with EAS
npx eas build --platform ios
```

### Android
```bash
npx expo build:android
# or with EAS
npx eas build --platform android
```

## License

This project is private and proprietary.
