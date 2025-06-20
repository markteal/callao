#!/usr/bin/env python3
"""
Callao Personal Cloud File Client
A desktop client for accessing your Callao file server
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import requests
import json
import os
import threading
import time
from datetime import datetime
import webbrowser
from urllib.parse import urljoin, quote
import mimetypes

class CallaoClient:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Callao Personal Cloud Client")
        self.root.geometry("1000x700")
        self.root.minsize(800, 600)
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Configure colors
        self.colors = {
            'primary': '#0078D4',
            'secondary': '#00BCF2', 
            'success': '#107C10',
            'warning': '#FF8C00',
            'error': '#D83B01',
            'bg': '#FAFAFA',
            'surface': '#FFFFFF'
        }
        
        # Session data
        self.server_url = ""
        self.token = ""
        self.current_user = None
        self.current_path = "/"
        self.files = []
        self.selected_files = []
        
        # Loading states
        self.is_loading = False
        self.loading_operation = ""
        
        # Create UI
        self.create_widgets()
        self.setup_styles()
        
        # Start with login screen
        self.show_login_screen()
        
    def setup_styles(self):
        """Configure custom styles"""
        # Configure button styles
        self.style.configure('Primary.TButton',
                           background=self.colors['primary'],
                           foreground='white',
                           borderwidth=0,
                           focuscolor='none')
        
        self.style.configure('Success.TButton',
                           background=self.colors['success'],
                           foreground='white',
                           borderwidth=0,
                           focuscolor='none')
        
        self.style.configure('Warning.TButton',
                           background=self.colors['warning'],
                           foreground='white',
                           borderwidth=0,
                           focuscolor='none')
        
        self.style.configure('Error.TButton',
                           background=self.colors['error'],
                           foreground='white',
                           borderwidth=0,
                           focuscolor='none')
        
        # Configure treeview
        self.style.configure('Treeview',
                           background=self.colors['surface'],
                           foreground='black',
                           rowheight=25,
                           fieldbackground=self.colors['surface'])
        
        self.style.configure('Treeview.Heading',
                           background=self.colors['bg'],
                           foreground='black',
                           relief='flat')
        
    def create_widgets(self):
        """Create the main UI widgets"""
        # Main container with padding
        self.main_frame = ttk.Frame(self.root)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)
        
        # Create login frame (initially visible)
        self.create_login_frame()
        
        # Create main app frame (initially hidden)
        self.create_main_app_frame()
        
    def create_login_frame(self):
        """Create the login interface"""
        self.login_frame = ttk.Frame(self.main_frame)
        
        # Center the login form
        login_container = ttk.Frame(self.login_frame)
        login_container.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
        
        # Title
        title_label = ttk.Label(login_container, text="Callao Personal Cloud", 
                               font=('Segoe UI', 24, 'bold'))
        title_label.pack(pady=(0, 10))
        
        subtitle_label = ttk.Label(login_container, text="Connect to your file server", 
                                 font=('Segoe UI', 12))
        subtitle_label.pack(pady=(0, 30))
        
        # Server URL
        ttk.Label(login_container, text="Server Address:", font=('Segoe UI', 10)).pack(anchor=tk.W)
        self.server_entry = ttk.Entry(login_container, width=40, font=('Segoe UI', 10))
        self.server_entry.pack(pady=(5, 15), ipady=5)
        self.server_entry.insert(0, "localhost")
        
        # Port
        ttk.Label(login_container, text="Port:", font=('Segoe UI', 10)).pack(anchor=tk.W)
        self.port_entry = ttk.Entry(login_container, width=40, font=('Segoe UI', 10))
        self.port_entry.pack(pady=(5, 15), ipady=5)
        self.port_entry.insert(0, "11777")
        
        # Username
        ttk.Label(login_container, text="Username:", font=('Segoe UI', 10)).pack(anchor=tk.W)
        self.username_entry = ttk.Entry(login_container, width=40, font=('Segoe UI', 10))
        self.username_entry.pack(pady=(5, 15), ipady=5)
        self.username_entry.insert(0, "") # Default username can be set here
        
        # Password
        ttk.Label(login_container, text="Password:", font=('Segoe UI', 10)).pack(anchor=tk.W)
        self.password_entry = ttk.Entry(login_container, width=40, show="*", font=('Segoe UI', 10))
        self.password_entry.pack(pady=(5, 20), ipady=5)
        self.password_entry.insert(0, "") # Default password can be set here
        
        # Buttons frame
        buttons_frame = ttk.Frame(login_container)
        buttons_frame.pack(pady=10)
        
        # Test connection button
        self.test_btn = ttk.Button(buttons_frame, text="Test Connection", 
                                  command=self.test_connection)
        self.test_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Login button
        self.login_btn = ttk.Button(buttons_frame, text="Connect", 
                                   command=self.login, style='Primary.TButton')
        self.login_btn.pack(side=tk.LEFT)
        
        # Status label
        self.login_status = ttk.Label(login_container, text="", font=('Segoe UI', 9))
        self.login_status.pack(pady=(15, 0))
        
        # Bind Enter key to login
        self.root.bind('<Return>', lambda e: self.login())
        
    def create_main_app_frame(self):
        """Create the main application interface"""
        self.app_frame = ttk.Frame(self.main_frame)
        
        # Header frame
        header_frame = ttk.Frame(self.app_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Title and user info
        title_frame = ttk.Frame(header_frame)
        title_frame.pack(side=tk.LEFT)
        
        ttk.Label(title_frame, text="Callao File Manager", 
                 font=('Segoe UI', 16, 'bold')).pack(anchor=tk.W)
        
        self.user_label = ttk.Label(title_frame, text="", font=('Segoe UI', 9))
        self.user_label.pack(anchor=tk.W)
        
        # Header buttons
        header_buttons = ttk.Frame(header_frame)
        header_buttons.pack(side=tk.RIGHT)
        
        ttk.Button(header_buttons, text="Settings", 
                  command=self.show_settings).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(header_buttons, text="Logout", 
                  command=self.logout, style='Error.TButton').pack(side=tk.LEFT)
        
        # Toolbar frame
        toolbar_frame = ttk.Frame(self.app_frame)
        toolbar_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Navigation frame
        nav_frame = ttk.Frame(toolbar_frame)
        nav_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        ttk.Button(nav_frame, text="← Back", command=self.go_back).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(nav_frame, text="↑ Up", command=self.go_up).pack(side=tk.LEFT, padx=(0, 10))
        
        # Path label
        self.path_label = ttk.Label(nav_frame, text="Path: /", font=('Segoe UI', 9))
        self.path_label.pack(side=tk.LEFT)
        
        # Action buttons frame
        actions_frame = ttk.Frame(toolbar_frame)
        actions_frame.pack(side=tk.RIGHT)
        
        self.refresh_btn = ttk.Button(actions_frame, text="🔄 Refresh", command=self.refresh_files)
        self.refresh_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.upload_btn = ttk.Button(actions_frame, text="📤 Upload", command=self.upload_files)
        self.upload_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.new_folder_btn = ttk.Button(actions_frame, text="📁 New Folder", command=self.create_folder)
        self.new_folder_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.download_btn = ttk.Button(actions_frame, text="📥 Download", 
                                      command=self.download_selected, state=tk.DISABLED)
        self.download_btn.pack(side=tk.LEFT, padx=(0, 5))
        
        self.delete_btn = ttk.Button(actions_frame, text="🗑️ Delete", 
                                    command=self.delete_selected, state=tk.DISABLED, 
                                    style='Error.TButton')
        self.delete_btn.pack(side=tk.LEFT)
        
        # Loading indicator frame
        self.loading_frame = ttk.Frame(self.app_frame)
        self.loading_frame.pack(fill=tk.X, pady=(0, 5))
        
        # Progress bar (initially hidden)
        self.progress_var = tk.StringVar()
        self.progress_label = ttk.Label(self.loading_frame, textvariable=self.progress_var, 
                                       font=('Segoe UI', 9), foreground=self.colors['primary'])
        
        self.progress_bar = ttk.Progressbar(self.loading_frame, mode='indeterminate')
        
        # File list frame with proper scrollbar management
        list_frame = ttk.Frame(self.app_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create treeview for file list
        columns = ('Name', 'Type', 'Size', 'Modified')
        self.file_tree = ttk.Treeview(list_frame, columns=columns, show='tree headings', height=15)
        
        # Configure columns
        self.file_tree.heading('#0', text='', anchor=tk.W)
        self.file_tree.column('#0', width=30, minwidth=30, stretch=False)
        
        self.file_tree.heading('Name', text='Name', anchor=tk.W)
        self.file_tree.column('Name', width=300, minwidth=200)
        
        self.file_tree.heading('Type', text='Type', anchor=tk.W)
        self.file_tree.column('Type', width=100, minwidth=80)
        
        self.file_tree.heading('Size', text='Size', anchor=tk.E)
        self.file_tree.column('Size', width=100, minwidth=80)
        
        self.file_tree.heading('Modified', text='Modified', anchor=tk.W)
        self.file_tree.column('Modified', width=150, minwidth=120)
        
        # Create scrollbars that only show when needed
        v_scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.file_tree.yview)
        h_scrollbar = ttk.Scrollbar(list_frame, orient=tk.HORIZONTAL, command=self.file_tree.xview)
        
        # Configure treeview to use scrollbars
        self.file_tree.configure(yscrollcommand=self.update_v_scrollbar, xscrollcommand=self.update_h_scrollbar)
        
        # Store scrollbar references
        self.v_scrollbar = v_scrollbar
        self.h_scrollbar = h_scrollbar
        
        # Pack treeview first
        self.file_tree.grid(row=0, column=0, sticky='nsew')
        
        # Configure grid weights
        list_frame.grid_rowconfigure(0, weight=1)
        list_frame.grid_columnconfigure(0, weight=1)
        
        # Bind events
        self.file_tree.bind('<Double-1>', self.on_double_click)
        self.file_tree.bind('<<TreeviewSelect>>', self.on_selection_change)
        self.file_tree.bind('<Button-3>', self.show_context_menu)
        
        # Status bar
        self.status_bar = ttk.Label(self.app_frame, text="Ready", relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X, pady=(10, 0))
        
    def update_v_scrollbar(self, first, last):
        """Update vertical scrollbar visibility"""
        first, last = float(first), float(last)
        if first <= 0.0 and last >= 1.0:
            # Content fits, hide scrollbar
            self.v_scrollbar.grid_remove()
        else:
            # Content doesn't fit, show scrollbar
            self.v_scrollbar.grid(row=0, column=1, sticky='ns')
        self.v_scrollbar.set(first, last)
        
    def update_h_scrollbar(self, first, last):
        """Update horizontal scrollbar visibility"""
        first, last = float(first), float(last)
        if first <= 0.0 and last >= 1.0:
            # Content fits, hide scrollbar
            self.h_scrollbar.grid_remove()
        else:
            # Content doesn't fit, show scrollbar
            self.h_scrollbar.grid(row=1, column=0, sticky='ew')
        self.h_scrollbar.set(first, last)
        
    def show_loading(self, operation="Loading"):
        """Show loading indicator"""
        self.is_loading = True
        self.loading_operation = operation
        
        # Update status
        self.progress_var.set(f"⏳ {operation}...")
        self.progress_label.pack(side=tk.LEFT, padx=(0, 10))
        self.progress_bar.pack(side=tk.LEFT, fill=tk.X, expand=True)
        self.progress_bar.start(10)
        
        # Disable action buttons
        self.refresh_btn.configure(state=tk.DISABLED)
        self.upload_btn.configure(state=tk.DISABLED)
        self.new_folder_btn.configure(state=tk.DISABLED)
        self.download_btn.configure(state=tk.DISABLED)
        self.delete_btn.configure(state=tk.DISABLED)
        
        # Update cursor
        self.root.configure(cursor="wait")
        self.root.update()
        
    def hide_loading(self):
        """Hide loading indicator"""
        self.is_loading = False
        self.loading_operation = ""
        
        # Hide progress widgets
        self.progress_label.pack_forget()
        self.progress_bar.pack_forget()
        self.progress_bar.stop()
        
        # Re-enable action buttons
        self.refresh_btn.configure(state=tk.NORMAL)
        self.upload_btn.configure(state=tk.NORMAL)
        self.new_folder_btn.configure(state=tk.NORMAL)
        
        # Update download/delete buttons based on selection
        self.update_action_buttons()
        
        # Reset cursor
        self.root.configure(cursor="")
        self.root.update()
        
    def update_status(self, message, is_error=False):
        """Update status bar message"""
        if hasattr(self, 'status_bar'):
            color = self.colors['error'] if is_error else 'black'
            self.status_bar.configure(text=message, foreground=color)
            self.root.update()
        
    def show_login_screen(self):
        """Show the login screen"""
        self.app_frame.pack_forget()
        self.login_frame.pack(fill=tk.BOTH, expand=True)
        self.username_entry.focus()
        
    def show_main_screen(self):
        """Show the main application screen"""
        self.login_frame.pack_forget()
        self.app_frame.pack(fill=tk.BOTH, expand=True)
        
    def test_connection(self):
        """Test connection to server"""
        server = self.server_entry.get().strip()
        port = self.port_entry.get().strip()
        
        if not server or not port:
            self.login_status.configure(text="❌ Please enter server address and port", foreground=self.colors['error'])
            return
            
        self.server_url = f"http://{server}:{port}"
        
        def test_thread():
            try:
                self.login_status.configure(text="🔄 Testing connection...", foreground=self.colors['primary'])
                self.root.update()
                
                response = requests.get(f"{self.server_url}/api/status", timeout=5)
                if response.status_code == 200:
                    self.login_status.configure(text="✅ Server is reachable!", foreground=self.colors['success'])
                else:
                    self.login_status.configure(text=f"❌ Server error: {response.status_code}", foreground=self.colors['error'])
            except requests.exceptions.ConnectionError:
                self.login_status.configure(text="❌ Cannot connect to server", foreground=self.colors['error'])
            except requests.exceptions.Timeout:
                self.login_status.configure(text="❌ Connection timeout", foreground=self.colors['error'])
            except Exception as e:
                self.login_status.configure(text=f"❌ Error: {str(e)}", foreground=self.colors['error'])
                
        threading.Thread(target=test_thread, daemon=True).start()
        
    def login(self):
        """Attempt to login to the server"""
        server = self.server_entry.get().strip()
        port = self.port_entry.get().strip()
        username = self.username_entry.get().strip()
        password = self.password_entry.get()
        
        if not all([server, port, username, password]):
            self.login_status.configure(text="❌ Please fill in all fields", foreground=self.colors['error'])
            return
            
        self.server_url = f"http://{server}:{port}"
        
        def login_thread():
            try:
                self.login_status.configure(text="🔄 Connecting...", foreground=self.colors['primary'])
                self.login_btn.configure(state=tk.DISABLED)
                self.root.update()
                
                # Attempt login
                response = requests.post(
                    f"{self.server_url}/api/login",
                    json={"username": username, "password": password},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') or data.get('token'):
                        self.token = data.get('token', 'dummy_token')
                        self.current_user = data.get('user', {'username': username})
                        
                        self.login_status.configure(text="✅ Login successful!", foreground=self.colors['success'])
                        self.root.after(500, self.on_login_success)
                    else:
                        self.login_status.configure(text="❌ Invalid credentials", foreground=self.colors['error'])
                        self.login_btn.configure(state=tk.NORMAL)
                else:
                    self.login_status.configure(text=f"❌ Login failed: {response.status_code}", foreground=self.colors['error'])
                    self.login_btn.configure(state=tk.NORMAL)
                    
            except requests.exceptions.ConnectionError:
                self.login_status.configure(text="❌ Cannot connect to server", foreground=self.colors['error'])
                self.login_btn.configure(state=tk.NORMAL)
            except requests.exceptions.Timeout:
                self.login_status.configure(text="❌ Connection timeout", foreground=self.colors['error'])
                self.login_btn.configure(state=tk.NORMAL)
            except Exception as e:
                self.login_status.configure(text=f"❌ Error: {str(e)}", foreground=self.colors['error'])
                self.login_btn.configure(state=tk.NORMAL)
                
        threading.Thread(target=login_thread, daemon=True).start()
        
    def on_login_success(self):
        """Handle successful login"""
        self.show_main_screen()
        self.user_label.configure(text=f"Connected as: {self.current_user.get('username', 'Unknown')} | Server: {self.server_url}")
        self.load_files()
        
    def logout(self):
        """Logout and return to login screen"""
        self.token = ""
        self.current_user = None
        self.current_path = "/"
        self.files = []
        self.selected_files = []
        
        # Clear file list
        for item in self.file_tree.get_children():
            self.file_tree.delete(item)
            
        self.show_login_screen()
        self.login_btn.configure(state=tk.NORMAL)
        self.login_status.configure(text="")
        
    def make_request(self, method, endpoint, **kwargs):
        """Make authenticated request to server"""
        headers = kwargs.get('headers', {})
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        kwargs['headers'] = headers
        
        url = urljoin(self.server_url, endpoint)
        response = requests.request(method, url, timeout=30, **kwargs)
        
        if response.status_code == 401:
            messagebox.showerror("Session Expired", "Your session has expired. Please login again.")
            self.logout()
            return None
            
        return response
        
    def load_files(self, path=None):
        """Load files from current directory with loading indicator"""
        if path is not None:
            self.current_path = path
            
        def load_thread():
            try:
                self.show_loading("Loading files")
                
                response = self.make_request('GET', f'/api/files?path={quote(self.current_path)}')
                if not response:
                    return
                    
                if response.status_code == 200:
                    data = response.json()
                    self.files = data.get('files', [])
                    self.root.after(0, self.update_file_list)
                    self.update_status(f"Loaded {len(self.files)} items")
                else:
                    self.update_status(f"Failed to load files: {response.status_code}", True)
                    
            except Exception as e:
                self.update_status(f"Error loading files: {str(e)}", True)
            finally:
                self.root.after(0, self.hide_loading)
                
        threading.Thread(target=load_thread, daemon=True).start()
        
    def update_file_list(self):
        """Update the file list display"""
        # Clear existing items
        for item in self.file_tree.get_children():
            self.file_tree.delete(item)
            
        # Update path label
        self.path_label.configure(text=f"Path: {self.current_path}")
        
        # Add files to tree
        for file_info in self.files:
            name = file_info.get('name', '')
            file_type = file_info.get('type', 'file')
            size = file_info.get('size', 0)
            modified = file_info.get('modified', '')
            
            # Format size
            if file_type == 'folder':
                size_str = '—'
            else:
                size_str = self.format_file_size(size)
                
            # Format date
            try:
                if modified:
                    dt = datetime.fromisoformat(modified.replace('Z', '+00:00'))
                    date_str = dt.strftime('%Y-%m-%d %H:%M')
                else:
                    date_str = '—'
            except:
                date_str = '—'
                
            # Icon based on type
            icon = '📁' if file_type == 'folder' else '📄'
            
            item_id = self.file_tree.insert('', 'end', text=icon, 
                                          values=(name, file_type.title(), size_str, date_str))
            
        self.selected_files = []
        self.update_action_buttons()
        
    def format_file_size(self, size_bytes):
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        size_names = ["B", "KB", "MB", "GB", "TB"]
        import math
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return f"{s} {size_names[i]}"
        
    def on_double_click(self, event):
        """Handle double-click on file/folder"""
        if self.is_loading:
            return
            
        selection = self.file_tree.selection()
        if not selection:
            return
            
        item = selection[0]
        values = self.file_tree.item(item, 'values')
        if not values:
            return
            
        name = values[0]
        file_type = values[1].lower()
        
        if file_type == 'folder':
            # Navigate to folder
            new_path = os.path.join(self.current_path, name).replace('\\', '/')
            if new_path.startswith('//'):
                new_path = new_path[1:]
            self.load_files(new_path)
        else:
            # Download file
            self.download_file(name)
            
    def on_selection_change(self, event):
        """Handle selection change in file list"""
        self.selected_files = []
        for item in self.file_tree.selection():
            values = self.file_tree.item(item, 'values')
            if values:
                self.selected_files.append(values[0])  # file name
                
        self.update_action_buttons()
        
    def update_action_buttons(self):
        """Update state of action buttons based on selection"""
        if self.is_loading:
            return
            
        has_selection = len(self.selected_files) > 0
        self.download_btn.configure(state=tk.NORMAL if has_selection else tk.DISABLED)
        self.delete_btn.configure(state=tk.NORMAL if has_selection else tk.DISABLED)
        
    def go_back(self):
        """Go back to previous directory"""
        if self.current_path != "/":
            parent_path = os.path.dirname(self.current_path.rstrip('/')).replace('\\', '/')
            if not parent_path:
                parent_path = "/"
            self.load_files(parent_path)
            
    def go_up(self):
        """Go up one directory level"""
        self.go_back()
        
    def refresh_files(self):
        """Refresh current directory"""
        self.load_files()
        
    def upload_files(self):
        """Upload files to current directory"""
        if self.is_loading:
            return
            
        file_paths = filedialog.askopenfilenames(
            title="Select files to upload",
            filetypes=[("All files", "*.*")]
        )
        
        if not file_paths:
            return
            
        def upload_thread():
            try:
                self.show_loading(f"Uploading {len(file_paths)} file(s)")
                
                for file_path in file_paths:
                    filename = os.path.basename(file_path)
                    
                    with open(file_path, 'rb') as f:
                        files = {'file': (filename, f, mimetypes.guess_type(file_path)[0] or 'application/octet-stream')}
                        data = {'path': self.current_path}
                        
                        response = self.make_request('POST', '/api/upload', files=files, data=data)
                        if not response or response.status_code != 200:
                            self.update_status(f"Failed to upload {filename}", True)
                            return
                            
                self.update_status(f"Successfully uploaded {len(file_paths)} file(s)")
                self.root.after(0, lambda: self.load_files())
                
            except Exception as e:
                self.update_status(f"Upload error: {str(e)}", True)
            finally:
                self.root.after(0, self.hide_loading)
                
        threading.Thread(target=upload_thread, daemon=True).start()
        
    def download_selected(self):
        """Download selected files"""
        if not self.selected_files or self.is_loading:
            return
            
        # Ask for download directory
        download_dir = filedialog.askdirectory(title="Select download location")
        if not download_dir:
            return
            
        def download_thread():
            try:
                self.show_loading(f"Downloading {len(self.selected_files)} file(s)")
                
                for filename in self.selected_files:
                    file_path = os.path.join(self.current_path, filename).replace('\\', '/')
                    if file_path.startswith('//'):
                        file_path = file_path[1:]
                        
                    response = self.make_request('GET', f'/api/download{file_path}')
                    if not response or response.status_code != 200:
                        self.update_status(f"Failed to download {filename}", True)
                        continue
                        
                    # Save file
                    local_path = os.path.join(download_dir, filename)
                    with open(local_path, 'wb') as f:
                        f.write(response.content)
                        
                self.update_status(f"Downloaded {len(self.selected_files)} file(s) to {download_dir}")
                
            except Exception as e:
                self.update_status(f"Download error: {str(e)}", True)
            finally:
                self.root.after(0, self.hide_loading)
                
        threading.Thread(target=download_thread, daemon=True).start()
        
    def download_file(self, filename):
        """Download a single file"""
        self.selected_files = [filename]
        self.download_selected()
        
    def delete_selected(self):
        """Delete selected files/folders"""
        if not self.selected_files or self.is_loading:
            return
            
        # Confirm deletion
        file_list = '\n'.join(f"• {name}" for name in self.selected_files[:5])
        if len(self.selected_files) > 5:
            file_list += f"\n... and {len(self.selected_files) - 5} more"
            
        result = messagebox.askyesno(
            "Confirm Delete",
            f"Are you sure you want to delete these {len(self.selected_files)} item(s)?\n\n{file_list}\n\nThis action cannot be undone.",
            icon='warning'
        )
        
        if not result:
            return
            
        def delete_thread():
            try:
                self.show_loading(f"Deleting {len(self.selected_files)} item(s)")
                
                for filename in self.selected_files:
                    file_path = os.path.join(self.current_path, filename).replace('\\', '/')
                    if file_path.startswith('//'):
                        file_path = file_path[1:]
                        
                    response = self.make_request('POST', '/api/delete', json={'path': file_path})
                    if not response or response.status_code != 200:
                        self.update_status(f"Failed to delete {filename}", True)
                        return
                        
                self.update_status(f"Deleted {len(self.selected_files)} item(s)")
                self.root.after(0, lambda: self.load_files())
                
            except Exception as e:
                self.update_status(f"Delete error: {str(e)}", True)
            finally:
                self.root.after(0, self.hide_loading)
                
        threading.Thread(target=delete_thread, daemon=True).start()
        
    def create_folder(self):
        """Create a new folder"""
        if self.is_loading:
            return
            
        folder_name = simpledialog.askstring("New Folder", "Enter folder name:")
        if not folder_name:
            return
            
        def create_thread():
            try:
                self.show_loading("Creating folder")
                
                response = self.make_request('POST', '/api/create-folder', 
                                           json={'path': self.current_path, 'name': folder_name})
                if response and response.status_code == 200:
                    self.update_status(f"Created folder: {folder_name}")
                    self.root.after(0, lambda: self.load_files())
                else:
                    self.update_status(f"Failed to create folder: {folder_name}", True)
                    
            except Exception as e:
                self.update_status(f"Error creating folder: {str(e)}", True)
            finally:
                self.root.after(0, self.hide_loading)
                
        threading.Thread(target=create_thread, daemon=True).start()
        
    def show_context_menu(self, event):
        """Show context menu for file operations"""
        if self.is_loading:
            return
            
        # Select item under cursor
        item = self.file_tree.identify_row(event.y)
        if item:
            self.file_tree.selection_set(item)
            self.on_selection_change(None)
            
        # Create context menu
        context_menu = tk.Menu(self.root, tearoff=0)
        
        if self.selected_files:
            context_menu.add_command(label="Download", command=self.download_selected)
            context_menu.add_command(label="Delete", command=self.delete_selected)
            context_menu.add_separator()
            
        context_menu.add_command(label="Upload Files", command=self.upload_files)
        context_menu.add_command(label="New Folder", command=self.create_folder)
        context_menu.add_separator()
        context_menu.add_command(label="Refresh", command=self.refresh_files)
        
        try:
            context_menu.tk_popup(event.x_root, event.y_root)
        finally:
            context_menu.grab_release()
            
    def show_settings(self):
        """Show settings dialog"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("Callao Settings")
        settings_window.geometry("500x400")
        settings_window.transient(self.root)
        settings_window.grab_set()
        
        # Center the window
        settings_window.geometry("+%d+%d" % (
            self.root.winfo_rootx() + 50,
            self.root.winfo_rooty() + 50
        ))
        
        # Add padding to settings window
        main_settings_frame = ttk.Frame(settings_window)
        main_settings_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)
        
        # Create notebook for tabs
        notebook = ttk.Notebook(main_settings_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        
        # Server tab
        server_frame = ttk.Frame(notebook)
        notebook.add(server_frame, text="Server")
        
        # Server info
        info_frame = ttk.LabelFrame(server_frame, text="Server Information", padding=10)
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(info_frame, text=f"Server URL: {self.server_url}").pack(anchor=tk.W)
        ttk.Label(info_frame, text=f"Connected as: {self.current_user.get('username', 'Unknown') if self.current_user else 'Not connected'}").pack(anchor=tk.W)
        ttk.Label(info_frame, text=f"Current path: {self.current_path}").pack(anchor=tk.W)
        
        # Server actions
        actions_frame = ttk.LabelFrame(server_frame, text="Server Actions", padding=10)
        actions_frame.pack(fill=tk.X, pady=(0, 10))
        
        def restart_server():
            """Restart the server"""
            result = messagebox.askyesno(
                "Restart Server",
                "Are you sure you want to restart the server?\n\nThis will:\n• Disconnect all users\n• Interrupt ongoing transfers\n• Apply configuration changes\n\nThe server should restart automatically.",
                icon='warning'
            )
            
            if result:
                def restart_thread():
                    try:
                        response = self.make_request('POST', '/api/server/restart')
                        if response and response.status_code == 200:
                            messagebox.showinfo("Server Restart", "Server restart initiated successfully!\n\nThe server will restart in a few seconds.")
                            # Close settings window
                            settings_window.destroy()
                            # Logout to force reconnection
                            self.root.after(3000, self.logout)  # Logout after 3 seconds
                        else:
                            messagebox.showerror("Error", "Failed to restart server. Please restart manually.")
                    except Exception as e:
                        messagebox.showerror("Error", f"Failed to restart server: {str(e)}")
                        
                threading.Thread(target=restart_thread, daemon=True).start()
        
        def open_web_interface():
            """Open web interface in browser"""
            webbrowser.open(self.server_url)
            
        ttk.Button(actions_frame, text="🌐 Open Web Interface", 
                  command=open_web_interface).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(actions_frame, text="🔄 Restart Server", 
                  command=restart_server, style='Warning.TButton').pack(side=tk.LEFT)
        
        # About tab
        about_frame = ttk.Frame(notebook)
        notebook.add(about_frame, text="About")
        
        about_content = ttk.Frame(about_frame)
        about_content.pack(expand=True, fill=tk.BOTH, padx=20, pady=20)
        
        ttk.Label(about_content, text="Callao Personal Cloud Client", 
                 font=('Segoe UI', 16, 'bold')).pack(pady=(0, 10))
        ttk.Label(about_content, text="Version 1.0.0").pack()
        ttk.Label(about_content, text="A desktop client for accessing your personal cloud files").pack(pady=(10, 20))
        
        ttk.Label(about_content, text="Features:", font=('Segoe UI', 10, 'bold')).pack(anchor=tk.W)
        features = [
            "• Browse and manage files remotely",
            "• Upload and download files",
            "• Create and delete folders", 
            "• Real-time server status",
            "• Secure authentication"
        ]
        for feature in features:
            ttk.Label(about_content, text=feature).pack(anchor=tk.W, padx=(10, 0))
            
        # Close button
        ttk.Button(main_settings_frame, text="Close", 
                  command=settings_window.destroy).pack(pady=(10, 0))
        
    def run(self):
        """Start the application"""
        self.root.mainloop()

if __name__ == "__main__":
    app = CallaoClient()
    app.run()