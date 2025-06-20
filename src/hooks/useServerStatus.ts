import { useState, useEffect, useCallback } from 'react';
import { ConnectionStatus, ActivityLog, ServerConfig } from '../types';
import api from '../services/api';

export const useServerStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    serverIP: 'localhost',
    serverPort: 11777,
    connectedClients: 0,
    uptime: 0,
    lastActivity: new Date()
  });

  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    port: 11777,
    driveLetter: 'G',
    maxConnections: 10,
    enableSSL: true,
    allowedIPs: ['*']
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [serverStats, setServerStats] = useState({
    totalStorage: 0,
    usedStorage: 0,
    freeStorage: 0,
    totalFiles: 0,
    totalFolders: 0
  });

  const [isLoadingStorageStats, setIsLoadingStorageStats] = useState(false);

  // Simplified storage stats fetching
  const fetchStorageStats = useCallback(async () => {
    setIsLoadingStorageStats(true);
    try {
      const response = await api.getStorageStats();
      
      setServerStats({
        totalStorage: response.total_storage || 0,
        usedStorage: response.used_storage || 0,
        freeStorage: response.free_storage || 0,
        totalFiles: response.total_files || 0,
        totalFolders: response.total_folders || 0
      });
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
      
      // Don't update stats if session expired - let auth handle it
      if (!(error instanceof Error && error.message.includes('Session expired'))) {
        // Only reset stats on other errors if we don't have any data
        if (serverStats.totalStorage === 0) {
          setServerStats({
            totalStorage: 0,
            usedStorage: 0,
            freeStorage: 0,
            totalFiles: 0,
            totalFolders: 0
          });
        }
      }
    } finally {
      setIsLoadingStorageStats(false);
    }
  }, [serverStats.totalStorage]);

  // Simplified server status fetching with proper uptime tracking
  const fetchServerStatus = useCallback(async () => {
    try {
      const status = await api.getServerStatus();
      
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        serverPort: status.port || 11777,
        connectedClients: status.connections || 0,
        // Use server-provided uptime if available, otherwise keep incrementing
        uptime: status.uptime || prev.uptime + 15 // Add 15 seconds per fetch interval
      }));

      // Update basic storage info from status if available
      if (status.drive) {
        setServerStats(prev => ({
          ...prev,
          totalStorage: status.drive.total || prev.totalStorage,
          usedStorage: status.drive.used || prev.usedStorage,
          freeStorage: status.drive.free || prev.freeStorage
        }));

        // Update server config with actual drive letter
        setServerConfig(prev => ({
          ...prev,
          driveLetter: status.drive.drive_letter || 'G'
        }));
      }

      // Fetch detailed storage stats only if authenticated and we don't have file counts
      if (api.isAuthenticated() && serverStats.totalFiles === 0 && !isLoadingStorageStats) {
        fetchStorageStats();
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
      
      // Only update connection status for non-auth errors
      if (!(error instanceof Error && error.message.includes('Session expired'))) {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          uptime: 0 // Reset uptime when disconnected
        }));
      }
    }
  }, [fetchStorageStats, serverStats.totalFiles, isLoadingStorageStats]);

  // Fetch server status on mount and periodically
  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, [fetchServerStatus]);

  const updateServerConfig = async (newConfig: Partial<ServerConfig>) => {
    // For now, just update local state
    // In a real implementation, this would send the config to the server
    setServerConfig(prev => ({ ...prev, ...newConfig }));
    
    // Show a message that server restart is required
    console.log('Server configuration updated. Restart required for changes to take effect.');
  };

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const toggleServerConnection = () => {
    // This would typically send a command to start/stop the server
    // For now, just toggle the status
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: !prev.isConnected,
      uptime: prev.isConnected ? 0 : prev.uptime
    }));
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    connectionStatus,
    serverConfig,
    activityLogs,
    serverStats,
    isLoadingStorageStats,
    updateServerConfig,
    addActivityLog,
    toggleServerConnection,
    formatUptime,
    formatBytes,
    refreshStatus: fetchServerStatus,
    refreshStorageStats: fetchStorageStats
  };
};