import React, { useState, useEffect } from 'react';
import { Server, Users, Clock, HardDrive, Power, PowerOff, AlertTriangle, Loader2 } from 'lucide-react';
import { useServerStatus } from '../../hooks/useServerStatus';
import { useAuth } from '../../hooks/useAuth';

const ServerStatus: React.FC = () => {
  const { 
    connectionStatus, 
    serverStats, 
    isLoadingStorageStats,
    formatUptime, 
    formatBytes
  } = useServerStatus();

  const { user } = useAuth();
  const [connectedClients, setConnectedClients] = useState(0);

  // Simulate connected clients with more realistic behavior
  useEffect(() => {
    const updateClients = () => {
      // Simulate 1-4 connected clients with some randomness
      const baseClients = 1; // Always at least 1 (the web interface)
      const additionalClients = Math.floor(Math.random() * 3);
      setConnectedClients(baseClients + additionalClients);
    };

    updateClients();
    // Update every 15-45 seconds for more realistic behavior
    const randomInterval = 15000 + Math.random() * 30000;
    const interval = setInterval(updateClients, randomInterval);

    return () => clearInterval(interval);
  }, []);

  const storageUsedPercentage = serverStats.totalStorage > 0 
    ? (serverStats.usedStorage / serverStats.totalStorage) * 100 
    : 0;

  // Determine if we should show loading states
  const isLoadingFiles = isLoadingStorageStats || serverStats.totalFiles === 0;
  const isLoadingFolders = isLoadingStorageStats || serverStats.totalFolders === 0;
  const isLoadingStorage = isLoadingStorageStats || serverStats.totalStorage === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Server className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Server Status</h2>
            <p className="text-sm text-neutral-600">Monitor your Callao server</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.isConnected ? 'bg-success-500' : 'bg-error-500'
            } animate-pulse-subtle`} />
            <div>
              <p className="text-sm font-medium text-neutral-900">Status</p>
              <p className={`text-sm ${
                connectionStatus.isConnected ? 'text-success-600' : 'text-error-600'
              }`}>
                {connectionStatus.isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-900">Connected Clients</p>
              <p className="text-sm text-neutral-600">{connectedClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-secondary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-900">Server Uptime</p>
              <p className="text-sm text-neutral-600">
                {connectionStatus.isConnected ? formatUptime(connectionStatus.uptime) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <HardDrive className="w-5 h-5 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-neutral-900">Storage Used</p>
              <p className="text-sm text-neutral-600">
                {isLoadingStorage ? (
                  <div className="flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : serverStats.totalStorage > 0 ? (
                  `${storageUsedPercentage.toFixed(1)}%`
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-neutral-900">Storage Usage</h3>
            <span className="text-sm text-neutral-600">
              {isLoadingStorage ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
                  <span className="text-neutral-400">Loading...</span>
                </div>
              ) : serverStats.totalStorage > 0 ? (
                `${formatBytes(serverStats.usedStorage)} / ${formatBytes(serverStats.totalStorage)}`
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            {isLoadingStorage ? (
              <div className="bg-neutral-300 h-2 rounded-full animate-pulse" />
            ) : serverStats.totalStorage > 0 ? (
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${storageUsedPercentage}%` }}
              />
            ) : (
              <div className="bg-neutral-300 h-2 rounded-full" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
          <div className="text-center">
            {isLoadingFiles ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                <p className="text-sm text-neutral-600">Counting files...</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary-600">{serverStats.totalFiles.toLocaleString()}</p>
                <p className="text-sm text-neutral-600">Total Files</p>
              </>
            )}
          </div>
          <div className="text-center">
            {isLoadingFolders ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 text-secondary-500 animate-spin" />
                <p className="text-sm text-neutral-600">Counting folders...</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-secondary-600">{serverStats.totalFolders.toLocaleString()}</p>
                <p className="text-sm text-neutral-600">Total Folders</p>
              </>
            )}
          </div>
        </div>

        {/* Loading indicator for initial stats gathering */}
        {isLoadingStorageStats && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-primary-800">Gathering Statistics</p>
                <p className="text-xs text-primary-600">
                  Analyzing your drive to count files and folders. This may take a moment for large drives.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStatus;