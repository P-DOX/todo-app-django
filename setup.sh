#!/bin/bash

# Todo App - Automated Setup Script for Linux/Mac
# Run this script to set up the application quickly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  Todo App - Automated Setup (Linux/Mac)"
echo -e "========================================${NC}"
echo ""

# Check if Python is installed
echo -e "${YELLOW}Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✓ Found: $PYTHON_VERSION${NC}"
    PYTHON_CMD=python
else
    echo -e "${RED}✗ Python not found! Please install Python 3.8+ from https://www.python.org/downloads/${NC}"
    exit 1
fi

# Check Python version
echo -e "${YELLOW}Verifying Python version...${NC}"
PYTHON_VERSION_NUM=$($PYTHON_CMD -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION_NUM" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo -e "${GREEN}✓ Python version $PYTHON_VERSION_NUM is compatible${NC}"
else
    echo -e "${RED}✗ Python version $PYTHON_VERSION_NUM is too old. Please upgrade to Python 3.8+${NC}"
    exit 1
fi

# Create virtual environment
echo ""
echo -e "${YELLOW}Creating virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${GRAY}Virtual environment already exists. Skipping creation.${NC}"
else
    $PYTHON_CMD -m venv venv
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Virtual environment created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate virtual environment
echo ""
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${RED}✗ Failed to activate virtual environment${NC}"
    exit 1
fi

# Upgrade pip
echo ""
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip --quiet
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ pip upgraded successfully${NC}"
else
    echo -e "${YELLOW}! Warning: Failed to upgrade pip, continuing anyway...${NC}"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies from requirements.txt...${NC}"
echo -e "${GRAY}(This may take a few minutes)${NC}"
pip install -r requirements.txt --quiet
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Create data directory
echo ""
echo -e "${YELLOW}Creating data directory...${NC}"
if [ ! -d "data" ]; then
    mkdir -p data
    echo -e "${GREEN}✓ Data directory created${NC}"
else
    echo -e "${GRAY}Data directory already exists. Skipping.${NC}"
fi

# Run database migrations
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
python manage.py migrate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${RED}✗ Failed to run migrations${NC}"
    exit 1
fi

# Collect static files (in case needed)
echo ""
echo -e "${YELLOW}Collecting static files...${NC}"
python manage.py collectstatic --noinput --clear > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Static files collected${NC}"
else
    echo -e "${YELLOW}! Static files collection skipped (not critical)${NC}"
fi

# Setup complete
echo ""
echo -e "${GREEN}========================================"
echo -e "  ✓ Setup completed successfully!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "${NC}1. (Optional) Create a superuser for admin access:"
echo -e "${GRAY}   python manage.py createsuperuser${NC}"
echo ""
echo -e "${NC}2. Start the development server:"
echo -e "${GRAY}   python manage.py runserver${NC}"
echo ""
echo -e "${NC}3. Open your browser and visit:"
echo -e "${GRAY}   http://localhost:8000${NC}"
echo ""
echo -e "${NC}4. Admin panel (if you created a superuser):"
echo -e "${GRAY}   http://localhost:8000/admin${NC}"
echo ""

# Ask if user wants to start the server now
echo -e "${YELLOW}Would you like to start the development server now? (Y/n): ${NC}"
read -r response

if [ -z "$response" ] || [ "$response" = "Y" ] || [ "$response" = "y" ]; then
    echo ""
    echo -e "${GREEN}Starting development server...${NC}"
    echo -e "${GRAY}Press Ctrl+C to stop the server${NC}"
    echo ""
    python manage.py runserver
else
    echo ""
    echo -e "${CYAN}Setup complete! Run 'python manage.py runserver' when ready.${NC}"
fi
