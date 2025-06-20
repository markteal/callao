import React, { useState, useEffect } from 'react';
import { Settings, Server, Shield, Network, Save, AlertTriangle, Power } from 'lucide-react';
import { useServerStatus } from '../../hooks/useServerStatus';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const ServerSettings: React.FC = () => {
  const { serverConfig, updateServerConfig } = useServerStatus();
  const { user } = useAuth();
  const [localConfig, setLocalConfig] = useState(serverConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Update local config when server config changes
  useEffect(() => {
    setLocalConfig(serverConfig);
    setHasChanges(false);
  }, [serverConfig]);

  const handleConfigChange = (key: keyof typeof serverConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateServerConfig(localConfig);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalConfig(serverConfig);
    setHasChanges(false);
  };

  const handleServerRestart = async () => {
    if (!user || user.role !== 'admin') {
      alert('Admin access required to restart server');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Are you sure you want to restart the server?\n\n' +
      'This will:\n' +
      '• Apply any configuration changes\n' +
      '• Disconnect all active users\n' +
      '• Interrupt any ongoing file transfers\n' +
      '• Restart the server process\n\n' +
      'The server should come back online automatically in a few seconds.'
    );

    if (!confirmed) return;

    try {
      setIsRestarting(true);
      
      const response = await api.restartServer();
      
      if (response.success) {
        const delay = response.restart_delay || 3;
        
        // Show success message
        alert(`✅ Server restart initiated!\n\nThe server will restart in ${delay} seconds.\nThis page will automatically reconnect when the server is back online.`);
        
        // Attempt to reconnect after restart delay + buffer time
        setTimeout(() => {
          window.location.reload();
        }, (delay + 5) * 1000);
      } else {
        throw new Error(response.error || 'Failed to restart server');
      }
    } catch (error) {
      console.error('Restart error:', error);
      setIsRestarting(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to restart server:\n\n${errorMessage}\n\nPlease try again or restart manually.`);
    }
  };

  const availableDrives = ['C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-neutral-100 rounded-lg">
          <Settings className="w-6 h-6 text-neutral-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Server Settings</h2>
          <p className="text-sm text-neutral-600">Configure your Callao server</p>
        </div>
      </div>

      {/* Remote Restart Section */}
      {user?.role === 'admin' && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Power className="w-5 h-5 text-warning-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-800">Remote Server Management</h4>
                <p className="text-sm text-warning-700 mt-1">
                  Restart the server remotely to apply configuration changes or resolve issues. 
                  This will disconnect all users temporarily.
                </p>
              </div>
            </div>
            <button
              onClick={handleServerRestart}
              disabled={isRestarting}
              className="flex items-center space-x-2 px-4 py-2 bg-warning-500 hover:bg-warning-600 disabled:bg-warning-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Power className="w-4 h-4" />
              <span>{isRestarting ? 'Restarting...' : 'Restart Server'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Configuration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Configuration Notice</h4>
            <p className="text-sm text-blue-700 mt-1">
              Changes to server settings require restarting the Python server to take effect. 
              Use the restart button above or restart manually from the command line.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Network Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Network className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Network Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Server Port
              </label>
              <input
                type="number"
                min="1024"
                max="65535"
                value={localConfig.port}
                onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">Default: 11777</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Max Connections
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={localConfig.maxConnections}
                onChange={(e) => handleConfigChange('maxConnections', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">Maximum concurrent connections</p>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-secondary-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Storage Settings</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Shared Drive
            </label>
            <select
              value={localConfig.driveLetter}
              onChange={(e) => handleConfigChange('driveLetter', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {availableDrives.map(drive => (
                <option key={drive} value={drive}>{drive}: Drive</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Currently sharing: <strong>{serverConfig.driveLetter}: Drive</strong>
              {localConfig.driveLetter !== serverConfig.driveLetter && (
                <span className="text-warning-600"> (Restart required to apply)</span>
              )}
            </p>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-warning-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Security Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableSSL"
                checked={localConfig.enableSSL}
                onChange={(e) => handleConfigChange('enableSSL', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="enableSSL" className="text-sm font-medium text-neutral-700">
                Enable SSL/TLS Encryption
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Allowed IP Addresses
              </label>
              <textarea
                value={localConfig.allowedIPs.join('\n')}
                onChange={(e) => handleConfigChange('allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                placeholder="Enter IP addresses (one per line)&#10;Use * to allow all IPs"
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">Leave empty or use * to allow all connections</p>
            </div>
          </div>
        </div>

        {/* Remote Management Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Power className="w-5 h-5 text-success-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Remote Management</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableRemoteRestart"
                checked={localConfig.enableRemoteRestart !== false}
                onChange={(e) => handleConfigChange('enableRemoteRestart', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="enableRemoteRestart" className="text-sm font-medium text-neutral-700">
                Enable Remote Server Restart (Admin Only)
              </label>
            </div>
            <p className="text-xs text-neutral-500 ml-7">
              Allows admin users to restart the server remotely via the web interface. 
              Disable this for additional security if not needed.
            </p>
          </div>
        </div>

        {/* Current Configuration Display */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h4 className="font-semibold text-neutral-900 mb-3">Current Server Configuration</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Port:</span>
              <span className="ml-2 font-medium">{serverConfig.port}</span>
            </div>
            <div>
              <span className="text-neutral-600">Drive:</span>
              <span className="ml-2 font-medium">{serverConfig.driveLetter}:\</span>
            </div>
            <div>
              <span className="text-neutral-600">SSL:</span>
              <span className="ml-2 font-medium">{serverConfig.enableSSL ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="text-neutral-600">Max Connections:</span>
              <span className="ml-2 font-medium">{serverConfig.maxConnections}</span>
            </div>
            <div>
              <span className="text-neutral-600">Remote Restart:</span>
              <span className="ml-2 font-medium">{serverConfig.enableRemoteRestart !== false ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Save/Reset Buttons */}
        {hasChanges && (
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}

        {!hasChanges && (
          <div className="text-center py-4 text-neutral-600">
            <p>Configuration changes require a server restart to take effect.</p>
            <p className="text-sm mt-1">Use the restart button above or restart manually from the command line.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerSettings;