@echo off
echo ==========================================
echo       EKAGURU PILOT LAUNCHER 🚀
echo ==========================================
echo.
echo Starting Ekaguru Pilot Interface...
echo.
echo [1] Verifying Environment...
python scripts/pre_flight_check.py
if %errorlevel% neq 0 (
    echo.
    echo ❌ Pre-flight check failed. Please check errors above.
    pause
    exit /b
)

echo.
echo [2] Launching Frontend (Port 5173)...
echo.
echo    * Access Parent Dashboard at: http://localhost:5173/
echo    * Access Student Avatar at:   http://localhost:5173/student
echo.
echo Close this window to stop the application.
echo.

cd parent_dashboard/frontend
npm run dev
