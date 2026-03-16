@echo off
python -m ensurepip --upgrade
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
  echo Failed to install dependencies.
  exit /b %ERRORLEVEL%
)
echo Dependencies installed successfully.
