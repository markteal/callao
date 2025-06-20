# Callao Personal Cloud File Server - Windows Deployment Guide

This guide will help you deploy Callao on your Windows 11 PC to create your own personal cloud file server.

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- Windows 11 PC
- Python 3.8+ installed ([Download here](https://python.org))
- Administrator access
- Any accessible drive (default: G:\, configurable to any drive)

### Installation Steps

1. **Download Callao Files**
   - Extract all files to a folder (e.g., `C:\Callao`)

2. **Run Setup Script**
   - Right-click `setup_callao.bat` → "Run as administrator"
   - Follow the installation prompts
   - Wait for setup to complete

3. **Start the Server**
   - Double-click `Callao Server.bat` on your desktop
   - Server will start on port 11777
   - Note the server address displayed

4. **Test Local Access**
   - Open browser to `http://localhost:11777`
   - Login with: `admin` / `admin123`
   - You should see the Callao web interface

5. **Connect with Client**
   - Double-click `Callao Client.bat` on your desktop
   - Connect to `localhost:11777`
   - Use the same login credentials

## 🌐 Remote Access Setup

### Router Configuration

1. **Access Router Admin Panel**
   - Open browser to your router's IP (usually 192.168.1.1)
   - Login with admin credentials

2. **Setup Port Forwarding**
   - Navigate to Port Forwarding / Virtual Servers
   - Add new rule:
     - **Service Name:** Callao
     - **External Port:** 11777
     - **Internal IP:** Your PC's IP (e.g., 192.168.1.100)
     - **Internal Port:** 11777
     - **Protocol:** TCP
   - Save and apply settings

3. **Find Your Public IP**
   - Visit [whatismyipaddress.com](https://whatismyipaddress.com)
   - Note your public IP address

4. **Test Remote Access**
   - From outside your network, access: `http://YOUR_PUBLIC_IP:11777`
   - Use the same login credentials

### Windows Firewall Configuration

1. **Open Windows Defender Firewall**
   - Press Win+R, type `wf.msc`, press Enter

2. **Create Inbound Rule**
   - Click "Inbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP" → Specific local ports: `11777`
   - Allow the connection → Next
   - Apply to all profiles → Next
   - Name: "Callao Server" → Finish

## ⚙️ Configuration

### Server Configuration

Edit `server/callao_config.json`:

```json
{
  "port": 11777,
  "drive_letter": "G",
  "max_connections": 10,
  "enable_ssl": true,
  "allowed_ips": ["*"],
  "session_timeout": 3600,
  "max_file_size": 1073741824,
  "chunk_size": 1048576
}
```

### Change Default Password

1. Start the server
2. Access web interface
3. Login with default credentials
4. Navigate to user management (when available)
5. Change admin password

### Configure Different Drive

To share a different drive (e.g., D:\):

**Method 1: Edit Configuration File**
1. Stop the server
2. Edit `callao_config.json`
3. Change `"drive_letter": "D"`
4. Restart the server

**Method 2: Command Line**
```cmd
python callao_server.py --drive D
```

**Method 3: Environment Variable**
```cmd
set CALLAO_DRIVE=D
python callao_server.py
```

### Configure Different Port

**Method 1: Edit Configuration File**
1. Stop the server
2. Edit `callao_config.json`
3. Change `"port": 8080`
4. Restart the server

**Method 2: Command Line**
```cmd
python callao_server.py --port 8080
```

## 🔒 Security Best Practices

### Essential Security Steps

1. **Change Default Password**
   - Never use admin/admin123 in production
   - Use strong, unique passwords

2. **Enable SSL/TLS**
   - Generate SSL certificate
   - Update configuration to use HTTPS

3. **Restrict IP Access**
   - Limit access to known IP addresses
   - Update `allowed_ips` in config

4. **Monitor Access Logs**
   - Check `callao_server.log` regularly
   - Watch for suspicious activity

5. **Keep Software Updated**
   - Update Python and dependencies
   - Monitor for Callao updates

### SSL Certificate Setup (Advanced)

1. **Install OpenSSL** (if not available)
2. **Generate Certificate:**
   ```cmd
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```
3. **Update Configuration** to use SSL
4. **Access via HTTPS** instead of HTTP

## 🛠️ Troubleshooting

### Common Issues

**Server Won't Start:**
- Check if port 11777 is already in use
- Verify Python installation
- Run as Administrator
- Check if the configured drive exists and is accessible

**Can't Connect Remotely:**
- Verify port forwarding is configured
- Check Windows Firewall settings
- Confirm public IP address
- Test from different network

**Login Fails:**
- Use correct default credentials: admin/admin123
- Check server logs for errors
- Verify database file permissions

**Files Not Showing:**
- Confirm drive letter is correct in configuration
- Check file/folder permissions
- Verify path exists

**Drive Not Found Error:**
- Ensure the configured drive letter exists
- Check if drive is mounted and accessible
- Try a different drive letter (C:, D:, E:, etc.)

### Log Files

Check these files for troubleshooting:
- `server/callao_server.log` - Server activity and errors
- Windows Event Viewer - System-level issues

### Getting Help

1. **Check Logs** - Always check log files first
2. **Verify Configuration** - Ensure settings are correct
3. **Test Locally** - Confirm local access works before remote
4. **Network Diagnostics** - Use network tools to test connectivity

## 📱 Mobile Access

### Web Browser Access
- Use any mobile browser
- Navigate to your server URL
- Login with credentials
- Basic file operations available

### Future Mobile App
- Native mobile apps planned
- Will provide better mobile experience
- File synchronization capabilities

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Disk Space** - Ensure adequate storage
2. **Check Logs** - Review for errors or security issues
3. **Update Software** - Keep Python and dependencies current
4. **Backup Database** - Save `callao.db` file regularly
5. **Test Remote Access** - Verify external connectivity

### Backup Strategy

1. **Database Backup:**
   ```cmd
   copy callao.db callao_backup_%date%.db
   ```

2. **Configuration Backup:**
   ```cmd
   copy callao_config.json callao_config_backup.json
   ```

3. **Automated Backup** (Advanced):
   - Create scheduled task
   - Backup to cloud storage
   - Include log files

## 🚀 Advanced Features

### Multiple Users
- Add users via database
- Assign different permissions
- Monitor user activity

### Folder Synchronization
- Setup automatic sync
- Configure sync schedules
- Handle conflict resolution

### API Integration
- Use REST API for custom clients
- Build automation scripts
- Integrate with other services

## 📞 Support

### Resources
- README.md files in server/client folders
- Inline code documentation
- Log files for debugging

### Community
- Share configurations and tips
- Report issues and improvements
- Contribute enhancements

---

**⚠️ Important Security Notice:** This server provides access to your local files over the internet. Always use strong passwords, enable SSL when possible, and monitor access logs regularly. Only share access with trusted individuals.