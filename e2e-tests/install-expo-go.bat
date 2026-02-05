@echo off
echo ========================================
echo Install Expo Go on Emulator
echo ========================================
echo.

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

:: Check if emulator is connected
echo Checking emulator connection...
"%ADB%" devices | findstr "emulator" >nul
if errorlevel 1 (
    echo ❌ No emulator found. Please start your Android emulator first.
    echo.
    pause
    exit /b 1
)

echo ✅ Emulator connected
echo.

:: Download Expo Go APK if not exists
if not exist "expo-go.apk" (
    echo Downloading Expo Go APK...
    powershell -Command "Invoke-WebRequest -Uri 'https://d1ahtucjixef4r.cloudfront.net/Exponent-2.29.4.apk' -OutFile 'expo-go.apk'"
    if errorlevel 1 (
        echo ❌ Failed to download. Trying alternative URL...
        powershell -Command "Invoke-WebRequest -Uri 'https://expo.dev/client/apk' -OutFile 'expo-go.apk'"
    )
)

if exist "expo-go.apk" (
    echo ✅ Expo Go APK downloaded
    echo.
    echo Installing Expo Go on emulator...
    "%ADB%" install -r expo-go.apk
    if errorlevel 1 (
        echo ⚠️  Installation failed. Trying to launch existing Expo Go...
    ) else (
        echo ✅ Expo Go installed successfully!
    )
) else (
    echo ❌ Could not download Expo Go. Please install manually from Play Store.
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Start Expo dev server:
echo    npx expo start
echo.
echo 2. In the terminal, press 'a' to open on Android
echo    OR scan QR code with Expo Go app
echo.
echo 3. Once app is running, start Appium tests
echo.
pause
