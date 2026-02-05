# 📱 Android Device Connection Guide

This guide will walk you through connecting your Android device for Appium testing.

## Step 1: Enable Developer Options on Your Android Device

### Method 1: Standard Android (most devices)
1. Open **Settings** app
2. Scroll down to **About phone** (or **About device**)
3. Find **Build number** and tap it **7 times** rapidly
4. You'll see a countdown: "You are now X steps away from being a developer"
5. After 7 taps, you'll see: **"You are now a developer!"**

### Method 2: Samsung Devices
1. **Settings** → **About phone** → **Software information**
2. Tap **Build number** 7 times

### Method 3: Xiaomi/Redmi Devices
1. **Settings** → **About phone** → **MIUI version**
2. Tap **MIUI version** 7 times

---

## Step 2: Enable USB Debugging

Once Developer Options is unlocked:

1. Go back to **Settings**
2. Look for **System** → **Developer options** (or **Additional settings** → **Developer options**)
3. **Turn ON** the main toggle at the top
4. Find and **Enable USB debugging**
5. When prompted, tap **OK** to allow

**Recommended additional settings:**
- **Stay awake** - Keep screen on while charging (helps during testing)
- **Disable permission monitoring** (if available) - Prevents permission dialogs from blocking tests

---

## Step 3: Connect Your Device via USB

1. **Use a good quality USB cable** (some cables only charge, don't transfer data)
2. **Connect your Android device to your computer**
3. On your device, you'll see a popup: **"Allow USB debugging?"**
4. ✅ **Check** "Always allow from this computer"
5. Tap **OK**

**If you don't see the popup:**
- Try a different USB port
- Try a different USB cable
- Unplug and reconnect
- Check that USB debugging is still enabled

---

## Step 4: Verify Connection

Open PowerShell or Command Prompt and run:

```bash
adb devices
```

**Expected output:**
```
List of devices attached
ABC123DEF456    device
```

**If you see:**
```
List of devices attached
ABC123DEF456    unauthorized
```
→ Check your device for the USB debugging popup and tap OK

**If you see:**
```
List of devices attached
(empty)
```
→ Device not detected. Try:
1. `adb kill-server` then `adb start-server`
2. Different USB cable/port
3. Re-enable USB debugging
4. Restart your device

---

## Step 5: Trust Your Computer (First Time Only)

When running Appium tests for the first time, you may see:

**"Allow USB debugging?"** popup → Tap **OK**

**"Allow app to access your location?"** → Your test script handles this with `autoGrantPermissions: true`

---

## Common Issues & Solutions

### Issue: "device offline"
```bash
adb kill-server
adb start-server
adb devices
```

### Issue: "unauthorized"
1. On device: **Settings** → **Developer options** → **Revoke USB debugging authorizations**
2. Reconnect USB cable
3. Accept the new authorization popup

### Issue: Device not listed
1. Check Windows Device Manager - should show Android device
2. Install USB drivers:
   - **Samsung**: https://developer.samsung.com/android-usb-driver
   - **Google**: https://developer.android.com/studio/run/win-usb
   - **Xiaomi**: https://en.miui.com/thread-1951192-1-1.html
   - **OnePlus**: https://www.oneplus.com/support/softwareupgrade

### Issue: Tests start but don't interact with device
- Make sure screen is **unlocked**
- Disable any **screen lock** or **password** temporarily for testing
- Keep device **awake** during tests

---

## Quick Checklist Before Running Tests

- [ ] Developer options enabled
- [ ] USB debugging enabled
- [ ] Device connected via USB
- [ ] "Allow USB debugging" popup accepted
- [ ] `adb devices` shows device as "device" (not "unauthorized")
- [ ] Screen is unlocked
- [ ] App is installed on device

---

## Getting Your Device Info (Optional)

To see detailed device information:

```bash
# Device model
adb shell getprop ro.product.model

# Android version
adb shell getprop ro.build.version.release

# Device ID
adb shell settings get secure android_id

# Battery level
adb shell dumpsys battery | findstr level
```

---

## Next Steps

Once your device is connected:

1. **Set environment variables** (run as Administrator):
   ```powershell
   .\setup-environment.ps1
   ```

2. **Restart your terminal/IDE**

3. **Start Appium server**:
   ```bash
   npm run appium:start
   ```

4. **Run tests**:
   ```bash
   npm run test:android:device
   ```

Watch your phone screen - you'll see the app being automated like magic! ✨
