@echo off
title Beni-Gan — Sistema de Trazabilidad Carnica
color 0A

echo.
echo  =============================================
echo    BENI-GAN — Iniciando sistema...
echo    Central de Acopio San Borja, Beni
echo  =============================================
echo.

echo [1/2] Iniciando Backend Python (FastAPI - Puerto 8000)...
start "Beni-Gan Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > NUL

echo [2/2] Iniciando Frontend Next.js (Puerto 3000)...
start "Beni-Gan Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak > NUL

echo.
echo  =============================================
echo    Sistema iniciado correctamente!
echo    Backend:  http://localhost:8000/docs
echo    Frontend: http://localhost:3000
echo.
echo    Usuario: admin
echo    Clave:   admin123
echo  =============================================
echo.

start "" "http://localhost:3000"

pause
