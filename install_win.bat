@echo off
setlocal EnableDelayedExpansion
echo.
echo ============================================
echo   Auto Extension Installer
echo ============================================
echo.

echo [1/3] Enabling Adobe CEP debug mode...
for /L %%V in (3,1,13) do (
    set "KEY=HKCU\Software\Adobe\CSXS.%%V"
    reg add "!KEY!" /f >nul 2>&1
    reg add "!KEY!" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo     Done.

set "FOUND_DIR="

for /R "%~dp0" %%F in (manifest.xml) do (
    if not defined FOUND_DIR (
        set "CANDIDATE=%%~dpF"
        if "!CANDIDATE:~-1!"=="\" set "CANDIDATE=!CANDIDATE:~0,-1!"
        :: Must be inside a CSXS folder
        echo !CANDIDATE! | findstr /I "\\CSXS" >nul
        if !errorlevel!==0 (
            :: Skip Program Files
            echo !CANDIDATE! | findstr /I "Program Files" >nul
            if !errorlevel! neq 0 (
                :: Go up one level from CSXS to get the extension root
                for %%I in ("!CANDIDATE!\..") do set "FOUND_DIR=%%~fI"
            )
        )
    )
)

if not defined FOUND_DIR (
    echo  ERROR: Could not find CSXS\manifest.xml in any subfolder.
    pause
    exit /b 1
)

for %%I in ("!FOUND_DIR!") do set "EXTNAME=%%~nxI"

set "DEST=%ProgramFiles%\Common Files\Adobe\CEP\extensions\%EXTNAME%"

echo.
echo [2/3] Installing:
echo     %EXTNAME%
echo     Source: !FOUND_DIR!
echo     Destination: !DEST!
echo.

if not exist "!DEST!" mkdir "!DEST!"
xcopy /E /Y /I "!FOUND_DIR!\*" "!DEST!\" >nul
if %errorlevel% neq 0 (
    echo  ERROR: Copy failed. Try running as Administrator.
    pause
    exit /b 1
)

echo [3/3] Files copied.
echo.
echo ============================================
echo   Install complete!
echo   Open After Effects -^> Window -^> Extensions
echo   -^> %EXTNAME%
echo ============================================
echo.
pause