# Automated Testing Setup Guide

## Option 1: Detox (Recommended for React Native)

### What is Detox?
- Gray box end-to-end testing framework for React Native
- Runs tests on actual devices/simulators
- Fast, stable, and designed for mobile apps
- Works with Expo

### Setup Steps

```bash
# 1. Install Detox CLI globally
npm install -g detox-cli

# 2. Install Detox in your project
npm install --save-dev detox

# 3. Install Jest (test runner)
npm install --save-dev jest

# 4. Initialize Detox configuration
detox init
```

### Configuration (.detoxrc.js)

```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VibeventzApp.app',
      build: 'xcodebuild -workspace ios/VibeventzApp.xcworkspace -scheme VibeventzApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_31'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};
```

### Sample Test (e2e/bookingFlow.test.js)

```javascript
describe('Booking Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show home screen with slider', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('hero-slider'))).toBeVisible();
  });

  it('should allow searching for vendors', async () => {
    await element(by.id('search-input')).typeText('venue');
    await expect(element(by.text('Oceanview Wedding Estate'))).toBeVisible();
  });

  it('should add vendor to favorites', async () => {
    await element(by.id('vendor-card-1')).tap();
    await element(by.id('favorite-button')).tap();
    await element(by.text('Profile')).tap();
    await element(by.text('My Favorites')).tap();
    await expect(element(by.text('Oceanview Wedding Estate'))).toBeVisible();
  });

  it('should create a task in planner', async () => {
    await element(by.text('Planner')).tap();
    await element(by.id('add-task-button')).tap();
    await element(by.id('task-title-input')).typeText('Book DJ');
    await element(by.text('Add Task')).tap();
    await expect(element(by.text('Book DJ'))).toBeVisible();
  });

  it('should accept quote and navigate to payment', async () => {
    await element(by.text('Quotes')).tap();
    await element(by.id('quote-3')).tap();
    await element(by.text('Accept Quote & Book')).tap();
    await expect(element(by.id('payment-webview'))).toBeVisible();
  });
});
```

### Run Tests

```bash
# iOS Simulator
detox test --configuration ios.sim.debug

# Android Emulator
detox test --configuration android.emu.debug
```

---

## Option 2: Maestro (Easiest Setup)

### What is Maestro?
- Mobile UI testing framework
- Works with iOS and Android
- Simple YAML-based test definitions
- No code required
- Works with Expo

### Setup

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### Sample Test (maestro/booking-flow.yaml)

```yaml
appId: host.exp.exponent  # Expo Go app ID
---
- launchApp
- tapOn: "Home"
- assertVisible: "What are you looking for?"

# Test search
- tapOn: "Search..."
- inputText: "venue"
- assertVisible: "Oceanview Wedding Estate"

# Test favorites
- tapOn: "Oceanview Wedding Estate"
- tapOn: 
    id: "favorite-button"
- tapOn: "Profile"
- tapOn: "My Favorites"
- assertVisible: "Oceanview Wedding Estate"

# Test planner
- tapOn: "Planner"
- tapOn:
    id: "add-task-button"
- inputText: "Book DJ"
- tapOn: "Add Task"
- assertVisible: "Book DJ"

# Test quote acceptance
- tapOn: "Quotes"
- tapOn: "Test User"
- tapOn: "Accept Quote & Book"
- assertVisible: "payfast"
```

### Run Tests

```bash
# Run on connected device/simulator
maestro test maestro/booking-flow.yaml

# Run with Maestro Cloud (CI/CD)
maestro cloud maestro/booking-flow.yaml
```

---

## Option 3: Appium (Most Flexible)

### What is Appium?
- Cross-platform mobile automation
- Works with any language (JavaScript, Python, Java)
- Industry standard
- More complex setup

### Setup

```bash
# Install Appium
npm install -g appium

# Install Appium Doctor (checks dependencies)
npm install -g appium-doctor

# Check setup
appium-doctor --android
appium-doctor --ios
```

### Sample Test (appium/test.js)

```javascript
const wdio = require('webdriverio');

const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    platformVersion: '11',
    deviceName: 'Android Emulator',
    app: '/path/to/app.apk',
    automationName: 'UiAutomator2'
  }
};

async function main() {
  const client = await wdio.remote(opts);

  // Test home screen
  const searchInput = await client.$('~search-input');
  await searchInput.setValue('venue');
  
  // Test favorites
  const vendorCard = await client.$('~vendor-card-1');
  await vendorCard.click();
  
  const favoriteBtn = await client.$('~favorite-button');
  await favoriteBtn.click();

  await client.deleteSession();
}

main();
```

---

## Option 4: Jest + React Native Testing Library (Unit/Integration)

### What is it?
- Component-level testing
- Fast and reliable
- Good for testing logic
- Doesn't test actual UI rendering

### Setup

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### Sample Test (src/__tests__/QuoteDetailScreen.test.tsx)

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuoteDetailScreen from '../screens/QuoteDetailScreen';

describe('QuoteDetailScreen', () => {
  it('should show accept button for priced quotes', async () => {
    const { getByText } = render(<QuoteDetailScreen />);
    
    await waitFor(() => {
      expect(getByText('Accept Quote & Book')).toBeTruthy();
    });
  });

  it('should navigate to payment on accept', async () => {
    const { getByText } = render(<QuoteDetailScreen />);
    
    const acceptButton = getByText('Accept Quote & Book');
    fireEvent.press(acceptButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Payment', expect.any(Object));
    });
  });
});
```

---

## Comparison Table

| Feature | Detox | Maestro | Appium | Jest/RTL |
|---------|-------|---------|--------|----------|
| **Setup Complexity** | Medium | Easy | Hard | Easy |
| **Speed** | Fast | Fast | Medium | Very Fast |
| **Real Device Testing** | Yes | Yes | Yes | No |
| **Expo Support** | Good | Excellent | Good | Excellent |
| **Learning Curve** | Medium | Low | High | Low |
| **CI/CD Integration** | Excellent | Good | Excellent | Excellent |
| **Best For** | E2E Testing | Quick E2E | Enterprise | Unit Tests |

---

## My Recommendation

**For your use case, I recommend Maestro:**

### Why Maestro?
1. ✅ **Easiest setup** - Works in minutes
2. ✅ **Expo-friendly** - No build required
3. ✅ **YAML-based** - No coding needed
4. ✅ **Visual feedback** - Shows what it's doing
5. ✅ **Cloud testing** - Can run on Maestro Cloud

### Quick Start with Maestro

```bash
# 1. Install
curl -Ls "https://get.maestro.mobile.dev" | bash

# 2. Start your Expo app
# (already running on your tunnel)

# 3. Connect device or start simulator
# iOS: Open Simulator
# Android: Start emulator

# 4. Create test file
mkdir maestro
# (I'll create the test file for you)

# 5. Run test
maestro test maestro/booking-flow.yaml
```

Would you like me to:
1. **Create a complete Maestro test suite** for your booking flow?
2. **Set up Detox** with full configuration?
3. **Create Jest unit tests** for your components?

Let me know which approach you prefer!
