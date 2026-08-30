@echo off
chcp 65001 >nul
call "%~dp0installers\windows\安装并启动.cmd"
exit /b %ERRORLEVEL%
