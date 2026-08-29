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

:: Prioritize Android Studio's bundled JDK 21/17 (jbr)
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
:: STEP 3: CONFIGURE ANDROID SDK
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
        echo [!] Android SDK not found in default paths.
    )
)

echo ANDROID_HOME is set to: %ANDROID_HOME%
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"
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

:: Ensure android/local.properties points to the correct SDK path
set "ESCAPED_SDK=%ANDROID_HOME:\=\\%"
echo sdk.dir=%ESCAPED_SDK% > android\local.properties
echo [OK] Updated android\local.properties
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
