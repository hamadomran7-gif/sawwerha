@echo off
title Sawwerha Setup - Stage 2
mkdir C:\Sawwerha 2>nul
curl.exe -L --retry 5 -o C:\Sawwerha\stage2.ps1 https://raw.githubusercontent.com/hamadomran7-gif/sawwerha/main/agent/stage2.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Sawwerha\stage2.ps1
echo.
echo ===== FINISHED - see C:\Sawwerha\stage2.log =====
pause
