# Callao Connection Troubleshooting Guide

## Issue: "Unable to connect to server or invalid credentials"

### Step 1: Verify Python Server is Running ✅

First, let's make sure your Python server is actually running and accessible:

1. **Check if server is running:**
   - Look for the command prompt window with your Python server
   - It should show: "Callao server starting on port 11777"

2. **Test server directly in browser:**
   - Open browser to: `http://localhost:11777`
   - You should see the Callao server status page

3. **Test API endpoint:**
   - Try: `http://localhost:11777/api/status`
   - Should return JSON with server status

### Step 2: Check Server Configuration

1. **Check your `callao_config.json` file:**
   ```json
   {
     "port": 11777,
     "drive_letter": "D",  // Make sure this matches your actual drive
     "max_connections": 10,
     "enable_ssl": false,  // Try with SSL disabled first
     "allowed_ips": ["*"],
     "session_timeout": 3600,
     "max_file_size": 1073741824,
     "chunk_size": 1048576
   }
   ```

2. **Restart server after config changes:**
   - Stop the Python server (Ctrl+C)
   - Start it again: `python callao_server.py`

### Step 3: Test Client Connection

1. **Use the improved client with connection testing:**
   - The updated client now has a "Test Connection" button
   - This will verify the server is reachable before attempting login

2. **Check connection details:**
   - Server Address: `localhost` (not `http://localhost`)
   - Port: `11777`
   - Username: `admin`
   - Password: `admin123`

### Step 4: Common Issues and Solutions

#### Issue: "Connection refused"
**Solution:** Server is not running
- Start the Python server: `python callao_server.py`
- Check if another program is using port 11777

#### Issue: "Timeout"
**Solution:** Firewall or network issue
- Temporarily disable Windows Firewall
- Check if antivirus is blocking the connection

#### Issue: "Invalid credentials"
**Solution:** Database or authentication issue
- Delete `callao.db` file and restart server (will recreate with default admin user)
- Check server logs for authentication errors

#### Issue: "SSL/TLS errors"
**Solution:** Disable SSL for testing
- Set `"enable_ssl": false` in `callao_config.json`
- Restart server

### Step 5: Debug Mode

1. **Enable debug output:**
   - The updated client now shows detailed connection information
   - Check the command prompt where you started the client for debug messages

2. **Check server logs:**
   - Look at `callao_server.log` for error messages
   - Server console output shows connection attempts

### Step 6: Alternative Testing Methods

1. **Test with curl (if available):**
   ```cmd
   curl -X POST http://localhost:11777/api/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
   ```

2. **Test with PowerShell:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:11777/api/status" -Method GET
   ```

### Step 7: Reset Everything

If nothing works, try a complete reset:

1. **Stop the server**
2. **Delete these files:**
   - `callao.db`
   - `callao_config.json`
   - `callao_server.log`
3. **Restart the server** - it will recreate defaults
4. **Try connecting again**

### Quick Checklist

- [ ] Python server is running and shows startup messages
- [ ] Browser can access `http://localhost:11777`
- [ ] `callao_config.json` has correct drive letter
- [ ] No firewall blocking port 11777
- [ ] Using correct credentials: admin/admin123
- [ ] Client shows "✅ Server is reachable!" in connection test

### Still Having Issues?

If you're still having problems, please share:
1. The exact error message from the client
2. Contents of your `callao_config.json` file
3. Any error messages from the server console
4. Results of the browser test (`http://localhost:11777`)

This will help identify the specific issue!