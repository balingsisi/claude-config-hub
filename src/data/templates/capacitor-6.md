# Capacitor 6 Template

## Project Overview

Cross-platform mobile application development with Capacitor 6, featuring native plugins, modern web technologies, and seamless deployment to iOS and Android.

## Tech Stack

- **Framework**: Capacitor 6
- **Frontend**: React / Vue / Angular / Svelte
- **Native**: iOS (Swift) / Android (Kotlin)
- **Language**: TypeScript
- **Build**: Vite / Webpack
- **Plugins**: Capacitor Community Plugins

## Project Structure

```
project/
├── src/                      # Web app source code
│   ├── components/           # UI components
│   ├── pages/                # Page components
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Helper functions
│   ├── services/             # API services
│   ├── store/                # State management
│   └── App.tsx               # Root component
├── public/                   # Static assets
├── ios/                      # iOS native project
│   ├── App/
│   │   ├── App.swift
│   │   └── Info.plist
│   └── Podfile
├── android/                  # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── capacitor.config.ts       # Capacitor configuration
├── package.json
└── vite.config.ts            # Build configuration
```

## Key Patterns

### 1. Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

### 2. Platform Detection

```typescript
// src/utils/platform.ts
import { Capacitor } from '@capacitor/core';

export const platform = {
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
  isWeb: Capacitor.getPlatform() === 'web',
  isNative: Capacitor.isNativePlatform(),
};

export const getPlatform = () => Capacitor.getPlatform();
```

### 3. Native Storage

```typescript
// src/services/storage.ts
import { Preferences } from '@capacitor/preferences';

export const storage = {
  async get(key: string) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any) {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  },

  async remove(key: string) {
    await Preferences.remove({ key });
  },

  async clear() {
    await Preferences.clear();
  },
};
```

### 4. Camera Integration

```typescript
// src/hooks/useCamera.ts
import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export function useCamera() {
  const [photo, setPhoto] = useState<string | null>(null);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      setPhoto(`data:image/jpeg;base64,${image.base64String}`);
      return image;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  };

  const chooseFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      setPhoto(`data:image/jpeg;base64,${image.base64String}`);
      return image;
    } catch (error) {
      console.error('Gallery error:', error);
      return null;
    }
  };

  return { photo, takePhoto, chooseFromGallery };
}
```

### 5. Geolocation

```typescript
// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export function useGeolocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
    } catch (err) {
      setError('Unable to get location');
      console.error(err);
    }
  };

  const watchPosition = async () => {
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          setError('Unable to watch location');
          return;
        }

        if (position) {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      }
    );

    return watchId;
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);

  return { location, error, getCurrentPosition, watchPosition };
}
```

### 6. Push Notifications

```typescript
// src/services/notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  // Request permission
  const result = await PushNotifications.requestPermissions();

  if (result.receive === 'granted') {
    // Register with Apple / Google
    await PushNotifications.register();
  }

  // Handle registration
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token:', token.value);
  });

  // Handle registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Handle notification received
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  // Handle notification action
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action performed:', action);
  });
}
```

### 7. Custom Native Plugin

```typescript
// src/plugins/CustomPlugin.ts
import { registerPlugin } from '@capacitor/core';

export interface CustomPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}

const CustomPlugin = registerPlugin<CustomPlugin>('CustomPlugin');

export default CustomPlugin;
```

```swift
// ios/App/App/CustomPlugin.swift
import Capacitor

@objc(CustomPlugin)
public class CustomPlugin: CAPPlugin {
  @objc func echo(_ call: CAPPluginCall) {
    let value = call.getString("value") ?? ""
    call.success([
      "value": value
    ])
  }
}
```

```kotlin
// android/app/src/main/java/com/example/app/CustomPlugin.kt
package com.example.app

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "CustomPlugin")
class CustomPlugin : Plugin() {
  @PluginMethod
  fun echo(call: PluginCall) {
    val value = call.getString("value")
    call.success(mapOf("value" to value))
  }
}
```

## Best Practices

1. **Progressive Enhancement**: Ensure app works on web first
2. **Native Features**: Gracefully degrade when plugins unavailable
3. **Performance**: Optimize images and bundle size
4. **Security**: Secure storage for sensitive data
5. **Testing**: Test on real devices frequently

## Common Commands

```bash
# Development
npm run dev

# Build web app
npm run build

# Add platforms
npx cap add ios
npx cap add android

# Sync native projects
npx cap sync

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android

# Run on iOS
npx cap run ios

# Run on Android
npx cap run android

# Update native dependencies
npx cap update ios
npx cap update android

# Copy web assets
npx cap copy

# List plugins
npx cap plugin:list
```

## Plugin Ecosystem

### Core Plugins

| Plugin | Purpose |
|--------|---------|
| @capacitor/camera | Camera and photo gallery |
| @capacitor/geolocation | GPS location |
| @capacitor/push-notifications | Push notifications |
| @capacitor/storage | Key-value storage |
| @capacitor/network | Network status |
| @capacitor/browser | In-app browser |
| @capacitor/haptics | Haptic feedback |
| @capacitor/keyboard | Keyboard control |
| @capacitor/splash-screen | Splash screen |
| @capacitor/status-bar | Status bar control |

### Community Plugins

```bash
# Install community plugins
npm install @capacitor-community/facebook-login
npm install @capacitor-community/googlemaps
npm install @capacitor-community/sqlite
npm install @capacitor-community/contacts
```

## Platform-Specific Configuration

### iOS Configuration

```xml
<!-- ios/App/App/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to take photos</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby places</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select photos</string>
```

```swift
// ios/App/App/AppDelegate.swift
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    return true
  }
}
```

### Android Configuration

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

```gradle
// android/app/build.gradle
android {
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
  }
}

dependencies {
  implementation project(':capacitor-android')
}
```

## App Store Deployment

### iOS (App Store)

1. **Build and Archive**:
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **In Xcode**:
   - Select production scheme
   - Product > Archive
   - Upload to App Store Connect

3. **App Store Connect**:
   - Configure app metadata
   - Submit for review

### Android (Play Store)

1. **Build Signed APK**:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **In Android Studio**:
   - Build > Generate Signed Bundle / APK
   - Select APK or App Bundle
   - Configure signing key

3. **Google Play Console**:
   - Upload APK/AAB
   - Configure store listing
   - Submit for review

## Live Updates

### Using Capacitor Update

```typescript
// src/services/liveUpdates.ts
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export async function checkForUpdates() {
  try {
    const update = await CapacitorUpdater.download({
      url: 'https://example.com/update.zip',
    });

    if (update) {
      await CapacitorUpdater.set(update);
      console.log('Update installed');
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

## Debugging

### iOS Debugging

```bash
# View logs
npx cap run ios --livereload --external

# Safari Web Inspector
# Safari > Develop > [Device] > [App]
```

### Android Debugging

```bash
# View logs
npx cap run android --livereload --external

# Chrome DevTools
# chrome://inspect/#devices
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Plugin Directory](https://capacitorjs.com/docs/plugins)
- [iOS Configuration](https://capacitorjs.com/docs/ios)
- [Android Configuration](https://capacitorjs.com/docs/android)
- [CapGo Live Updates](https://capgo.app/)
