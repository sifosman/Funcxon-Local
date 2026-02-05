# 🎯 EASIEST Emulator Setup (Using Android Studio)

Since the command line tools aren't installed, here's the **simplest path**:

## Option 1: Use Android Studio (RECOMMENDED - 5 minutes)

### Step 1: Download & Install Android Studio
1. Go to: https://developer.android.com/studio
2. Click **Download Android Studio**
3. Run the installer, keep all default options ☑️
4. Wait for installation to complete

### Step 2: Create Virtual Device (2 minutes)
1. Open **Android Studio**
2. Click **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Select **Phone** → **Pixel 4** → **Next**
5. Download **Android 11.0 (API 30)** - click the Download link
6. Click **Next** → **Finish**

### Step 3: Start the Emulator
1. In Virtual Device Manager, click the **Play button** ▶️ next to your device
2. Wait 1-2 minutes for Android to boot
3. You'll see a phone screen on your computer!

### Step 4: Install Your App

**Using Expo (Easiest):**
```bash
# In your project root
cd C:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local
npx expo start
```
Then press **'a'** on your keyboard to open on Android emulator.

**Or using APK:**
```bash
# Build the APK
npx expo build:android -t apk

# Install it
adb install path/to/your/app.apk
```

### Step 5: Run Tests

**Terminal 1:**
```bash
cd e2e-tests
npm run appium:start
```

**Terminal 2:**
```bash
cd e2e-tests
npm run test:android
```

---

## Option 2: Quick Manual Setup (Without Android Studio)

If you want to avoid Android Studio, download these directly:

1. **Command Line Tools Only:**
   - Download: https://developer.android.com/studio#command-tools
   - Extract to: `C:\Users\Administrator\AppData\Local\Android\Sdk\cmdline-tools\latest`

2. **Then run:**
   ```bash
   cd e2e-tests
   setup-emulator.bat
   ```

---

## ✅ Verify Everything Works

After emulator is running, check:

```bash
# Verify emulator is detected
adb devices

# Should show:
List of devices attached
emulator-5554   device
```

Then start testing!

---

## 🎬 Summary of What You'll See

1. **Emulator starts** → Virtual phone appears on screen
2. **Appium starts** → Terminal shows "Appium REST http interface listener started"
3. **Tests run** → You'll see the emulator automatically:
   - Open the app
   - Click "Get Started"
   - Navigate through screens
   - Fill forms
   - Click buttons

All happening automatically like magic! ✨

---

## Need Help?

- **Emulator won't start?** → Make sure virtualization is enabled in BIOS
- **App won't install?** → Try rebuilding with `npx expo build:android`
- **Tests fail?** → Check that app is open on emulator first
