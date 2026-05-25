@echo off
cd /d "c:\Users\Srinithi M\Downloads\project\pulseguard-ai\backend"
call venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
