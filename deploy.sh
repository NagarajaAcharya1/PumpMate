#!/bin/bash

echo "🚀 PumpMate Deployment Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with your Firebase configuration."
    echo "   Copy .env.example and update with your Firebase config."
    exit 1
fi

echo "✅ Environment file found"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Firebase configuration"
echo "2. Deploy to Vercel:"
echo "   - Push to GitHub"
echo "   - Connect repository to Vercel"
echo "   - Add environment variables in Vercel"
echo "   - Deploy!"
echo ""
echo "For local development, run: npm run dev"