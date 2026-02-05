@echo off
echo ========================================
echo Appium Quick Environment Setup
echo ========================================
echo.
echo This will set up environment variables for Appium testing.
echo.

:: Find Android SDK
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_SDK%\platform-tools\adb.exe" (
    echo ❌ Android SDK not found at: %ANDROID_SDK%
    echo.
    echo Please install Android Studio from:
    echo https://developer.android.com/studio
    echo.
    echo Or download just the SDK Command Line Tools:
    echo https://developer.android.com/studio#command-tools
    echo.
    pause
    exit /b 1
)

echo ✅ Found Android SDK at: %ANDROID_SDK%

:: Set environment variables for current session
set "ANDROID_HOME=%ANDROID_SDK%"
set "ANDROID_SDK_ROOT=%ANDROID_SDK%"

:: Add to PATH if not already there
echo %PATH% | find /i "%ANDROID_SDK%\platform-tools" >nul || set "PATH=%PATH%;%ANDROID_SDK%\platform-tools"

echo.
echo ========================================
echo Environment variables set for this session:
echo   ANDROID_HOME = %ANDROID_HOME%
echo   ANDROID_SDK_ROOT = %ANDROID_SDK_ROOT%
echo ========================================
echo.

:: Verify adb works
echo Testing ADB connection...
adb devices
echo.

:: Check for connected devices
for /f "tokens=1" %%a in ('adb devices ^| findstr /v "List of" ^| findstr /v "^$"') do (
    echo ✅ Device found: %%a
    goto :device_found
)

echo ⚠️  No device detected. Please connect your Android device.
echo    See DEVICE_SETUP.md for detailed instructions.
echo.
goto :end

:device_found
echo.
echo Your device is connected and ready for testing!
echo.

:end
echo Next steps:
echo   1. Make sure your device has USB debugging enabled
echo   2. Run: npm run appium:start    (to start Appium server)
echo   3. Run: npm run test:android:device  (in another terminal)
echo.
pause
