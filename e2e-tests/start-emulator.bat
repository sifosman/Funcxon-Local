@echo off
echo ========================================
echo Start Android Emulator
echo ========================================
echo.

:: Set paths
set "ANDROID_SDK=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%PATH%;%ANDROID_SDK%\emulator;%ANDROID_SDK%\platform-tools"

echo Starting Funcxon-Test-Device emulator...
echo This will take 1-2 minutes to fully boot.
echo.
echo DO NOT CLOSE THIS WINDOW!
echo Wait until you see the Android home screen on the emulator.
echo.
echo Press any key when ready to start...
pause >nul

echo.
echo Starting emulator (fast boot enabled)...
"%ANDROID_SDK%\emulator\emulator.exe" -avd Funcxon-Test-Device -no-snapshot-load -no-audio -no-boot-anim

echo.
echo Emulator closed.
pause
