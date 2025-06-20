import React from 'react';
import { Download, Upload, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { useFileSystem } from '../../hooks/useFileSystem';

const TransferProgress: React.FC = () => {
  const { transfers, clearCompletedTransfers } = useFileSystem();

  if (transfers.length === 0) return null;

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTimeRemaining = (progress: number, speed: number, fileSize: number = 1000000) => {
    if (progress >= 100 || speed === 0) return '';
    
    const remainingBytes = fileSize * (100 - progress) / 100;
    const remainingSeconds = remainingBytes / speed;
    
    if (remainingSeconds < 60) return `${Math.round(remainingSeconds)}s remaining`;
    if (remainingSeconds < 3600) return `${Math.round(remainingSeconds / 60)}m remaining`;
    return `${Math.round(remainingSeconds / 3600)}h remaining`;
  };

  const activeTransfers = transfers.filter(t => t.status === 'uploading' || t.status === 'downloading');
  const completedTransfers = transfers.filter(t => t.status === 'completed');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-neutral-900">File Transfers</h3>
          {activeTransfers.length > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{activeTransfers.length} active</span>
            </div>
          )}
        </div>
        {completedTransfers.length > 0 && (
          <button
            onClick={clearCompletedTransfers}
            className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Clear Completed
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg"
          >
            <div className="flex-shrink-0">
              {transfer.status === 'uploading' && <Upload className="w-4 h-4 text-primary-600" />}
              {transfer.status === 'downloading' && <Download className="w-4 h-4 text-secondary-600" />}
              {transfer.status === 'completed' && <CheckCircle className="w-4 h-4 text-success-600" />}
              {transfer.status === 'error' && <XCircle className="w-4 h-4 text-error-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {transfer.fileName}
                </p>
                <span className="text-xs text-neutral-600 ml-2">
                  {transfer.progress.toFixed(0)}%
                </span>
              </div>

              <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    transfer.status === 'uploading' ? 'bg-primary-500' :
                    transfer.status === 'downloading' ? 'bg-secondary-500' :
                    transfer.status === 'completed' ? 'bg-success-500' :
                    'bg-error-500'
                  }`}
                  style={{ width: `${transfer.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600 capitalize">
                  {transfer.status === 'uploading' && 'Uploading'}
                  {transfer.status === 'downloading' && 'Downloading'}
                  {transfer.status === 'completed' && 'Completed'}
                  {transfer.status === 'error' && 'Failed'}
                </span>
                <div className="flex items-center space-x-2 text-xs text-neutral-600">
                  {transfer.status !== 'completed' && transfer.status !== 'error' && transfer.speed > 0 && (
                    <>
                      <span>{formatSpeed(transfer.speed)}</span>
                      <span>•</span>
                      <span>{formatTimeRemaining(transfer.progress, transfer.speed)}</span>
                    </>
                  )}
                  {transfer.status === 'completed' && (
                    <span className="text-success-600 font-medium">✓ Done</span>
                  )}
                  {transfer.status === 'error' && (
                    <span className="text-error-600 font-medium">✗ Failed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {transfers.length > 3 && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>
              {transfers.length} total transfers
            </span>
            <span>
              {completedTransfers.length} completed • {activeTransfers.length} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferProgress;