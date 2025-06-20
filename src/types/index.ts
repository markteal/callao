export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  lastLogin?: Date | null;
  isActive: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  lastModified: Date;
  path: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  mimeType?: string;
}

export interface ServerConfig {
  port: number;
  driveLetter: string;
  maxConnections: number;
  enableSSL: boolean;
  allowedIPs: string[];
}

export interface ConnectionStatus {
  isConnected: boolean;
  serverIP: string;
  serverPort: number;
  connectedClients: number;
  uptime: number;
  lastActivity: Date;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  target: string;
  status: 'success' | 'error' | 'warning';
  details?: string;
}

export interface TransferProgress {
  id: string;
  fileName: string;
  progress: number;
  speed: number;
  status: 'uploading' | 'downloading' | 'completed' | 'error';
  startTime: Date;
}