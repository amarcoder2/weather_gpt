@echo off
echo ===================================================
echo Pushing WeatherGPT to https://github.com/amarcoder2/weather_gpt.git
echo ===================================================
cd /d "d:\SIH 2026 WEATHER GPT"
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! All files have been pushed to GitHub!
) else (
    echo If prompted above, complete the sign-in with your browser.
)
echo ===================================================
pause
