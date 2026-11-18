@echo off
chcp 65001 >nul
title 家灯 JiaDeng · 一键启动

if not exist "%~dp0start.ps1" (
  echo [JiaDeng] start.ps1 not found next to this file.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*

if "%ERRORLEVEL%"=="1" (
  echo.
  echo [JiaDeng] Startup failed. See the message above.
  pause
)
