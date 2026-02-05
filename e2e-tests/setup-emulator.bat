@echo off
echo ========================================
echo Android Emulator Quick Setup
echo ========================================
echo.
echo This will install and set up an Android Emulator for testing.
echo.

:: Check for Android SDK
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_SDK%\platform-tools\adb.exe" (
    echo ❌ Android SDK not found!
    echo.
    echo Please install Android Studio first:
    echo https://developer.android.com/studio
    echo.
    pause
    exit /b 1
)

echo ✅ Android SDK found at: %ANDROID_SDK%

:: Set environment variables
set "ANDROID_HOME=%ANDROID_SDK%"
set "ANDROID_SDK_ROOT=%ANDROID_SDK%"
set "PATH=%PATH%;%ANDROID_SDK%\platform-tools;%ANDROID_SDK%\emulator;%ANDROID_SDK%\cmdline-tools\latest\bin"

echo.
echo ========================================
echo Step 1: Installing emulator tools...
echo ========================================

:: Check if cmdline-tools exists, if not install it
if not exist "%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
    echo Installing Command Line Tools...
    mkdir "%ANDROID_SDK%\cmdline-tools" 2>nul
    echo Please download and extract command line tools from:
    echo https://developer.android.com/studio#command-tools
    echo Extract to: %ANDROID_SDK%\cmdline-tools\latest
    echo.
    pause
    exit /b 1
)

:: Install emulator if not present
echo Installing emulator system image (this may take a while)...
"%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" "system-images;android-30;google_apis;x86_64" --install

:: Install emulator binary
echo Installing emulator binary...
"%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" "emulator" --install
"%ANDROID_SDK%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" --install

echo.
echo ========================================
echo Step 2: Creating emulator device...
echo ========================================

:: Create a virtual device
echo Creating Funcxon-Test-Device...
"%ANDROID_SDK%\cmdline-tools\latest\bin\avdmanager.bat" create avd -n Funcxon-Test-Device -k "system-images;android-30;google_apis;x86_64" -d "pixel_4" --force

echo.
echo ========================================
echo ✅ Emulator Setup Complete!
echo ========================================
echo.
echo Available emulators:
"%ANDROID_SDK%\emulator\emulator.exe" -list-avds
echo.
echo Next steps:
echo   1. Run: .\start-emulator.bat     (to start the emulator)
echo   2. Wait for emulator to fully boot (about 1-2 minutes)
echo   3. Install your app on the emulator
echo   4. Run: npm run appium:start      (in another terminal)
echo   5. Run: npm run test:android       (in another terminal)
echo.
pause
