@echo off
REM ===========================================
REM Axtronet Instagram CM - Startup Script (Windows Batch)
REM ===========================================
REM Este script ejecuta run.ps1 que es el script principal
REM ===========================================

echo.
echo ===========================================
echo Axtronet Instagram CM - Startup Script
echo ===========================================
echo.

REM Verificar si PowerShell está disponible
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PowerShell no está disponible
    echo.
    echo Por favor, instala PowerShell o ejecuta run.ps1 manualmente
    echo.
    echo Descarga PowerShell desde: https://aka.ms/powershell
    echo.
    pause
    exit /b 1
)

REM Verificar si el script PowerShell existe
if not exist "%~dp0run.ps1" (
    echo ❌ No se encontró run.ps1
    echo.
    echo Por favor, asegúrate de que run.ps1 esté en la misma carpeta que run.bat
    echo.
    pause
    exit /b 1
)

REM Ejecutar script PowerShell
echo Ejecutando script PowerShell...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0run.ps1"

REM Verificar el código de salida
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error ejecutando script (Código de salida: %ERRORLEVEL%)
    echo.
    echo Si el error es relacionado con la política de ejecución, ejecuta:
    echo   powershell -ExecutionPolicy RemoteSigned -File "%~dp0run.ps1"
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ Script ejecutado correctamente
echo.
pause

