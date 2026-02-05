# 🎮 Android Emulator Setup (Easiest Option!)

Using an Android Emulator is actually **easier than a real device** - everything is automated!

## 🚀 Quick Start (3 Steps)

### Step 1: Install the Emulator

**Option A: Install Android Studio (Recommended)**
1. Download: https://developer.android.com/studio
2. Install with default settings
3. This automatically gives you the emulator

**Option B: Minimal Install (Command Line)**
```bash
cd e2e-tests
setup-emulator.bat
```

---

### Step 2: Start the Emulator

**Double-click:** `start-emulator.bat`

Or run in terminal:
```bash
cd e2e-tests
start-emulator.bat
```

**Wait 1-2 minutes** for the Android home screen to appear.

You'll see a virtual phone screen on your computer!

---

### Step 3: Install Your App & Run Tests

**In a new PowerShell terminal:**

1. **Install your app on emulator** (if not already installed):
   ```bash
   cd ..\  # Go to project root
   npx expo build:android -t apk
   adb install .\app.apk  # Replace with your APK path
   ```
   
   Or if using Expo:
   ```bash
   npx expo start
   # Press 'a' to open on Android emulator
   ```

2. **Start Appium Server** (keep this running):
   ```bash
   cd e2e-tests
   npm run appium:start
   ```

3. **Run Tests** (in another terminal):
   ```bash
   cd e2e-tests
   npm run test:android
   ```

---

## 📱 What's Happening?

A virtual Android phone runs on your computer:
- **Same as real device** - just software-based
- **No USB cables** needed
- **Easy reset** - just restart emulator
- **Screenshot & video recording** built-in

---

## 🔧 Alternative: Use Android Studio GUI

If you prefer a graphical interface:

1. Open **Android Studio**
2. Click **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Select **Pixel 4** → **Download** Android 11 system image
5. Click **Finish**
6. Click **Launch** ▶️ to start emulator

---

## ✅ Verification

After starting emulator, verify it works:

```bash
# Check emulator is detected
adb devices

# Expected output:
List of devices attached
emulator-5554   device
```

---

## 🎯 Ready-to-Use Scripts

| Script | What it does |
|--------|-------------|
| `setup-emulator.bat` | Installs emulator system image |
| `start-emulator.bat` | Launches the emulator |
| `quick-setup.bat` | Verifies everything is ready |

---

## 🐛 Troubleshooting

### Emulator won't start
- **Enable Intel VT-x / AMD-V** in your BIOS (virtualization technology)
- Or use **ARM emulator** (slower but no virtualization needed)

### "HAXM not installed"
1. Download Intel HAXM: https://github.com/intel/haxm/releases
2. Or use Windows Hypervisor Platform (WHPX) instead

### App not installing
- Make sure you're using compatible APK (x86 architecture)
- Or rebuild with: `npx expo build:android`

### Tests can't find elements
- Make sure app is **already open** on emulator
- Add `await driver.pause(5000)` after app launch to wait for loading

---

## 📊 Which is Better?

| Feature | Real Device | Emulator |
|---------|-------------|----------|
| **Setup** | ⚠️ USB debugging, drivers | ✅ One click |
| **Speed** | ✅ Fast | ⚠️ Slower (but fine) |
| **Reliability** | ✅ Most accurate | ✅ Good for UI tests |
| **Reset** | ❌ Manual | ✅ Just restart |
| **Recording** | ❌ Hard | ✅ Easy |
| **CI/CD** | ❌ Hard | ✅ Easy |

**For testing: Emulator wins!** 🏆

---

## 🎬 Start Testing Now!

1. Run `start-emulator.bat`
2. Wait for Android to boot
3. Open your app on the emulator (or install it)
4. `npm run appium:start` in Terminal 1
5. `npm run test:android` in Terminal 2

Watch the magic happen! ✨
