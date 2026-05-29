@echo off
cd /d "%~dp0"
echo Starting Python Internal AI server...
echo Open http://localhost:5000 after this starts.
echo.
start "" "http://localhost:5000"
python python_server.py
pause
