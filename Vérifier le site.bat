@echo off
chcp 65001 >nul
title Signes en main - verifications
cd /d "%~dp0"

echo.
echo   ===============================================
echo     Signes en main - verifications du site
echo   ===============================================
echo.

echo   1. Mise a jour des versions des fichiers (plus besoin de Ctrl+F5)
python scripts\versionner.py
echo.

echo   2. Tests automatiques (progression, donnees, licences)
where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js n'est pas installe : tests sautes. https://nodejs.org
) else (
  node --test tests\
)
echo.

choice /c ON /n /m "  3. Verifier aussi que les 881 videos et photos sont en ligne ? (environ 3 min) [O/N] "
if errorlevel 2 goto fin
python scripts\verifier_videos.py

:fin
echo.
echo   Pour tester toutes les pages dans le navigateur : ouvrez le site puis l'adresse
echo   http://127.0.0.1:8766/tests/navigateur.html
echo.
pause
