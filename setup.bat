@echo off
title Web Highlight and Jump Back Later by Lmer - Quick Setup
color 0b
setlocal enabledelayedexpansion

:: Set the permanent location
set "PERM_DIR=%USERPROFILE%\Documents\Web-Highlights"
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

echo.
echo  =======================================================
echo   WEB HIGHLIGHT AND JUMP BACK LATER by Lmer - SETUP ^& SAFETY
echo  =======================================================
echo.

:: Check if the current folder is in Downloads
echo %CURRENT_DIR% | findstr /i "Downloads" > nul
if %errorlevel%==0 (
    echo [IMPORTANT] Your files are currently in the Downloads folder. 
    echo If you delete them later, the extension will STOP WORKING.
    echo.
    set /p "MOVE_CHOICE=Would you like to move this to your Documents folder for safety? (y/n): "
    if /i "!MOVE_CHOICE!"=="y" (
        echo.
        echo Moving files to: !PERM_DIR! ...
        mkdir "!PERM_DIR!" 2>nul
        xcopy /s /e /y /q "!CURRENT_DIR!\*" "!PERM_DIR!\"
        echo.
        echo Move complete! Please run the 'setup.bat' from the new location in Documents.
        echo Opening the new folder now...
        start "" "!PERM_DIR!"
        pause
        exit
    )
)

echo.
echo  TO INSTALL IN CHROME:
echo.
echo  1. In the Chrome window that just opened, TURN ON 
echo     "Developer mode" (top-right corner).
echo.
echo  2. Click "Load unpacked".
echo.
echo  3. Select THIS FOLDER: 
echo     !CURRENT_DIR!
echo.
echo  -------------------------------------------------------
echo  [SECURITY NOTE] Chrome requires you to click the button 
echo  manually to protect you from malicious software.
echo  -------------------------------------------------------
echo.
echo  Opening Chrome Extensions page...

:: Try to find Chrome in common locations
set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_PATH if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME_PATH (
    start "" "!CHROME_PATH!" "chrome://extensions"
) else (
    :: Fallback to default browser if chrome isn't found in common spots
    start chrome://extensions
)

:: Open current folder in explorer to make selection easy
start .

echo.
echo  Once you see the 'Web Highlight' icon in your toolbar, 
echo  you can close this window.
echo.
pause
