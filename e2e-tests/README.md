# Funcxon E2E Testing with Appium

This directory contains end-to-end tests for the Funcxon app using **Appium** and **WebdriverIO**.

## How Appium Works

Appium acts as a bridge between your test scripts and the actual device:
1. Your test code sends commands (e.g., "click button", "type text")
2. Appium translates these into native automation commands (UIAutomator2 for Android, XCUITest for iOS)
3. Commands execute on your real device exactly like a user tapping the screen

## Prerequisites

### 1. Install Required Tools

**Android SDK & Platform Tools:**
- Download Android Studio or just SDK Command Line Tools
- Set environment variables:
  ```
  ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk
  PATH=%ANDROID_HOME%\platform-tools;%PATH%
  ```

**Java JDK 11 or higher:**
- Download from Oracle or use OpenJDK
- Set `JAVA_HOME` environment variable

**Node.js 16+**

### 2. Enable Developer Options on Your Android Device

1. Go to **Settings > About phone**
2. Tap **Build number** 7 times to enable Developer Options
3. Go to **Settings > System > Developer Options**
4. Enable:
   - **USB Debugging** (required)
   - **Stay awake** (recommended for testing)
   - **Disable permission monitoring** (if available, prevents popups)

### 3. Connect Your Device

1. Connect your Android device via USB
2. Accept the "Allow USB debugging?" prompt on your device
3. Verify connection:
   ```bash
   adb devices
   ```
   You should see your device listed like:
   ```
   List of devices attached
   ABC123DEF456    device
   ```

## Setup Instructions

### 1. Install Dependencies

```bash
cd e2e-tests
npm install
```

This installs:
- Appium server (v2.x)
- WebdriverIO test framework
- Android driver (UiAutomator2)
- iOS driver (XCUITest)
- TypeScript support

### 2. Install Appium Drivers

```bash
# Install Android driver
npx appium driver install uiautomator2

# Install iOS driver (for iOS testing)
npx appium driver install xcuitest
```

### 3. Verify Setup

```bash
# Check Appium is properly installed
npx appium-doctor --android

# Start Appium server
npm run appium:start
```

## Preparing Your App for Testing

### Option 1: Use Already Installed App
If your app is already installed on the device, just update `wdio.android.conf.ts`:
```typescript
'appium:appPackage': 'com.anonymous.vibeventzapp',
'appium:appActivity': '.MainActivity',
```

### Option 2: Install from APK
1. Build your APK in the main project:
   ```bash
   cd ..
   npx expo build:android -t apk
   # or
   eas build -p android --profile preview
   ```
2. Update `wdio.android.conf.ts`:
   ```typescript
   'appium:app': 'C:\\path\\to\\your\\app.apk',
   ```

## Running Tests

### 1. Start Appium Server
In a separate terminal:
```bash
cd e2e-tests
npm run appium:start
```

### 2. Run Tests on Real Android Device
```bash
npm run test:android:device
```

## Test Structure

```
e2e-tests/
├── tests/
│   └── user-journey.spec.ts    # Main test suite
├── wdio.android.conf.ts        # Android configuration
├── wdio.android.device.conf.ts # Real device config
├── wdio.ios.conf.ts            # iOS configuration
├── package.json
└── tsconfig.json
```

### Test Coverage

The `user-journey.spec.ts` includes tests for:

1. **Welcome Screen**
   - Display and Get Started button
   - Navigation to home screen

2. **Home Screen - Filters**
   - Service type selection (Venues/Vendors/All)
   - Province selector
   - City selector (requires province first)
   - "Use my location" button
   - Search button
   - Clear All button

3. **Home Screen - Vendor Interaction**
   - Scroll through categories
   - Click category filters
   - View vendor profiles
   - Favorite/unfavorite vendors

4. **Quote Request Flow**
   - Navigate to quote request
   - Fill out quote form
   - Submit quote

5. **Navigation Tabs**
   - Quotes tab
   - Favourites tab
   - Profile/More tab

## Adding Accessibility IDs

For reliable testing, add `accessibilityLabel` or `testID` props to your React Native components:

```tsx
// Example: Add to your components
<TouchableOpacity 
  accessibilityLabel="get-started-button"
  testID="get-started-button"
  onPress={handleGetStarted}
>
  <Text>Get Started</Text>
</TouchableOpacity>
```

Key elements to add IDs to:
- All buttons (Get Started, Search, Clear All, etc.)
- Input fields (use `accessibilityLabel`)
- Tab navigation items
- Vendor cards
- Filter selectors

## Debugging Tests

### View Appium Logs
Appium logs show exactly what commands are sent to the device. Look for:
- Element find commands
- Click/tap coordinates
- Error messages

### Inspect Elements
Use Appium Inspector to find element locators:
```bash
# Install Appium Inspector separately from:
# https://github.com/appium/appium-inspector/releases

# Start Appium server first, then open Inspector and:
# 1. Set Remote Host: localhost
# 2. Set Remote Port: 4723
# 3. Set Remote Path: /
# 4. Add your capabilities
# 5. Click Start Session
```

### Common Issues

**Device not found:**
```bash
adb kill-server
adb start-server
adb devices
```

**App not installed:**
- Install the APK first or use `noReset: false` in config

**Element not found:**
- Add explicit waits: `await driver.pause(2000)`
- Use accessibility labels
- Check element exists with `await expect(element).toBeDisplayed()`

**Permission dialogs blocking:**
- Add to wdio config: `'appium:autoGrantPermissions': true`
- Or handle manually in tests

## CI/CD Integration

For automated testing in CI/CD:

```yaml
# Example GitHub Actions workflow
name: E2E Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd e2e-tests
          npm install
      - name: Start Appium
        run: |
          cd e2e-tests
          npm run appium:start &
      - name: Run tests
        run: |
          cd e2e-tests
          npm run test:android
```

## Next Steps

1. **Install dependencies** (`npm install` in e2e-tests directory)
2. **Add accessibility labels** to key components in your React Native app
3. **Connect your Android device** and verify with `adb devices`
4. **Run a simple test** to verify setup works
5. **Expand test coverage** based on your app's features

For questions or issues, check:
- Appium docs: https://appium.io/docs/en/2.0/
- WebdriverIO docs: https://webdriver.io/
