#!/bin/bash

# FreelanceCo Quick Start Script
# This script helps you start both frontend and backend servers

echo "🚀 Starting FreelanceCo Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if node_modules exists in backend
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd "$SCRIPT_DIR/backend" && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backend dependency installation failed${NC}"
        exit 1
    fi
fi

# Check if node_modules exists in frontend
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd "$SCRIPT_DIR/frontend" && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend dependency installation failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ All dependencies are installed${NC}"
echo ""
echo -e "${BLUE}Starting servers...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📌 Backend will run on: http://localhost:8080${NC}"
echo -e "${GREEN}📌 Frontend will run on: http://localhost:5173${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Stopping servers...${NC}"
    jobs -p | xargs kill 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
