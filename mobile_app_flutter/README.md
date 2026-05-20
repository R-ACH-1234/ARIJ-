# ARiJ Radio - Mobile App Setup Guide

This directory contains the production-ready code to wrap your Web App into a native mobile application using **Flutter**.

## Prerequisites
1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install).
2. Install Android Studio (for Android builds) or Xcode (for iOS builds).

## How to Initialize the Project

1. Open your terminal and create a new Flutter project:
   ```bash
   flutter create arij_radio
   cd arij_radio
   ```

2. Replace the generated files with the ones provided in this directory:
   - Copy `pubspec.yaml` and run `flutter pub get`.
   - Replace `lib/main.dart` with the provided `main.dart`.
   - Update `android/app/src/main/AndroidManifest.xml` with the provided AndroidManifest snippet.
   - Update `ios/Runner/Info.plist` with the provided Info.plist snippet.

## AdMob Testing vs Production (Crucial)
In `lib/main.dart`, there is a variable called `_isTestMode = true;`. 
- **During Development/Testing:** Keep it `true`. Google will send test ads (preventing your account from getting banned for artificial clicks).
- **Before Publishing to Play Store/App Store:** Change it to `false`. Your real Banner AD ID (`ca-app-pub-91579204...`) will be activated.

## Building for Production

### Android (.aab / .apk)
To generate the App Bundle for the Google Play Store:
```bash
flutter build appbundle --release
```
To build an APK for direct testing on your phone:
```bash
flutter build apk --release
```

### iOS (App Store)
Open the app in Xcode:
```bash
open ios/Runner.xcworkspace
```
1. Select your Apple Developer Team in Signing & Capabilities.
2. Select Product > Archive to generate the build for App Store Connect.
