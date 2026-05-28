@echo off
chcp 65001 > nul
echo ========================================
echo   燕云角色信息收集工具启动器
echo ========================================
echo.

REM 检查是否有可执行文件
set has_exe=0
if exist cert_installer.exe set has_exe=1
if exist release\cert_installer.exe set has_exe=1

if %has_exe%==1 (
    echo [1] mitmweb - 可视化界面 (推荐)
) else (
    echo [1] mitmweb - 可视化界面（增强版）
)
echo [2] mitmweb - 可视化界面（基础版）
echo [3] mitmdump - 后台监听模式

if %has_exe%==1 (
    echo [4] 运行证书安装工具 (EXE)
)

echo [5] 查看最新捕获的数据
echo [6] 查看所有历史数据
echo [7] 安装mitmproxy证书
echo [8] 安装依赖
echo [9] 下载游戏配置文件
echo [10] 打开数据目录
echo [0] 退出
echo.

set /p choice=请选择操作 (0-10):

if "%choice%"=="1" goto web_v2
if "%choice%"=="2" goto web
if "%choice%"=="3" goto dump
if "%choice%"=="4" goto cert_exe
if "%choice%"=="5" goto view
if "%choice%"=="6" goto view_all
if "%choice%"=="7" goto cert
if "%choice%"=="8" goto deps
if "%choice%"=="9" goto config
if "%choice%"=="10" goto open_dir
if "%choice%"=="0" goto end

:web_v2
echo.
echo ========================================
echo   启动可视化界面（增强版）
echo ========================================
echo.
echo 启动后请在浏览器中配置代理: 127.0.0.1:8080
echo.
mitmweb -s network_monitor_v2.py
goto end

:web
echo.
echo ========================================
echo   启动可视化界面（基础版）
echo ========================================
echo.
echo 启动后请在浏览器中配置代理: 127.0.0.1:8080
echo.
mitmweb -s network_monitor.py
goto end

:dump
echo.
echo ========================================
echo   启动后台监听模式（增强版）
echo ========================================
echo.
echo 按 Ctrl+C 停止监听
echo.
mitmdump -s network_monitor_v2.py
goto end

:cert_exe
echo.
echo ========================================
echo   运行证书安装工具（EXE）
echo ========================================
echo.

if exist cert_installer.exe (
    echo 找到 cert_installer.exe
    start "" cert_installer.exe
    goto end
)

if exist release\cert_installer.exe (
    echo 找到 release\cert_installer.exe
    start "" release\cert_installer.exe
    goto end
)

echo 找不到 cert_installer.exe，使用 Python 版本
goto cert

:cert
echo.
echo ========================================
echo   安装 mitmproxy 证书
echo ========================================
echo.
python cert_installer.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 启动失败，请确保已安装 Python
)
pause
goto end

:view
echo.
if not exist "captured_data\latest_character.json" (
    echo 尚未捕获任何数据
) else (
    echo 最新捕获的数据:
    echo ================================
    type "captured_data\latest_character.json"
)
echo.
echo 历史数据保存在 captured_data 目录
pause
goto end

:view_all
echo.
if not exist captured_data (
    echo 数据目录不存在
) else (
    echo 历史数据文件:
    echo ================================
    dir /b "captured_data\character_*.json"
)
echo.
pause
goto end

:deps
echo.
echo ========================================
echo   安装依赖
echo ========================================
echo.
pip install -r network_monitor_requirements.txt
echo.
pause
goto end

:config
echo.
echo ========================================
echo   下载游戏配置文件
echo ========================================
echo.
python config_downloader.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 启动失败，请确保已安装 Python
)
pause
goto end

:open_dir
echo.
if exist captured_data (
    explorer captured_data
) else (
    echo 数据目录不存在
)
echo.
pause
goto end

:end
