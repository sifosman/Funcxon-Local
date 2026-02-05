#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Sets up environment variables for Appium/Android testing
.DESCRIPTION
    Configures ANDROID_HOME, JAVA_HOME, and updates PATH for Appium testing
#>

Write-Host "=== Appium Environment Setup ===" -ForegroundColor Green
Write-Host ""

# Function to find Android SDK
function Find-AndroidSDK {
    $possiblePaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Android\Sdk",
        "C:\Program Files\Android\Android Studio\Sdk",
        "${env:ProgramFiles(x86)}\Android\android-sdk"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\platform-tools\adb.exe") {
            return $path
        }
    }
    return $null
}

# Function to find Java
function Find-Java {
    $possiblePaths = @(
        "C:\Program Files\Java",
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Amazon Corretto",
        "$env:ProgramFiles\Java"
    )
    
    foreach ($basePath in $possiblePaths) {
        if (Test-Path $basePath) {
            $jdkFolders = Get-ChildItem -Path $basePath -Directory -Filter "jdk*" -ErrorAction SilentlyContinue
            foreach ($folder in $jdkFolders) {
                if (Test-Path "$($folder.FullName)\bin\java.exe") {
                    return $folder.FullName
                }
            }
            # Check for direct java installation
            if (Test-Path "$basePath\bin\java.exe") {
                return $basePath
            }
        }
    }
    return $null
}

# 1. Set ANDROID_HOME
Write-Host "Step 1: Checking Android SDK..." -ForegroundColor Yellow
$androidSdk = Find-AndroidSDK

if ($androidSdk) {
    Write-Host "Found Android SDK at: $androidSdk" -ForegroundColor Green
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdk, "User")
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdk, "User")
    Write-Host "Set ANDROID_HOME = $androidSdk" -ForegroundColor Green
} else {
    Write-Host "❌ Android SDK not found!" -ForegroundColor Red
    Write-Host "Please install Android Studio or SDK Command Line Tools:" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio#downloads" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# 2. Set JAVA_HOME
Write-Host ""
Write-Host "Step 2: Checking Java JDK..." -ForegroundColor Yellow
$javaHome = Find-Java

if ($javaHome) {
    Write-Host "Found Java at: $javaHome" -ForegroundColor Green
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    Write-Host "Set JAVA_HOME = $javaHome" -ForegroundColor Green
} else {
    Write-Host "❌ Java JDK not found!" -ForegroundColor Red
    Write-Host "Please install Java 11 or higher:" -ForegroundColor Yellow
    Write-Host "   https://adoptium.net/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# 3. Update PATH
Write-Host ""
Write-Host "Step 3: Updating PATH..." -ForegroundColor Yellow

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPaths = @()

# Check if paths already exist
if ($androidSdk -and $currentPath -notlike "*$androidSdk\platform-tools*") {
    $newPaths += "$androidSdk\platform-tools"
}
if ($androidSdk -and $currentPath -notlike "*$androidSdk\cmdline-tools\latest\bin*") {
    if (Test-Path "$androidSdk\cmdline-tools\latest\bin") {
        $newPaths += "$androidSdk\cmdline-tools\latest\bin"
    }
}
if ($currentPath -notlike "*C:\Program Files\nodejs*") {
    $newPaths += "C:\Program Files\nodejs"
}

if ($newPaths.Count -gt 0) {
    $updatedPath = ($currentPath -split ';' + $newPaths) -join ';'
    [Environment]::SetEnvironmentVariable("Path", $updatedPath, "User")
    Write-Host "Added to PATH: $($newPaths -join ', ')" -ForegroundColor Green
} else {
    Write-Host "PATH already contains necessary paths" -ForegroundColor Green
}

# 4. Create a batch file for current session
$batchContent = @"
@echo off
set ANDROID_HOME=$androidSdk
set ANDROID_SDK_ROOT=$androidSdk
set JAVA_HOME=$javaHome
set PATH=%PATH%;$androidSdk\platform-tools
"@

$batchContent | Out-File -FilePath ".\set-env.bat" -Encoding ASCII

# 5. Verification
Write-Host ""
Write-Host "Step 4: Verification..." -ForegroundColor Yellow

# Refresh environment
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:JAVA_HOME = $javaHome

# Test adb
$adbPath = "$androidSdk\platform-tools\adb.exe"
if (Test-Path $adbPath) {
    Write-Host "✅ adb found: $adbPath" -ForegroundColor Green
} else {
    Write-Host "❌ adb not found" -ForegroundColor Red
}

# Test java
$javaPath = "$javaHome\bin\java.exe"
if (Test-Path $javaPath) {
    $javaVersion = & $javaPath -version 2>&1 | Select-String -Pattern '"(\d+)' | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "✅ Java found: version $javaVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Java not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You must RESTART your terminal/IDE for changes to take effect." -ForegroundColor Magenta
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Connect your Android device via USB" -ForegroundColor White
Write-Host "  2. Enable USB Debugging on your device (see DEVICE_SETUP.md)" -ForegroundColor White
Write-Host "  3. Run: .\set-env.bat" -ForegroundColor White
Write-Host "  4. Run: adb devices" -ForegroundColor White
Write-Host "  5. Start Appium: npm run appium:start" -ForegroundColor White
Write-Host "  6. Run tests: npm run test:android:device" -ForegroundColor White
Write-Host ""

# Create verification script
$verifyScript = @'
Write-Host "Verifying setup..." -ForegroundColor Green

# Check environment variables
Write-Host ""
Write-Host "Environment Variables:" -ForegroundColor Yellow
Write-Host "  ANDROID_HOME: $env:ANDROID_HOME"
Write-Host "  JAVA_HOME: $env:JAVA_HOME"

# Check adb
Write-Host ""
Write-Host "ADB Status:" -ForegroundColor Yellow
try {
    $adbDevices = & adb devices 2>&1
    Write-Host $adbDevices
} catch {
    Write-Host "❌ Cannot run adb. Make sure platform-tools is in PATH" -ForegroundColor Red
}

# Check appium
Write-Host ""
Write-Host "Appium Status:" -ForegroundColor Yellow
try {
    $appiumVersion = & npx appium --version 2>&1
    Write-Host "  Appium version: $appiumVersion"
} catch {
    Write-Host "  Appium not found in current directory" -ForegroundColor Yellow
}

# Check installed drivers
Write-Host ""
Write-Host "Installed Drivers:" -ForegroundColor Yellow
try {
    & npx appium driver list --installed
} catch {
    Write-Host "  Could not list drivers" -ForegroundColor Yellow
}
'@

$verifyScript | Out-File -FilePath ".\verify-setup.ps1" -Encoding UTF8

Write-Host "Created verify-setup.ps1 - run this to check your setup anytime." -ForegroundColor Cyan
