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
    pause
    exit /b 1
)
node -v
echo [OK] Node.js is ready.
echo.

:: ------------------------------------------------------------
:: STEP 2: CONFIGURE COMPATIBLE JAVA JDK (JDK 17/21)
:: ------------------------------------------------------------
echo [2/6] Configuring Android-compatible Java JDK...

if exist "C:\Program Files\Android\Android Studio\jbr" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    echo [OK] Using Android Studio JDK at C:\Program Files\Android\Android Studio\jbr
) else if exist "C:\Program Files\Microsoft\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17"
    echo [OK] Using Microsoft JDK 17
) else if exist "C:\Program Files\Eclipse Adoptium\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17"
    echo [OK] Using Temurin JDK 17
) else (
    echo [INFO] Using system default Java
)

if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)

java -version
echo.

:: ------------------------------------------------------------
:: STEP 3: CONFIGURE ANDROID SDK & NDK
:: ------------------------------------------------------------
echo [3/6] Checking Android SDK and NDK...
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
        echo [INFO] Located Android SDK at %LOCALAPPDATA%\Android\Sdk
    ) else if exist "C:\Android\sdk" (
        set "ANDROID_HOME=C:\Android\sdk"
        echo [INFO] Located Android SDK at C:\Android\sdk
    )
)

echo ANDROID_HOME is set to: %ANDROID_HOME%
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

:: Check NDK directory
set "NDK_DIR="
if exist "%ANDROID_HOME%\ndk\27.1.12297006" (
    set "NDK_DIR=%ANDROID_HOME%\ndk\27.1.12297006"
    set "ANDROID_NDK_HOME=%ANDROID_HOME%\ndk\27.1.12297006"
    echo [INFO] Located NDK 27.1 at !NDK_DIR!
) else if exist "%ANDROID_HOME%\ndk" (
    for /d %%D in ("%ANDROID_HOME%\ndk\*") do (
        set "NDK_DIR=%%~fD"
        set "ANDROID_NDK_HOME=%%~fD"
    )
    echo [INFO] Located NDK at !NDK_DIR!
)
echo.

:: ------------------------------------------------------------
:: STEP 4: GENERATE / VERIFY NATIVE ANDROID PROJECT
:: ------------------------------------------------------------
echo [4/6] Verifying native Android project...
if not exist "android" (
    echo Generating native Android files via Expo Prebuild...
    call npx expo prebuild --platform android --clean
)

if not exist "android" (
    echo [ERROR] Native android directory could not be created.
    pause
    exit /b 1
)

:: Create android/local.properties with forward slashes
set "FWD_SDK=%ANDROID_HOME:\=/%"
echo sdk.dir=%FWD_SDK%> android\local.properties

if defined NDK_DIR (
    set "FWD_NDK=%NDK_DIR:\=/%"
    echo ndk.dir=!FWD_NDK!>> android\local.properties
)

echo [OK] Configured android\local.properties
type android\local.properties
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
    echo [INFO] assembleRelease requires signing key. Building standalone Debug APK...
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
