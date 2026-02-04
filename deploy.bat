@echo off
echo 🚀 PumpMate Deployment Setup
echo ==============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Please create one with your Firebase configuration.
    echo    Copy .env.example and update with your Firebase config.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Build the project
echo 🔨 Building the project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update .env with your Firebase configuration
echo 2. Deploy to Vercel:
echo    - Push to GitHub
echo    - Connect repository to Vercel
echo    - Add environment variables in Vercel
echo    - Deploy!
echo.
echo For local development, run: npm run dev

pause