@echo off
cd /d "%~dp0"
title E-Commerce Offline TTS Server

REM Determine python executable: use local venv if exists, or global E:\Github\tts\api\venv
set PY=
if exist "api\venv\Scripts\python.exe" (
  set PY=api\venv\Scripts\python.exe
) else if exist "E:\Github\tts\api\venv\Scripts\python.exe" (
  set PY=E:\Github\tts\api\venv\Scripts\python.exe
) else (
  echo Creating api\venv and installing requirements...
  python -m venv api\venv
  api\venv\Scripts\python -m pip install -r api\requirements.txt
  set PY=api\venv\Scripts\python.exe
)

echo Starting Piper TTS Server (Amy + Nepali Google 2) on port 8091...
cd /d "%~dp0api"
%PY% -m uvicorn main:app --host 0.0.0.0 --port 8091
