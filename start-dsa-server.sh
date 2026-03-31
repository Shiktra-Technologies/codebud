#!/bin/bash

# Start DSA Server Script

echo "🚀 Starting CodeBud DSA Server..."

# Check if we're in the right directory
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found!"
    echo "Please run this script from the codebud_frontend root directory"
    exit 1
fi

cd server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found!"
    echo "Please run ./setup-dsa-server.sh first"
    exit 1
fi

# Activate virtual environment and start server
echo "⚡ Activating virtual environment and starting server..."
source venv/bin/activate
python app.py
