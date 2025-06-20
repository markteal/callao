import { useState, useEffect, useCallback } from 'react';
import { FileItem, TransferProgress } from '../types';
import api from '../services/api';

export const useFileSystem = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simplified file loading without aggressive debouncing
  const loadFiles = useCallback(async (path: string = currentPath) => {
    setIsLoading(true);
    try {
      const response = await api.listFiles(path);
      
      const fileItems: FileItem[] = response.files.map((file: any) => ({
        id: file.path || file.name,
        name: file.name,
        type: file.type,
        size: file.size || 0,
        lastModified: new Date(file.modified || Date.now()),
        path: file.path || `${path}/${file.name}`,
        permissions: file.permissions || { read: true, write: true, delete: true },
        mimeType: file.mimeType
      }));

      setFiles(fileItems);
      
      // Track file listing activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'list_directory',
          target: path || '/',
          status: 'success',
          details: `Listed ${fileItems.length} items in ${path || '/'}`
        });
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      
      // Check if it's a session timeout error
      if (error instanceof Error && error.message.includes('Session expired')) {
        // Don't set files to empty array for session timeout
        // The auth system will handle the logout
        return;
      }
      
      // Track file listing error
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'list_directory',
          target: path || '/',
          status: 'error',
          details: `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  // Load files when path changes
  useEffect(() => {
    if (api.isAuthenticated()) {
      loadFiles(currentPath);
    }
  }, [currentPath, loadFiles]);

  // Simplified navigation
  const navigateToPath = useCallback((path: string) => {
    if (path !== currentPath) {
      setCurrentPath(path);
      setSelectedFiles([]);
    }
  }, [currentPath]);

  const createFolder = async (name: string) => {
    try {
      await api.createFolder(currentPath, name);
      
      // Track folder creation activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'create_folder',
          target: `${currentPath}/${name}`,
          status: 'success',
          details: `Created folder: ${name}`
        });
      }
      
      // Reload files after creating folder
      await loadFiles(currentPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
      
      // Track folder creation error
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'create_folder',
          target: `${currentPath}/${name}`,
          status: 'error',
          details: `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      // Re-throw non-session errors
      if (!(error instanceof Error && error.message.includes('Session expired'))) {
        throw error;
      }
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    const newTransfers: TransferProgress[] = Array.from(fileList).map(file => ({
      id: Date.now().toString() + Math.random(),
      fileName: file.name,
      progress: 0,
      speed: 0,
      status: 'uploading' as const,
      startTime: new Date()
    }));

    setTransfers(prev => [...prev, ...newTransfers]);

    // Upload each file with better progress tracking
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const transfer = newTransfers[i];
      let lastProgress = 0;
      let lastTime = Date.now();

      try {
        await api.uploadFile(currentPath, file, (progress) => {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000; // seconds
          const progressDiff = progress - lastProgress;
          const speed = timeDiff > 0 ? (file.size * progressDiff / 100) / timeDiff : 0;

          setTransfers(prev => prev.map(t => 
            t.id === transfer.id 
              ? { 
                  ...t, 
                  progress, 
                  status: progress >= 100 ? 'completed' : 'uploading',
                  speed: Math.max(0, speed)
                }
              : t
          ));

          lastProgress = progress;
          lastTime = now;
        });

        // Mark as completed and track activity
        setTransfers(prev => prev.map(t => 
          t.id === transfer.id 
            ? { ...t, progress: 100, status: 'completed', speed: 0 }
            : t
        ));
        
        // Track upload activity
        const activityTracker = api.getActivityTracker();
        if (activityTracker) {
          const user = api.getCurrentUser();
          activityTracker.addActivity({
            user: user?.username || 'Unknown',
            action: 'upload',
            target: `${currentPath}/${file.name}`,
            status: 'success',
            details: `Uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
          });
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setTransfers(prev => prev.map(t => 
          t.id === transfer.id 
            ? { ...t, status: 'error', speed: 0 }
            : t
        ));
        
        // Track upload error
        const activityTracker = api.getActivityTracker();
        if (activityTracker) {
          const user = api.getCurrentUser();
          activityTracker.addActivity({
            user: user?.username || 'Unknown',
            action: 'upload',
            target: `${currentPath}/${file.name}`,
            status: 'error',
            details: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
        
        // Don't continue uploading if session expired
        if (error instanceof Error && error.message.includes('Session expired')) {
          break;
        }
      }
    }

    // Refresh file list after uploads (if still authenticated)
    if (api.isAuthenticated()) {
      await loadFiles(currentPath);
    }
  };

  const deleteFiles = async (fileIds: string[]) => {
    try {
      // Get file names for activity tracking
      const filesToDelete = files.filter(file => fileIds.includes(file.id));
      
      // Delete files in parallel for better performance
      await Promise.all(fileIds.map(fileId => api.deleteItem(fileId)));
      setSelectedFiles([]);
      
      // Track delete activities
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        filesToDelete.forEach(file => {
          activityTracker.addActivity({
            user: user?.username || 'Unknown',
            action: 'delete',
            target: file.path,
            status: 'success',
            details: `Deleted ${file.type}: ${file.name}`
          });
        });
      }
      
      await loadFiles(currentPath); // Reload after delete
    } catch (error) {
      console.error('Failed to delete files:', error);
      
      // Track delete error
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'delete',
          target: `${fileIds.length} items`,
          status: 'error',
          details: `Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      // Re-throw non-session errors
      if (!(error instanceof Error && error.message.includes('Session expired'))) {
        throw error;
      }
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      const oldName = file?.name || 'Unknown';
      
      await api.renameItem(fileId, newName);
      
      // Track rename activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'rename',
          target: file?.path || fileId,
          status: 'success',
          details: `Renamed "${oldName}" to "${newName}"`
        });
      }
      
      await loadFiles(currentPath); // Reload after rename
    } catch (error) {
      console.error('Failed to rename file:', error);
      
      // Track rename error
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'rename',
          target: fileId,
          status: 'error',
          details: `Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
      // Re-throw non-session errors
      if (!(error instanceof Error && error.message.includes('Session expired'))) {
        throw error;
      }
    }
  };

  const downloadFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || file.type === 'folder') return;

    const transfer: TransferProgress = {
      id: Date.now().toString(),
      fileName: file.name,
      progress: 0,
      speed: 0,
      status: 'downloading',
      startTime: new Date()
    };

    setTransfers(prev => [...prev, transfer]);

    try {
      // Simulate download progress with more realistic behavior
      const progressInterval = setInterval(() => {
        setTransfers(prev => prev.map(t => 
          t.id === transfer.id && t.progress < 90
            ? { 
                ...t, 
                progress: Math.min(90, t.progress + Math.random() * 15 + 5),
                speed: Math.random() * 3000000 + 1000000 // 1-4 MB/s
              }
            : t
        ));
      }, 150);

      const response = await api.downloadFile(file.path);
      
      clearInterval(progressInterval);
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark as completed
      setTransfers(prev => prev.map(t => 
        t.id === transfer.id 
          ? { ...t, progress: 100, status: 'completed', speed: 0 }
          : t
      ));
      
      // Track download activity
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'download',
          target: file.path,
          status: 'success',
          details: `Downloaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      setTransfers(prev => prev.map(t => 
        t.id === transfer.id 
          ? { ...t, status: 'error', speed: 0 }
          : t
      ));
      
      // Track download error
      const activityTracker = api.getActivityTracker();
      if (activityTracker) {
        const user = api.getCurrentUser();
        activityTracker.addActivity({
          user: user?.username || 'Unknown',
          action: 'download',
          target: file.path,
          status: 'error',
          details: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  const clearCompletedTransfers = () => {
    setTransfers(prev => prev.filter(t => t.status !== 'completed'));
  };

  return {
    files,
    currentPath,
    selectedFiles,
    transfers,
    isLoading,
    setSelectedFiles,
    navigateToPath,
    createFolder,
    uploadFiles,
    deleteFiles,
    renameFile,
    downloadFile,
    clearCompletedTransfers,
    refreshFiles: () => loadFiles(currentPath)
  };
};