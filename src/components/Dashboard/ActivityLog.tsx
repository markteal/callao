import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useActivity } from '../../contexts/ActivityContext';

const ActivityLog: React.FC = () => {
  const { activities, getRecentActivities } = useActivity();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'login' | 'upload' | 'download' | 'delete' | 'create_folder'>('all');
  const [displayedActivities, setDisplayedActivities] = useState(activities.slice(0, 25));

  // Update displayed activities when activities change
  useEffect(() => {
    const recentActivities = getRecentActivities(25);
    setDisplayedActivities(recentActivities);
  }, [activities, getRecentActivities]);

  const filteredLogs = displayedActivities.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesStatus && matchesAction;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-error-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success-700 bg-success-50 border-success-200';
      case 'error':
        return 'text-error-700 bg-error-50 border-error-200';
      case 'warning':
        return 'text-warning-700 bg-warning-50 border-warning-200';
      default:
        return 'text-neutral-700 bg-neutral-50 border-neutral-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'login_failed':
      case 'login_error':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'upload':
        return '📤';
      case 'download':
        return '📥';
      case 'delete':
        return '🗑️';
      case 'create_folder':
        return '📁';
      case 'rename':
        return '✏️';
      case 'list_directory':
        return '👁️';
      default:
        return '📋';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      return format(timestamp, 'MMM dd, HH:mm:ss');
    } catch {
      return 'Invalid date';
    }
  };

  const handleRefresh = () => {
    // Force re-render by updating displayed activities
    const recentActivities = getRecentActivities(25);
    setDisplayedActivities([...recentActivities]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Activity className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Activity Log</h2>
              <p className="text-sm text-neutral-600">Real-time user activity tracking</p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
            </select>
            
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="upload">Upload</option>
              <option value="download">Download</option>
              <option value="delete">Delete</option>
              <option value="create_folder">Create Folder</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center">
            <Activity className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">
              {activities.length === 0 
                ? 'No activity recorded yet'
                : searchQuery || statusFilter !== 'all' || actionFilter !== 'all'
                ? 'No activity matches your filters'
                : 'No recent activity'
              }
            </p>
            {activities.length === 0 && (
              <p className="text-neutral-500 text-sm mt-1">
                Activity will appear here as you use the system
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {log.user}
                        </span>
                        <span className="text-sm text-neutral-600">
                          {formatAction(log.action)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                        {getStatusIcon(log.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-600 truncate mb-1" title={log.target}>
                      <strong>Target:</strong> {log.target}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    
                    {log.details && (
                      <p className="text-xs text-neutral-500 mt-1 truncate" title={log.details}>
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredLogs.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              Showing {filteredLogs.length} of {activities.length} activities
            </span>
            <span>
              Real-time activity tracking • {activities.length} total recorded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;