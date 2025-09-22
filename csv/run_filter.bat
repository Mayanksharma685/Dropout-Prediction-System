@echo off
echo Starting CSV filtering process...
echo.

REM Change to the script directory
cd /d "\\wsl.localhost\Ubuntu-22.04\home\aditya\SIH\edu-pulse\csv"

REM Install dependencies if needed
echo Installing dependencies...
pip install -r requirements_filter.txt

echo.
echo Running advanced CSV filter...
python filter_csv_advanced.py

echo.
echo Process completed! Check the new_csv folder for results.
pause
