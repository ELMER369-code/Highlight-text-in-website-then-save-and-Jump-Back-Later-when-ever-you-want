@echo off
title Web Highlight and Jump Back Later - Quick Setup
color 0b

echo.
echo  =======================================================
echo   WEB HIGHLIGHT AND JUMP BACK LATER - QUICK SETUP
echo  =======================================================
echo.
echo  To install this extension in Chrome, follow these 3 simple steps:
echo.
echo  1. In the window that just opened, TOGGLE the "Developer mode" 
echo     switch in the top-right corner to "ON".
echo.
echo  2. Click the "Load unpacked" button.
echo.
echo  3. Select THIS folder (the one containing this script).
echo.
echo  -------------------------------------------------------
echo  Opening Chrome Extensions page and this folder...
echo.

:: Open Chrome Extensions page
start chrome://extensions

:: Open current folder in explorer
start .

echo  Press any key when you are finished...
pause > nul
