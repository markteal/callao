# Callao Web Interface Setup Guide

## Quick Start - Get to the Login Page

The beautiful Callao web interface you see in the preview is a React application that runs separately from the Python server. Here's how to access it:

### Step 1: Start the Python Server (Already Done ✅)
Your Python server is running at `http://localhost:11777` - this is correct!

### Step 2: Start the Web Interface
1. **Open a new Command Prompt/Terminal**
2. **Navigate to your Callao project folder**
3. **Run the web interface startup script:**
   ```cmd
   start_callao_web.bat
   ```

### Step 3: Access the Web Interface
- The web interface will automatically open at: `http://localhost:5173`
- This is where you'll see the beautiful login page from the preview!

## What You'll See

### At `http://localhost:11777` (Python Server)
- Basic server status page
- API endpoints information
- Server health check

### At `http://localhost:5173` (Web Interface) 
- 🎨 Beautiful Callao login page
- 📁 Full file manager interface
- 📊 Dashboard with server statistics
- ⚙️ Settings and user management

## Default Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

## Troubleshooting

### "Node.js not found" Error
1. Download and install Node.js from https://nodejs.org
2. Choose the LTS version
3. Restart your command prompt
4. Run `start_callao_web.bat` again

### Web Interface Won't Start
1. Make sure you're in the correct project directory
2. Try running manually:
   ```cmd
   npm install
   npm run dev
   ```

### Can't Login
1. Ensure your Python server is running at `http://localhost:11777`
2. Use the default credentials: admin / admin123
3. Check the browser console for any error messages

## Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐
│   Web Interface     │    │   Python Server     │
│   localhost:5173    │◄──►│   localhost:11777   │
│   (React App)       │    │   (File Operations) │
└─────────────────────┘    └─────────────────────┘
```

The web interface communicates with your Python server to perform all file operations, user authentication, and server management.

## Next Steps

1. ✅ Start Python server (Done)
2. 🚀 Run `start_callao_web.bat`
3. 🌐 Open `http://localhost:5173`
4. 🔐 Login with admin/admin123
5. 📁 Enjoy your personal cloud!