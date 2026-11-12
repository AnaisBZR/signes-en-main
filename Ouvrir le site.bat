@echo off
chcp 65001 >nul
title Signes en main
cd /d "%~dp0"

echo.
echo   ===============================================
echo     Signes en main - site d'apprentissage LSF
echo   ===============================================
echo.
echo   Le site s'ouvre dans votre navigateur.
echo   Laissez cette fenetre ouverte pendant l'utilisation.
echo.

set PY=
where python >nul 2>nul
if not errorlevel 1 set PY=python
if not defined PY (
  where py >nul 2>nul
  if not errorlevel 1 set PY=py
)
if not defined PY (
  echo   Python n'est pas installe : ouverture directe du fichier.
  start "" "%~dp0index.html"
  pause
  exit /b 0
)

start "" "http://127.0.0.1:8766/"
%PY% scripts\serveur.py 8766
echo.
echo   Si le site ne s'ouvre pas, il est peut-etre deja ouvert dans une autre fenetre.
pause
