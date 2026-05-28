@echo off
:: Yan Yun Character Info Tool - Build Script
:: Version: 2.1
:: Encoding: ANSI (Windows default)

echo ========================================
echo   Yan Yun Character Tool - Build Utility
echo ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found!
    echo.
    pause
    exit /b 1
)

echo [1] Build Certificate Installer
echo [2] Build Network Monitor
echo [3] Build All
echo [4] Clean Build Files
echo [5] Run Python Build Script (Recommended)
echo [0] Exit
echo.

set /p choice=Enter your choice (0-5): 

if "%choice%"=="1" goto build_cert
if "%choice%"=="2" goto build_monitor
if "%choice%"=="3" goto build_all
if "%choice%"=="4" goto clean
if "%choice%"=="5" goto python_build
if "%choice%"=="0" goto end
echo [ERROR] Invalid choice!
goto end

:python_build
echo.
echo ========================================
echo   Starting Python Build Script
echo ========================================
echo.
python build.py
echo.
echo Press any key to continue...
pause >nul
goto end

:build_cert
echo.
echo ========================================
echo   Building Certificate Installer
echo ========================================
echo.

:: Check PyInstaller
pyinstaller --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install PyInstaller!
        echo.
        pause
        goto end
    )
)

:: Clean
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

:: Build
echo.
if exist cert_installer.spec (
    echo Building with spec file...
    pyinstaller --onefile --console cert_installer.spec
) else (
    echo Building with default config...
    pyinstaller --onefile --console --name cert_installer cert_installer.py
)

:: Check build result
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Build failed!
    echo ========================================
    echo Please check the error messages above.
    pause
    goto end
)

if not exist release mkdir release

:: Copy files
if exist dist\*.exe (
    echo.
    echo Copying to release folder...
    copy /y dist\*.exe release\
    echo.
    echo ========================================
    echo   Build completed!
    echo ========================================
    echo.
    echo Executable in release folder
) else (
    echo.
    echo [ERROR] No executable generated!
)

:: Clean temp files
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo.
echo Press any key to continue...
pause >nul
goto end

:build_monitor
echo.
echo ========================================
echo   Building Network Monitor
echo ========================================
echo.

:: Check PyInstaller
pyinstaller --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install PyInstaller!
        echo.
        pause
        goto end
    )
)

:: Clean
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

:: Build
echo.
if exist network_monitor.spec (
    echo Building with spec file...
    pyinstaller --onefile --console network_monitor.spec
) else (
    echo Building with default config...
    pyinstaller --onefile --console --name network_monitor network_monitor_v2.py
)

:: Check build result
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Build failed!
    echo ========================================
    echo Please check the error messages above.
    pause
    goto end
)

if not exist release mkdir release

:: Copy files
if exist dist\*.exe (
    echo.
    echo Copying to release folder...
    copy /y dist\*.exe release\
    echo.
    echo ========================================
    echo   Build completed!
    echo ========================================
    echo.
    echo Executable in release folder
) else (
    echo.
    echo [ERROR] No executable generated!
)

:: Clean temp files
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo.
echo Press any key to continue...
pause >nul
goto end

:build_all
echo.
echo ========================================
echo   Building All
echo ========================================
echo.

:: Check PyInstaller
pyinstaller --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install PyInstaller!
        echo.
        pause
        goto end
    )
)

if not exist release mkdir release

:: Build certificate installer
echo.
echo --- Building Certificate Installer ---
if exist cert_installer.spec (
    pyinstaller --onefile --console cert_installer.spec
) else (
    pyinstaller --onefile --console --name cert_installer cert_installer.py
)

:: Check build result
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Failed to build Certificate Installer!
    echo ========================================
    echo Please check the error messages above.
    pause
    goto end
)

if exist dist\*.exe copy /y dist\*.exe release\

:: Clean
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

:: Build network monitor
echo.
echo --- Building Network Monitor ---
if exist network_monitor.spec (
    pyinstaller --onefile --console network_monitor.spec
) else (
    pyinstaller --onefile --console --name network_monitor network_monitor_v2.py
)

:: Check build result
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Failed to build Network Monitor!
    echo ========================================
    echo Please check the error messages above.
    pause
    goto end
)

if exist dist\*.exe copy /y dist\*.exe release\

:: Clean temp files
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo.
echo ========================================
echo   Build completed!
echo ========================================
echo.
echo Executables in release folder

if exist release\*.exe (
    echo.
    echo Release folder contents:
    dir /b release\*.exe
) else (
    echo.
    echo [WARNING] Release folder is empty!
)

echo.
echo Press any key to continue...
pause >nul
goto end

:clean
echo.
echo Cleaning build files...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist *.spec del /f *.spec
if exist __pycache__ rmdir /s /q __pycache__

echo.
echo Clean completed!
echo.
echo Press any key to continue...
pause >nul
goto end

:end
echo.
pause