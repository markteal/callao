#!/usr/bin/env python3
"""
Callao Personal Cloud File Server
A secure, personal cloud file server for Windows 11
"""

import os
import sys
import json
import sqlite3
import hashlib
import secrets
import time
import threading
import subprocess
import signal
import cgi
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import mimetypes
import argparse

# Configuration
DEFAULT_CONFIG = {
    "port": 11777,
    "drive_letter": "G",
    "max_connections": 10,
    "enable_ssl": False,
    "allowed_ips": ["*"],
    "session_timeout": 3600,
    "max_file_size": 1073741824,
    "chunk_size": 1048576,
    "enable_remote_restart": True,
    "restart_delay": 3
}

class CallaoServer:
    def __init__(self, config_file="callao_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.db_file = "callao.db"
        self.log_file = "callao_server.log"
        self.sessions = {}
        self.restart_requested = False
        self.server_instance = None
        
        # Initialize database
        self.init_database()
        
        # Setup logging
        self.setup_logging()
        
        print(f"🛡️  Callao Personal Cloud File Server")
        print(f"📁 Sharing drive: {self.config['drive_letter']}:\\")
        print(f"🌐 Server port: {self.config['port']}")
        print(f"🔒 Remote restart: {'Enabled' if self.config.get('enable_remote_restart', True) else 'Disabled'}")
        print(f"⚙️  Configuration: {self.config_file}")
        print()

    def load_config(self):
        """Load configuration from file or create default"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    # Merge with defaults for any missing keys
                    for key, value in DEFAULT_CONFIG.items():
                        if key not in config:
                            config[key] = value
                    return config
            else:
                # Create default config file
                with open(self.config_file, 'w') as f:
                    json.dump(DEFAULT_CONFIG, f, indent=2)
                return DEFAULT_CONFIG.copy()
        except Exception as e:
            print(f"Error loading config: {e}")
            return DEFAULT_CONFIG.copy()

    def save_config(self):
        """Save current configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def setup_logging(self):
        """Setup basic logging"""
        import logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                ip_address TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Activity logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                target TEXT,
                ip_address TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'success',
                details TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create default admin user if no users exist
        cursor.execute('SELECT COUNT(*) FROM users')
        if cursor.fetchone()[0] == 0:
            admin_password = self.hash_password("admin123")
            cursor.execute('''
                INSERT INTO users (username, password_hash, email, role)
                VALUES (?, ?, ?, ?)
            ''', ("admin", admin_password, "admin@callao.local", "admin"))
            print("✅ Created default admin user: admin / admin123")
        
        conn.commit()
        conn.close()

    def hash_password(self, password):
        """Hash password with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}:{password_hash.hex()}"

    def verify_password(self, password, password_hash):
        """Verify password against hash"""
        try:
            salt, hash_hex = password_hash.split(':')
            password_check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            return password_check.hex() == hash_hex
        except:
            return False

    def create_session(self, user_id, ip_address):
        """Create new session for user"""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(seconds=self.config['session_timeout'])
        
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        # Clean up old sessions for this user
        cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
        
        # Create new session
        cursor.execute('''
            INSERT INTO sessions (token, user_id, expires_at, ip_address)
            VALUES (?, ?, ?, ?)
        ''', (token, user_id, expires_at, ip_address))
        
        conn.commit()
        conn.close()
        
        # Store in memory for quick access
        self.sessions[token] = {
            'user_id': user_id,
            'expires_at': expires_at,
            'ip_address': ip_address
        }
        
        return token

    def validate_session(self, token):
        """Validate session token"""
        if not token:
            return None
            
        # Check memory cache first
        if token in self.sessions:
            session = self.sessions[token]
            if datetime.now() < session['expires_at']:
                return session
            else:
                # Session expired, remove from cache
                del self.sessions[token]
        
        # Check database
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, expires_at, ip_address 
            FROM sessions 
            WHERE token = ?
        ''', (token,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            user_id, expires_str, ip_address = result
            expires_at = datetime.fromisoformat(expires_str)
            
            print(f"Session validation - Token: {token[:8]}..., Expires: {expires_at}, Current: {datetime.now()}")
            
            if datetime.now() < expires_at:
                # Valid session, cache it
                session = {
                    'user_id': user_id,
                    'expires_at': expires_at,
                    'ip_address': ip_address
                }
                self.sessions[token] = session
                return session
            else:
                # Session expired, clean up
                self.cleanup_expired_sessions()
        
        return None

    def cleanup_expired_sessions(self):
        """Remove expired sessions from database and cache"""
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM sessions WHERE expires_at < ?', (datetime.now(),))
        conn.commit()
        conn.close()
        
        # Clean up memory cache
        expired_tokens = []
        for token, session in self.sessions.items():
            if datetime.now() >= session['expires_at']:
                expired_tokens.append(token)
        
        for token in expired_tokens:
            del self.sessions[token]

    def get_auth_user(self, headers):
        """Get authenticated user from request headers"""
        auth_header = headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        session = self.validate_session(token)
        
        if not session:
            return None
        
        # Get user details
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, role, is_active
            FROM users 
            WHERE id = ?
        ''', (session['user_id'],))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[4]:  # Check if user is active
            return {
                'id': result[0],
                'username': result[1],
                'email': result[2],
                'role': result[3],
                'is_active': result[4]
            }
        
        return None

    def require_auth(self, headers, required_role=None):
        """Require authentication and optionally specific role"""
        user = self.get_auth_user(headers)
        if not user:
            return None, "Authentication required"
        
        if required_role and user['role'] != required_role:
            return None, f"Access denied. {required_role} role required"
        
        return user, None

    def log_activity(self, user_id, action, target="", ip_address="", status="success", details=""):
        """Log user activity"""
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO activity_logs (user_id, action, target, ip_address, status, details)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, action, target, ip_address, status, details))
        
        conn.commit()
        conn.close()

    def get_drive_info(self):
        """Get drive information"""
        drive_path = f"{self.config['drive_letter']}:\\"
        
        if not os.path.exists(drive_path):
            return {
                'exists': False,
                'drive_letter': self.config['drive_letter'],
                'total': 0,
                'used': 0,
                'free': 0
            }
        
        try:
            import shutil
            total, used, free = shutil.disk_usage(drive_path)
            return {
                'exists': True,
                'drive_letter': self.config['drive_letter'],
                'total': total,
                'used': used,
                'free': free
            }
        except Exception as e:
            print(f"Error getting drive info: {e}")
            return {
                'exists': False,
                'drive_letter': self.config['drive_letter'],
                'total': 0,
                'used': 0,
                'free': 0,
                'error': str(e)
            }

    def count_files_and_folders(self, path):
        """Count files and folders recursively"""
        file_count = 0
        folder_count = 0
        
        try:
            for root, dirs, files in os.walk(path):
                file_count += len(files)
                folder_count += len(dirs)
        except (PermissionError, OSError):
            pass
        
        return file_count, folder_count

    def restart_server_process(self):
        """Restart the server process"""
        if not self.config.get('enable_remote_restart', True):
            return False, "Remote restart is disabled"
        
        try:
            print("\n🔄 Server restart initiated by admin")
            print("Shutting down server for restart...")
            
            # Get the current script path and arguments
            script_path = os.path.abspath(sys.argv[0])
            python_exe = sys.executable
            
            # Prepare restart command
            restart_cmd = [python_exe, script_path] + sys.argv[1:]
            
            print(f"Restart command: {' '.join(restart_cmd)}")
            
            # Schedule restart in a separate thread
            def delayed_restart():
                delay = self.config.get('restart_delay', 3)
                print(f"Restarting in {delay} seconds...")
                time.sleep(delay)
                
                try:
                    # Start new process
                    if os.name == 'nt':  # Windows
                        # Use CREATE_NEW_CONSOLE to create a new command window
                        subprocess.Popen(
                            restart_cmd,
                            creationflags=subprocess.CREATE_NEW_CONSOLE,
                            cwd=os.path.dirname(script_path)
                        )
                    else:  # Unix-like
                        subprocess.Popen(restart_cmd, cwd=os.path.dirname(script_path))
                    
                    print("✅ New server process started")
                    
                    # Exit current process
                    os._exit(0)
                    
                except Exception as e:
                    print(f"❌ Failed to restart: {e}")
                    os._exit(1)
            
            # Start restart thread
            restart_thread = threading.Thread(target=delayed_restart, daemon=True)
            restart_thread.start()
            
            return True, f"Server restart initiated. Restarting in {self.config.get('restart_delay', 3)} seconds."
            
        except Exception as e:
            print(f"❌ Restart failed: {e}")
            return False, f"Restart failed: {str(e)}"

class CallaoRequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, server_instance=None, **kwargs):
        self.server_instance = server_instance
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        """Override to use our logger"""
        if hasattr(self.server_instance, 'logger'):
            self.server_instance.logger.info(f"{self.client_address[0]} - \"{format % args}\"")

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def send_cors_headers(self):
        """Send CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json_response(self, data, status_code=200):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        response_json = json.dumps(data, default=str)
        self.wfile.write(response_json.encode())

    def send_error_response(self, message, status_code=400):
        """Send error response"""
        self.send_json_response({'error': message}, status_code)

    def get_request_body(self):
        """Get request body as JSON"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                return json.loads(body.decode())
            return {}
        except Exception as e:
            print(f"Error parsing request body: {e}")
            return {}

    def parse_multipart_form_data(self):
        """Parse multipart form data for file uploads"""
        try:
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                return None, None
            
            # Get boundary from content type
            boundary = None
            for part in content_type.split(';'):
                if 'boundary=' in part:
                    boundary = part.split('boundary=')[1].strip()
                    break
            
            if not boundary:
                return None, None
            
            # Read the entire request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                return None, None
            
            body = self.rfile.read(content_length)
            
            # Parse multipart data manually (simplified)
            boundary_bytes = f'--{boundary}'.encode()
            parts = body.split(boundary_bytes)
            
            files = {}
            form_data = {}
            
            for part in parts:
                if not part or part == b'--\r\n' or part == b'--':
                    continue
                
                # Find the headers section
                if b'\r\n\r\n' not in part:
                    continue
                
                headers_section, content = part.split(b'\r\n\r\n', 1)
                headers_text = headers_section.decode('utf-8', errors='ignore')
                
                # Remove trailing boundary markers
                content = content.rstrip(b'\r\n--')
                
                # Parse Content-Disposition header
                filename = None
                field_name = None
                
                for line in headers_text.split('\r\n'):
                    if line.startswith('Content-Disposition:'):
                        # Extract field name and filename
                        if 'name="' in line:
                            start = line.find('name="') + 6
                            end = line.find('"', start)
                            field_name = line[start:end]
                        
                        if 'filename="' in line:
                            start = line.find('filename="') + 10
                            end = line.find('"', start)
                            filename = line[start:end]
                
                if field_name:
                    if filename:  # This is a file
                        files[field_name] = {
                            'filename': filename,
                            'content': content
                        }
                    else:  # This is a form field
                        form_data[field_name] = content.decode('utf-8', errors='ignore')
            
            return files, form_data
            
        except Exception as e:
            print(f"Error parsing multipart data: {e}")
            return None, None

    def do_GET(self):
        """Handle GET requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)

        if path == '/':
            self.serve_status_page()
        elif path == '/api/status':
            self.handle_status()
        elif path == '/api/files':
            self.handle_list_files(query_params)
        elif path.startswith('/api/download/'):
            self.handle_download(path[13:])  # Remove '/api/download'
        elif path == '/api/storage-stats':
            self.handle_storage_stats()
        elif path == '/api/users':
            self.handle_get_users()
        elif path == '/api/activity-logs':
            self.handle_get_activity_logs(query_params)
        else:
            self.send_error_response('Not found', 404)

    def do_POST(self):
        """Handle POST requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == '/api/login':
            self.handle_login()
        elif path == '/api/logout':
            self.handle_logout()
        elif path == '/api/upload':
            self.handle_upload()
        elif path == '/api/create-folder':
            self.handle_create_folder()
        elif path == '/api/delete':
            self.handle_delete()
        elif path == '/api/rename':
            self.handle_rename()
        elif path == '/api/server/restart':
            self.handle_server_restart()
        elif path == '/api/users':
            self.handle_create_user()
        elif path == '/api/users/change-password':
            self.handle_change_password()
        else:
            self.send_error_response('Not found', 404)

    def do_PUT(self):
        """Handle PUT requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path.startswith('/api/users/'):
            user_id = path.split('/')[-1]
            self.handle_update_user(user_id)
        else:
            self.send_error_response('Not found', 404)

    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path.startswith('/api/users/'):
            user_id = path.split('/')[-1]
            self.handle_delete_user(user_id)
        else:
            self.send_error_response('Not found', 404)

    def serve_status_page(self):
        """Serve basic status page"""
        drive_info = self.server_instance.get_drive_info()
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Callao Personal Cloud Server</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .status {{ color: #28a745; font-weight: bold; }}
                .info {{ margin: 10px 0; }}
                .drive-info {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Callao Personal Cloud Server</h1>
                <div class="status">Server is running</div>
                
                <div class="info"><strong>Port:</strong> {self.server_instance.config['port']}</div>
                <div class="info"><strong>Drive:</strong> {self.server_instance.config['drive_letter']}:\\</div>
                
                <div class="drive-info">
                    <h3>Drive Information</h3>
                    {'<div class="status">Drive accessible</div>' if drive_info['exists'] else '<div style="color: #dc3545;">Drive not accessible</div>'}
                    {f'<div>Total: {drive_info["total"] // (1024**3):.1f} GB</div>' if drive_info['exists'] else ''}
                    {f'<div>Free: {drive_info["free"] // (1024**3):.1f} GB</div>' if drive_info['exists'] else ''}
                </div>
                
                <div class="info">
                    <strong>Web Interface:</strong> 
                    <a href="http://localhost:5173" target="_blank">http://localhost:5173</a>
                </div>
                
                <div class="info">
                    <strong>API Status:</strong> 
                    <a href="/api/status">/api/status</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(html.encode())

    def handle_status(self):
        """Handle server status request"""
        drive_info = self.server_instance.get_drive_info()
        
        status = {
            'status': 'running',
            'port': self.server_instance.config['port'],
            'drive': drive_info,
            'connections': len(self.server_instance.sessions),
            'config': {
                'drive_letter': self.server_instance.config['drive_letter'],
                'max_connections': self.server_instance.config['max_connections'],
                'enable_ssl': self.server_instance.config['enable_ssl']
            }
        }
        
        self.send_json_response(status)

    def handle_storage_stats(self):
        """Handle storage statistics request"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return
        
        drive_info = self.server_instance.get_drive_info()
        
        if not drive_info['exists']:
            self.send_json_response({
                'total_storage': 0,
                'used_storage': 0,
                'free_storage': 0,
                'total_files': 0,
                'total_folders': 0,
                'error': 'Drive not accessible'
            })
            return
        
        # Count files and folders
        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        file_count, folder_count = self.server_instance.count_files_and_folders(drive_path)
        
        stats = {
            'total_storage': drive_info['total'],
            'used_storage': drive_info['used'],
            'free_storage': drive_info['free'],
            'total_files': file_count,
            'total_folders': folder_count
        }
        
        self.send_json_response(stats)

    def handle_login(self):
        """Handle user login"""
        data = self.get_request_body()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            self.send_error_response('Username and password required')
            return

        conn = sqlite3.connect(self.server_instance.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, password_hash, email, role, is_active
            FROM users 
            WHERE username = ?
        ''', (username,))
        
        result = cursor.fetchone()
        conn.close()

        if result and result[5] and self.server_instance.verify_password(password, result[2]):
            user_id, username, _, email, role, _ = result
            
            # Create session
            token = self.server_instance.create_session(user_id, self.client_address[0])
            
            # Update last login
            conn = sqlite3.connect(self.server_instance.db_file)
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', (datetime.now(), user_id))
            conn.commit()
            conn.close()
            
            # Log activity
            self.server_instance.log_activity(user_id, 'login', '', self.client_address[0])
            
            user_data = {
                'id': user_id,
                'username': username,
                'email': email,
                'role': role
            }
            
            self.send_json_response({
                'success': True,
                'token': token,
                'user': user_data
            })
        else:
            # Log failed login attempt
            self.server_instance.log_activity(None, 'login_failed', username, self.client_address[0], 'error')
            self.send_error_response('Invalid credentials', 401)

    def handle_logout(self):
        """Handle user logout"""
        user = self.server_instance.get_auth_user(self.headers)
        if user:
            # Remove session
            auth_header = self.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
                
                # Remove from database
                conn = sqlite3.connect(self.server_instance.db_file)
                cursor = conn.cursor()
                cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
                conn.commit()
                conn.close()
                
                # Remove from memory
                if token in self.server_instance.sessions:
                    del self.server_instance.sessions[token]
                
                # Log activity
                self.server_instance.log_activity(user['id'], 'logout', '', self.client_address[0])
        
        self.send_json_response({'success': True})

    def handle_list_files(self, query_params):
        """Handle file listing request"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        path = query_params.get('path', [''])[0]
        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        
        # Construct full path
        if path and path != '/':
            full_path = os.path.join(drive_path, path.lstrip('/'))
        else:
            full_path = drive_path
        
        full_path = os.path.normpath(full_path)
        
        # Security check
        if not full_path.startswith(drive_path):
            self.send_error_response('Access denied', 403)
            return
        
        if not os.path.exists(full_path):
            self.send_error_response('Path not found', 404)
            return
        
        try:
            files = []
            for item in os.listdir(full_path):
                item_path = os.path.join(full_path, item)
                
                try:
                    stat = os.stat(item_path)
                    is_dir = os.path.isdir(item_path)
                    
                    # Calculate relative path from drive root
                    rel_path = os.path.relpath(item_path, drive_path).replace('\\', '/')
                    if rel_path == '.':
                        rel_path = item
                    
                    files.append({
                        'name': item,
                        'type': 'folder' if is_dir else 'file',
                        'size': 0 if is_dir else stat.st_size,
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'path': f"/{rel_path}",
                        'permissions': {
                            'read': True,
                            'write': True,
                            'delete': True
                        }
                    })
                except (PermissionError, OSError):
                    continue
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'list_directory', path or '/', self.client_address[0])
            
            self.send_json_response({'files': files})
            
        except Exception as e:
            self.send_error_response(f'Failed to list files: {str(e)}', 500)

    def handle_download(self, file_path):
        """Handle file download"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        # Decode URL path
        file_path = unquote(file_path)
        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        full_path = os.path.join(drive_path, file_path.lstrip('/'))
        full_path = os.path.normpath(full_path)
        
        # Security check
        if not full_path.startswith(drive_path):
            self.send_error_response('Access denied', 403)
            return
        
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.send_error_response('File not found', 404)
            return
        
        try:
            # Get file info
            file_size = os.path.getsize(full_path)
            filename = os.path.basename(full_path)
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(full_path)
            if not content_type:
                content_type = 'application/octet-stream'
            
            # Send headers
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(file_size))
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_cors_headers()
            self.end_headers()
            
            # Send file content
            with open(full_path, 'rb') as f:
                chunk_size = self.server_instance.config['chunk_size']
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'download', file_path, self.client_address[0])
            
        except Exception as e:
            self.send_error_response(f'Download failed: {str(e)}', 500)

    def handle_upload(self):
        """Handle file upload"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        try:
            # Parse multipart form data
            files, form_data = self.parse_multipart_form_data()
            
            if not files or 'file' not in files:
                self.send_error_response('No file provided')
                return
            
            file_info = files['file']
            filename = file_info['filename']
            file_content = file_info['content']
            
            # Get upload path from form data
            upload_path = form_data.get('path', '').strip()
            
            # Validate filename
            if not filename or filename == '':
                self.send_error_response('Invalid filename')
                return
            
            # Sanitize filename
            filename = os.path.basename(filename)  # Remove any path components
            
            # Check file size
            if len(file_content) > self.server_instance.config['max_file_size']:
                self.send_error_response(f'File too large. Maximum size: {self.server_instance.config["max_file_size"]} bytes')
                return
            
            # Construct destination path
            drive_path = f"{self.server_instance.config['drive_letter']}:\\"
            
            if upload_path and upload_path != '/':
                dest_dir = os.path.join(drive_path, upload_path.lstrip('/'))
            else:
                dest_dir = drive_path
            
            dest_dir = os.path.normpath(dest_dir)
            dest_file = os.path.join(dest_dir, filename)
            
            # Security checks
            if not dest_dir.startswith(drive_path) or not dest_file.startswith(drive_path):
                self.send_error_response('Access denied', 403)
                return
            
            # Ensure destination directory exists
            if not os.path.exists(dest_dir):
                self.send_error_response('Destination directory not found', 404)
                return
            
            # Check if file already exists
            if os.path.exists(dest_file):
                # Generate unique filename
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(dest_file):
                    new_filename = f"{base}_{counter}{ext}"
                    dest_file = os.path.join(dest_dir, new_filename)
                    counter += 1
                filename = os.path.basename(dest_file)
            
            # Write file
            with open(dest_file, 'wb') as f:
                f.write(file_content)
            
            # Log activity
            self.server_instance.log_activity(
                user['id'], 
                'upload', 
                f"{upload_path}/{filename}".replace('//', '/'), 
                self.client_address[0],
                details=f"Size: {len(file_content)} bytes"
            )
            
            print(f"📤 File uploaded: {filename} ({len(file_content)} bytes) by {user['username']}")
            
            self.send_json_response({
                'success': True,
                'filename': filename,
                'size': len(file_content),
                'path': f"{upload_path}/{filename}".replace('//', '/')
            })
            
        except Exception as e:
            print(f"Upload error: {e}")
            self.server_instance.log_activity(
                user['id'] if 'user' in locals() else None,
                'upload',
                '',
                self.client_address[0],
                'error',
                str(e)
            )
            self.send_error_response(f'Upload failed: {str(e)}', 500)

    def handle_create_folder(self):
        """Handle folder creation"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        data = self.get_request_body()
        path = data.get('path', '')
        name = data.get('name', '').strip()

        if not name:
            self.send_error_response('Folder name required')
            return

        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        
        if path and path != '/':
            full_path = os.path.join(drive_path, path.lstrip('/'), name)
        else:
            full_path = os.path.join(drive_path, name)
        
        full_path = os.path.normpath(full_path)
        
        # Security check
        if not full_path.startswith(drive_path):
            self.send_error_response('Access denied', 403)
            return

        try:
            os.makedirs(full_path, exist_ok=False)
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'create_folder', f"{path}/{name}", self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except FileExistsError:
            self.send_error_response('Folder already exists')
        except Exception as e:
            self.send_error_response(f'Failed to create folder: {str(e)}', 500)

    def handle_delete(self):
        """Handle file/folder deletion"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        data = self.get_request_body()
        path = data.get('path', '')

        if not path:
            self.send_error_response('Path required')
            return

        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        full_path = os.path.join(drive_path, path.lstrip('/'))
        full_path = os.path.normpath(full_path)
        
        # Security check
        if not full_path.startswith(drive_path):
            self.send_error_response('Access denied', 403)
            return

        if not os.path.exists(full_path):
            self.send_error_response('Path not found', 404)
            return

        try:
            if os.path.isdir(full_path):
                import shutil
                shutil.rmtree(full_path)
            else:
                os.remove(full_path)
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'delete', path, self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except Exception as e:
            self.send_error_response(f'Failed to delete: {str(e)}', 500)

    def handle_rename(self):
        """Handle file/folder rename"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        data = self.get_request_body()
        old_path = data.get('old_path', '')
        new_name = data.get('new_name', '').strip()

        if not old_path or not new_name:
            self.send_error_response('Old path and new name required')
            return

        drive_path = f"{self.server_instance.config['drive_letter']}:\\"
        old_full_path = os.path.join(drive_path, old_path.lstrip('/'))
        old_full_path = os.path.normpath(old_full_path)
        
        # Security check
        if not old_full_path.startswith(drive_path):
            self.send_error_response('Access denied', 403)
            return

        if not os.path.exists(old_full_path):
            self.send_error_response('Path not found', 404)
            return

        # Construct new path
        parent_dir = os.path.dirname(old_full_path)
        new_full_path = os.path.join(parent_dir, new_name)

        try:
            os.rename(old_full_path, new_full_path)
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'rename', f"{old_path} -> {new_name}", self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except Exception as e:
            self.send_error_response(f'Failed to rename: {str(e)}', 500)

    def handle_server_restart(self):
        """Handle server restart request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        # Log activity
        self.server_instance.log_activity(user['id'], 'server_restart', '', self.client_address[0])
        
        print(f"\n🔄 Server restart initiated by {user['username']} from {self.client_address[0]}")
        
        success, message = self.server_instance.restart_server_process()
        
        if success:
            self.send_json_response({
                'success': True,
                'message': message,
                'restart_delay': self.server_instance.config.get('restart_delay', 3)
            })
        else:
            self.send_error_response(message, 500)

    def handle_get_users(self):
        """Handle get users request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        conn = sqlite3.connect(self.server_instance.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, role, created_at, last_login, is_active
            FROM users
            ORDER BY created_at DESC
        ''')
        
        users = []
        for row in cursor.fetchall():
            users.append({
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'role': row[3],
                'created_at': row[4],
                'last_login': row[5],
                'is_active': bool(row[6])
            })
        
        conn.close()
        self.send_json_response({'users': users})

    def handle_create_user(self):
        """Handle create user request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        data = self.get_request_body()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip()
        role = data.get('role', 'user')

        if not username or not password:
            self.send_error_response('Username and password required')
            return

        try:
            conn = sqlite3.connect(self.server_instance.db_file)
            cursor = conn.cursor()
            
            password_hash = self.server_instance.hash_password(password)
            
            cursor.execute('''
                INSERT INTO users (username, password_hash, email, role)
                VALUES (?, ?, ?, ?)
            ''', (username, password_hash, email, role))
            
            conn.commit()
            conn.close()
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'create_user', username, self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except sqlite3.IntegrityError:
            self.send_error_response('Username already exists')
        except Exception as e:
            self.send_error_response(f'Failed to create user: {str(e)}', 500)

    def handle_update_user(self, user_id):
        """Handle update user request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        data = self.get_request_body()
        
        try:
            conn = sqlite3.connect(self.server_instance.db_file)
            cursor = conn.cursor()
            
            # Build update query dynamically
            updates = []
            values = []
            
            if 'username' in data:
                updates.append('username = ?')
                values.append(data['username'])
            
            if 'email' in data:
                updates.append('email = ?')
                values.append(data['email'])
            
            if 'role' in data:
                updates.append('role = ?')
                values.append(data['role'])
            
            if 'isActive' in data:
                updates.append('is_active = ?')
                values.append(data['isActive'])
            
            if updates:
                values.append(user_id)
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
                cursor.execute(query, values)
                conn.commit()
            
            conn.close()
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'update_user', user_id, self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except Exception as e:
            self.send_error_response(f'Failed to update user: {str(e)}', 500)

    def handle_delete_user(self, user_id):
        """Handle delete user request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        try:
            conn = sqlite3.connect(self.server_instance.db_file)
            cursor = conn.cursor()
            
            # Deactivate user instead of deleting
            cursor.execute('UPDATE users SET is_active = 0 WHERE id = ?', (user_id,))
            
            # Remove all sessions for this user
            cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
            
            conn.commit()
            conn.close()
            
            # Remove from memory cache
            tokens_to_remove = []
            for token, session in self.server_instance.sessions.items():
                if session['user_id'] == int(user_id):
                    tokens_to_remove.append(token)
            
            for token in tokens_to_remove:
                del self.server_instance.sessions[token]
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'delete_user', user_id, self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except Exception as e:
            self.send_error_response(f'Failed to delete user: {str(e)}', 500)

    def handle_change_password(self):
        """Handle change password request"""
        user, error = self.server_instance.require_auth(self.headers, 'admin')
        if not user:
            self.send_error_response(error or "Admin access required", 401)
            return

        data = self.get_request_body()
        user_id = data.get('user_id')
        new_password = data.get('new_password', '')

        if not user_id or not new_password:
            self.send_error_response('User ID and new password required')
            return

        try:
            conn = sqlite3.connect(self.server_instance.db_file)
            cursor = conn.cursor()
            
            password_hash = self.server_instance.hash_password(new_password)
            cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
            
            # Remove all sessions for this user (force re-login)
            cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
            
            conn.commit()
            conn.close()
            
            # Remove from memory cache
            tokens_to_remove = []
            for token, session in self.server_instance.sessions.items():
                if session['user_id'] == user_id:
                    tokens_to_remove.append(token)
            
            for token in tokens_to_remove:
                del self.server_instance.sessions[token]
            
            # Log activity
            self.server_instance.log_activity(user['id'], 'change_password', str(user_id), self.client_address[0])
            
            self.send_json_response({'success': True})
            
        except Exception as e:
            self.send_error_response(f'Failed to change password: {str(e)}', 500)

    def handle_get_activity_logs(self, query_params):
        """Handle get activity logs request"""
        user, error = self.server_instance.require_auth(self.headers)
        if not user:
            self.send_error_response(error or "Authentication required", 401)
            return

        limit = int(query_params.get('limit', [50])[0])
        offset = int(query_params.get('offset', [0])[0])

        conn = sqlite3.connect(self.server_instance.db_file)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT al.id, al.action, al.target, al.ip_address, al.timestamp, al.status, al.details,
                   u.username
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        logs = []
        for row in cursor.fetchall():
            logs.append({
                'id': str(row[0]),
                'action': row[1],
                'target': row[2],
                'ip_address': row[3],
                'timestamp': row[4],
                'status': row[5],
                'details': row[6],
                'user': row[7] or 'Unknown'
            })
        
        conn.close()
        self.send_json_response({'logs': logs})

def create_request_handler(server_instance):
    """Create request handler with server instance"""
    def handler(*args, **kwargs):
        return CallaoRequestHandler(*args, server_instance=server_instance, **kwargs)
    return handler

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Callao Personal Cloud File Server')
    parser.add_argument('--port', type=int, help='Server port')
    parser.add_argument('--drive', help='Drive letter to share')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--disable-restart', action='store_true', help='Disable remote restart functionality')
    
    args = parser.parse_args()
    
    # Create server instance
    config_file = args.config or "callao_config.json"
    server_instance = CallaoServer(config_file)
    
    # Override config with command line arguments
    if args.port:
        server_instance.config['port'] = args.port
    if args.drive:
        server_instance.config['drive_letter'] = args.drive.upper()
    if args.disable_restart:
        server_instance.config['enable_remote_restart'] = False
    
    # Save updated config
    server_instance.save_config()
    
    # Check if drive exists and show available drives
    drive_path = f"{server_instance.config['drive_letter']}:\\"
    if not os.path.exists(drive_path):
        print(f"⚠️  Warning: Drive {server_instance.config['drive_letter']}:\\ not found!")
        
        # Get available drives without using backslash in f-string
        available_drives = []
        for drive_letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
            drive_test_path = f"{drive_letter}:\\"
            if os.path.exists(drive_test_path):
                available_drives.append(f"{drive_letter}:")
        
        print(f"   Available drives: {', '.join(available_drives)}")
        print(f"   You can change the drive with: python callao_server.py --drive D")
        print()
    
    try:
        # Create HTTP server
        handler = create_request_handler(server_instance)
        httpd = HTTPServer(('', server_instance.config['port']), handler)
        server_instance.server_instance = httpd
        
        print(f"🚀 Callao server starting on port {server_instance.config['port']}")
        print(f"🌐 Access at: http://localhost:{server_instance.config['port']}")
        print(f"🔗 Web interface: http://localhost:5173")
        print(f"🛑 Press Ctrl+C to stop")
        print()
        
        # Start server
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
    finally:
        if server_instance.server_instance:
            server_instance.server_instance.server_close()

if __name__ == "__main__":
    main()