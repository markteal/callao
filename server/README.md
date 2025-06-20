# Callao Personal Cloud File Server

A secure, personal cloud file server for Windows 11 that allows remote access to your local drives over the internet.

## Features

- 🛡️ **Secure Authentication** - User accounts with password protection
- 📁 **Drive Sharing** - Share any local drive (default: G:\)
- 🌐 **Remote Access** - Access files from anywhere via web interface
- 📊 **Activity Logging** - Track all file operations and user activity
- ⚙️ **Configurable** - Customize port, drive, and security settings
- 🔒 **Session Management** - Secure token-based authentication
- 📱 **Web Interface** - Built-in web UI for file management

## Quick Start

### Installation

1. **Download and Extract** the Callao server files to a folder (e.g., `C:\Callao`)

2. **Run the installer** as Administrator:
   ```cmd
   install_server.bat
   ```

3. **Start the server** by double-clicking the desktop shortcut or running:
   ```cmd
   python callao_server.py
   ```

### First Time Setup

1. The server will start on port **11777** by default
2. Access the web interface at: `http://localhost:11777`
3. Default login credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
4. Change the default password after first login

## Configuration

### Command Line Options

```cmd
python callao_server.py --port 8080 --drive D --config my_config.json
```

- `--port`: Server port (default: 11777)
- `--drive`: Drive letter to share (default: G)
- `--config`: Configuration file path

### Configuration File

The server creates a `callao_config.json` file with these settings:

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

## Remote Access Setup

To access your files from outside your home network:

### 1. Router Port Forwarding

Configure your router to forward external traffic to your server:

- **External Port:** 11777 (or your chosen port)
- **Internal IP:** Your PC's local IP (e.g., 192.168.1.100)
- **Internal Port:** 11777
- **Protocol:** TCP

### 2. Find Your External IP

- Visit [whatismyipaddress.com](https://whatismyipaddress.com) to find your public IP
- Access your server remotely at: `http://YOUR_PUBLIC_IP:11777`

### 3. Dynamic DNS (Recommended)

For a permanent address, use a Dynamic DNS service:
- Sign up with providers like No-IP, DuckDNS, or DynDNS
- Configure your router or use their client software
- Access via: `http://yourdomain.ddns.net:11777`

## Security Considerations

### Default Security Features

- ✅ Password-protected user accounts
- ✅ Session token authentication
- ✅ Activity logging and monitoring
- ✅ Path traversal protection
- ✅ IP address restrictions (configurable)

### Recommended Security Practices

1. **Change Default Password** immediately after installation
2. **Use Strong Passwords** for all user accounts
3. **Enable SSL/TLS** for encrypted connections (requires certificate)
4. **Restrict IP Access** to known addresses when possible
5. **Regular Updates** - Keep the server software updated
6. **Firewall Rules** - Configure Windows Firewall appropriately
7. **Monitor Logs** - Check `callao_server.log` regularly

### SSL/TLS Setup (Advanced)

For encrypted connections, you'll need SSL certificates:

1. Generate self-signed certificate:
   ```cmd
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. Update configuration to enable SSL
3. Access via `https://` instead of `http://`

## API Endpoints

The server provides a REST API for client applications:

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### File Operations
- `GET /api/files?path=/folder` - List directory contents
- `GET /api/download/{path}` - Download file
- `POST /api/upload` - Upload files
- `POST /api/create-folder` - Create new folder
- `POST /api/delete` - Delete files/folders
- `POST /api/rename` - Rename files/folders

### Server Status
- `GET /api/status` - Server status and drive info

## File Structure

```
callao/
├── callao_server.py      # Main server application
├── callao_config.json    # Configuration file
├── callao.db            # SQLite database (users, sessions, logs)
├── callao_server.log    # Server activity log
├── requirements.txt     # Python dependencies
├── install_server.bat   # Windows installer
└── README.md           # This file
```

## Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 11777 is already in use
- Verify the specified drive exists and is accessible
- Run as Administrator if needed

**Can't access remotely:**
- Verify port forwarding is configured correctly
- Check Windows Firewall settings
- Confirm your public IP address

**Login fails:**
- Use default credentials: admin / admin123
- Check `callao_server.log` for error messages
- Verify database file permissions

**Files not showing:**
- Confirm the drive letter is correct
- Check file/folder permissions
- Verify the path exists

### Log Files

Check these files for troubleshooting:
- `callao_server.log` - Server activity and errors
- Windows Event Viewer - System-level issues

## Advanced Usage

### Multiple Users

Add users via the database or API:
```python
# Connect to callao.db and add users
# Or use the planned web admin interface
```

### Custom Client Applications

Build custom clients using the REST API:
- Authentication with JWT tokens
- File operations via HTTP requests
- Real-time updates with WebSocket (planned)

### Backup and Sync

The server can be extended with:
- Automatic backup scheduling
- Folder synchronization
- Version control for files

## Support and Updates

- **Documentation:** Check this README and inline code comments
- **Logs:** Monitor `callao_server.log` for issues
- **Updates:** Download new versions and replace files
- **Community:** Share configurations and extensions

## License

This software is provided as-is for personal use. Modify and distribute according to your needs.

---

**⚠️ Security Warning:** This server provides access to your local files over the internet. Always use strong passwords, enable SSL when possible, and monitor access logs regularly.