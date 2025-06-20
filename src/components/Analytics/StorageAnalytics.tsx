import React, { useEffect, useState } from 'react';
import { HardDrive, TrendingUp, Folder, File, RefreshCw, BarChart3, PieChart, Loader2 } from 'lucide-react';
import { useServerStatus } from '../../hooks/useServerStatus';

interface FileTypeStats {
  documents: number;
  images: number;
  videos: number;
  audio: number;
  archives: number;
  others: number;
}

const StorageAnalytics: React.FC = () => {
  const { serverStats, formatBytes, refreshStorageStats, isLoadingStorageStats } = useServerStatus();
  const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats>({
    documents: 0,
    images: 0,
    videos: 0,
    audio: 0,
    archives: 0,
    others: 0
  });
  const [storageHistory, setStorageHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingFileTypes, setIsLoadingFileTypes] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  const storageUsedPercentage = serverStats.totalStorage > 0 
    ? (serverStats.usedStorage / serverStats.totalStorage) * 100 
    : 0;
  
  const avgFileSize = serverStats.totalFiles > 0 
    ? serverStats.usedStorage / serverStats.totalFiles 
    : 0;

  // Fetch detailed file type statistics
  const fetchFileTypeStats = async () => {
    setIsLoadingFileTypes(true);
    try {
      // Simulate API delay for realistic loading experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be a real API call in production
      // For now, we'll simulate the data based on total files
      const totalFiles = serverStats.totalFiles;
      if (totalFiles > 0) {
        setFileTypeStats({
          documents: Math.floor(totalFiles * 0.35),
          images: Math.floor(totalFiles * 0.28),
          videos: Math.floor(totalFiles * 0.22),
          audio: Math.floor(totalFiles * 0.08),
          archives: Math.floor(totalFiles * 0.04),
          others: Math.floor(totalFiles * 0.03)
        });
      }
    } catch (error) {
      console.error('Failed to fetch file type stats:', error);
    } finally {
      setIsLoadingFileTypes(false);
    }
  };

  // Generate storage history (simulated for demo)
  const generateStorageHistory = async () => {
    setIsLoadingTrend(true);
    try {
      // Simulate API delay for realistic loading experience
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const history = [];
      const currentUsage = storageUsedPercentage;
      
      for (let i = 6; i >= 0; i--) {
        // Simulate slight variations in storage usage over the past 7 days
        const variation = (Math.random() - 0.5) * 10; // ±5% variation
        const usage = Math.max(0, Math.min(100, currentUsage + variation - (i * 2)));
        history.push(usage);
      }
      
      setStorageHistory(history);
    } catch (error) {
      console.error('Failed to generate storage history:', error);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  useEffect(() => {
    if (serverStats.totalFiles > 0) {
      fetchFileTypeStats();
      generateStorageHistory();
    } else if (serverStats.totalFiles === 0 && !isLoadingStorageStats) {
      // Reset loading states if no files
      setIsLoadingFileTypes(false);
      setIsLoadingTrend(false);
    }
  }, [serverStats.totalFiles, serverStats.usedStorage]);

  // Start loading indicators when storage stats are being loaded
  useEffect(() => {
    if (isLoadingStorageStats) {
      setIsLoadingFileTypes(true);
      setIsLoadingTrend(true);
    }
  }, [isLoadingStorageStats]);

  const handleRefresh = async () => {
    setLoading(true);
    setIsLoadingFileTypes(true);
    setIsLoadingTrend(true);
    
    try {
      await refreshStorageStats();
      await fetchFileTypeStats();
      await generateStorageHistory();
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeColor = (type: string) => {
    const colors = {
      documents: 'bg-primary-500',
      images: 'bg-secondary-500',
      videos: 'bg-warning-500',
      audio: 'bg-success-500',
      archives: 'bg-purple-500',
      others: 'bg-neutral-500'
    };
    return colors[type as keyof typeof colors] || 'bg-neutral-500';
  };

  const getFileTypePercentage = (count: number) => {
    return serverStats.totalFiles > 0 ? (count / serverStats.totalFiles) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Storage Analytics</h2>
              <p className="text-sm text-neutral-600">Comprehensive drive usage and file statistics</p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-2xl font-bold text-primary-700">{storageUsedPercentage.toFixed(1)}%</p>
                <p className="text-sm text-primary-600">Storage Used</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-secondary-600" />
              <div>
                <p className="text-2xl font-bold text-secondary-700">{serverStats.totalFiles.toLocaleString()}</p>
                <p className="text-sm text-secondary-600">Total Files</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Folder className="w-8 h-8 text-warning-600" />
              <div>
                <p className="text-2xl font-bold text-warning-700">{serverStats.totalFolders.toLocaleString()}</p>
                <p className="text-sm text-warning-600">Total Folders</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-success-600" />
              <div>
                <p className="text-2xl font-bold text-success-700">{formatBytes(avgFileSize)}</p>
                <p className="text-sm text-success-600">Avg File Size</p>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-neutral-900">Storage Breakdown</h3>
              <span className="text-sm text-neutral-600">
                {formatBytes(serverStats.usedStorage)} / {formatBytes(serverStats.totalStorage)}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${storageUsedPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-neutral-600 mt-2">
              <span>Used: {formatBytes(serverStats.usedStorage)}</span>
              <span>Free: {formatBytes(serverStats.freeStorage)}</span>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Type Distribution */}
            <div className="bg-neutral-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <PieChart className="w-5 h-5 text-neutral-600" />
                <h4 className="font-semibold text-neutral-900">File Type Distribution</h4>
              </div>
              
              {isLoadingFileTypes ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                  <p className="text-neutral-600 font-medium">Analyzing file types...</p>
                  <p className="text-neutral-500 text-sm mt-1">Categorizing your files by type</p>
                </div>
              ) : serverStats.totalFiles > 0 ? (
                <div className="space-y-3">
                  {Object.entries(fileTypeStats).map(([type, count]) => {
                    const percentage = getFileTypePercentage(count);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getFileTypeColor(type)}`} />
                          <span className="text-sm text-neutral-700 capitalize">{type}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-neutral-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getFileTypeColor(type)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-neutral-700 w-12 text-right">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-xs text-neutral-500 w-10 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500">No files to analyze</p>
                </div>
              )}
            </div>

            {/* Storage Trend */}
            <div className="bg-neutral-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-neutral-600" />
                <h4 className="font-semibold text-neutral-900">Storage Trend (7 days)</h4>
              </div>
              
              {isLoadingTrend ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-secondary-500 animate-spin mb-4" />
                  <p className="text-neutral-600 font-medium">Generating trend data...</p>
                  <p className="text-neutral-500 text-sm mt-1">Analyzing storage usage patterns</p>
                </div>
              ) : storageHistory.length > 0 ? (
                <>
                  <div className="h-32 flex items-end justify-between space-x-1 mb-3">
                    {storageHistory.map((usage, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-t from-primary-500 to-primary-400 rounded-t flex-1 transition-all duration-300"
                        style={{ height: `${Math.max(usage, 5)}%` }}
                        title={`${usage.toFixed(1)}% used`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <span key={index}>{day}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-500">No trend data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {serverStats.totalFiles + serverStats.totalFolders}
              </p>
              <p className="text-sm text-neutral-600">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {serverStats.totalFolders > 0 ? (serverStats.totalFiles / serverStats.totalFolders).toFixed(1) : '0'}
              </p>
              <p className="text-sm text-neutral-600">Avg Files per Folder</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {((serverStats.freeStorage / serverStats.totalStorage) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-neutral-600">Free Space</p>
            </div>
          </div>
        </div>

        {/* Overall loading indicator */}
        {isLoadingStorageStats && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-6">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-primary-800">Gathering Storage Analytics</p>
                <p className="text-xs text-primary-600">
                  Analyzing your drive to generate comprehensive statistics. This may take a moment for large drives.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageAnalytics;