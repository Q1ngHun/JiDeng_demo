@echo off
chcp 65001 >nul
title 家灯 JiaDeng · 开发模式

if not exist "%~dp0开发模式.ps1" (
  echo [JiaDeng] 开发模式.ps1 not found next to this file.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0开发模式.ps1" %*

if "%ERRORLEVEL%"=="1" (
  echo.
  echo [JiaDeng] Dev mode failed to start. See the message above.
  pause
)
