@echo off
setlocal enabledelayedexpansion

title ZenChat - Local Android APK Builder

echo ============================================================
echo   ZENCHAT - LOCAL ANDROID APK BUILDER
echo   Black ^& White Neo-Brutalism ^| Standalone APK
echo ============================================================
echo.

:: ------------------------------------------------------------
:: STEP 1: CHECK NODE.JS
:: ------------------------------------------------------------
echo [1/6] Checking Node.js and npm...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found!
    echo Downloading and installing Node.js via winget...
    winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    echo Please restart this script after Node.js installation completes.
    pause
    exit /b 1
)
node -v
echo [OK] Node.js is ready.
echo.

:: ------------------------------------------------------------
:: STEP 2: CHECK JAVA JDK
:: ------------------------------------------------------------
echo [2/6] Checking Java Development Kit (JDK)...
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] Java JDK not detected in PATH.
    echo Installing OpenJDK 17 LTS automatically via winget...
    winget install Microsoft.OpenJDK.17 -e --accept-package-agreements --accept-source-agreements
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17"
    set "PATH=!JAVA_HOME!\bin;%PATH%"
) else (
    java -version
    echo [OK] Java is ready.
)
echo.

:: ------------------------------------------------------------
:: STEP 3: CHECK ANDROID SDK
:: ------------------------------------------------------------
echo [3/6] Checking Android SDK...
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo [INFO] Located Android SDK at %LOCALAPPDATA%\Android\Sdk
    ) else if exist "C:\Android\sdk" (
        set "ANDROID_HOME=C:\Android\sdk"
        echo [INFO] Located Android SDK at C:\Android\sdk
    ) else (
        echo [!] Android SDK not found on your system.
        echo Installing Android Studio and SDK via winget...
        winget install Google.AndroidStudio -e --accept-package-agreements --accept-source-agreements
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo Android Studio has been installed. Please open Android Studio once to complete SDK component setup if needed.
    )
)

echo ANDROID_HOME is set to: %ANDROID_HOME%
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"
echo.

:: ------------------------------------------------------------
:: STEP 4: GENERATE NATIVE ANDROID PROJECT (EXPO PREBUILD)
:: ------------------------------------------------------------
echo [4/6] Generating native Android files (Expo Prebuild)...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% neq 0 (
    echo [!] Expo prebuild returned code %ERRORLEVEL%, checking android folder...
)

if not exist "android" (
    echo [ERROR] Native android directory was not created.
    pause
    exit /b 1
)

:: Create android/local.properties with proper escaped sdk.dir path
set "ESCAPED_SDK=%ANDROID_HOME:\=\\%"
echo sdk.dir=%ESCAPED_SDK% > android\local.properties
echo [OK] Created android\local.properties with sdk.dir
echo.

:: ------------------------------------------------------------
:: STEP 5: COMPILE AND ASSEMBLE APK VIA GRADLE
:: ------------------------------------------------------------
echo [5/6] Building standalone Android APK with Gradle...
cd android

echo Running: gradlew.bat assembleRelease...
call gradlew.bat assembleRelease

if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] assembleRelease requires release keystore. Falling back to assembleDebug...
    call gradlew.bat assembleDebug
)

cd ..
echo.

:: ------------------------------------------------------------
:: STEP 6: LOCATE AND COPY OUTPUT APK
:: ------------------------------------------------------------
echo [6/6] Locating output APK...

set "FOUND_APK="

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    set "FOUND_APK=android\app\build\outputs\apk\release\app-release.apk"
) else if exist "android\app\build\outputs\apk\release\app-release-unsigned.apk" (
    set "FOUND_APK=android\app\build\outputs\apk\release\app-release-unsigned.apk"
) else if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    set "FOUND_APK=android\app\build\outputs\apk\debug\app-debug.apk"
)

if defined FOUND_APK (
    copy /y "!FOUND_APK!" "ZenChat.apk" >nul
    echo.
    echo ============================================================
    echo   [SUCCESS] APK BUILT SUCCESSFULLY!
    echo   Output: %CD%\ZenChat.apk
    echo ============================================================
    echo.
    echo Opening file location in Windows Explorer...
    explorer /select,"ZenChat.apk"
) else (
    echo [ERROR] Could not find generated APK in android\app\build\outputs\apk\
    echo Please review the build logs above.
)

pause
