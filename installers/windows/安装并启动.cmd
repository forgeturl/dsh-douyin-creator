@echo off
setlocal
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"

echo.
echo === 抖音官方资料创作助手：Windows 一键安装 ===
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo 安装或启动未完成，请查看上方提示后重试。
)

echo.
pause
exit /b %EXIT_CODE%
