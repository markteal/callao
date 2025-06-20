import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Plus,
  Search,
  RefreshCw,
  Grid,
  List,
  ChevronRight,
  Home,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useFileSystem } from '../../hooks/useFileSystem';
import { FileItem } from '../../types';
import FileUpload from './FileUpload';
import CreateFolderModal from './CreateFolderModal';

interface DeleteConfirmationModalProps {
  files: FileItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ files, onConfirm, onCancel }) => {
  const fileCount = files.filter(f => f.type === 'file').length;
  const folderCount = files.filter(f => f.type === 'folder').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-error-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Confirm Delete</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-warning-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-lg font-medium text-neutral-900 mb-3">
                Are you sure you want to delete {files.length === 1 ? 'this item' : 'these items'}?
              </h4>
              
              <div className="bg-neutral-50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                {files.length === 1 ? (
                  <div className="flex items-center space-x-2">
                    {files[0].type === 'folder' ? (
                      <Folder className="w-4 h-4 text-warning-600 flex-shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {files[0].name}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      {fileCount > 0 && folderCount > 0 && (
                        <span>{fileCount} file{fileCount !== 1 ? 's' : ''} and {folderCount} folder{folderCount !== 1 ? 's' : ''}</span>
                      )}
                      {fileCount > 0 && folderCount === 0 && (
                        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
                      )}
                      {fileCount === 0 && folderCount > 0 && (
                        <span>{folderCount} folder{folderCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {files.slice(0, 5).map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {file.type === 'folder' ? (
                          <Folder className="w-3 h-3 text-warning-600 flex-shrink-0" />
                        ) : (
                          <File className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                        )}
                        <span className="text-xs text-neutral-700 truncate">
                          {file.name}
                        </span>
                      </div>
                    ))}
                    {files.length > 5 && (
                      <div className="text-xs text-neutral-500 italic">
                        ...and {files.length - 5} more item{files.length - 5 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-error-800">Warning</p>
                    <p className="text-sm text-error-700">
                      This action cannot be undone. {folderCount > 0 && 'Folders and all their contents will be permanently deleted.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-error-500 hover:bg-error-600 text-white rounded-lg transition-colors"
            >
              Delete {files.length === 1 ? 'Item' : `${files.length} Items`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileExplorer: React.FC = () => {
  const {
    files,
    currentPath,
    selectedFiles,
    setSelectedFiles,
    navigateToPath,
    createFolder,
    deleteFiles,
    renameFile,
    downloadFile,
    uploadFiles,
    isLoading,
    refreshFiles
  } = useFileSystem();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Sort files: folders first, then files, both alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    // First, sort by type (folders first)
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // Then sort alphabetically within each type
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  const filteredFiles = sortedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (fileId: string, isCtrlClick = false) => {
    if (isCtrlClick) {
      setSelectedFiles(prev =>
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFiles([fileId]);
    }
  };

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateToPath(file.path);
    } else {
      downloadFile(file.id);
    }
  };

  const handleSingleClick = (file: FileItem, isCtrlClick = false) => {
    // If the file is already selected and it's a folder, open it
    if (!isCtrlClick && selectedFiles.includes(file.id) && selectedFiles.length === 1 && file.type === 'folder') {
      navigateToPath(file.path);
    } else {
      handleFileSelect(file.id, isCtrlClick);
    }
  };

  const handleRename = (fileId: string, currentName: string) => {
    setRenamingFile(fileId);
    setNewFileName(currentName);
  };

  const confirmRename = () => {
    if (renamingFile && newFileName.trim()) {
      renameFile(renamingFile, newFileName.trim());
    }
    setRenamingFile(null);
    setNewFileName('');
  };

  const cancelRename = () => {
    setRenamingFile(null);
    setNewFileName('');
  };

  const handleDeleteClick = () => {
    if (selectedFiles.length > 0) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFiles(selectedFiles);
      setShowDeleteConfirmation(false);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    setIsCreatingFolder(true);
    try {
      await createFolder(name);
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Create folder failed:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFiles();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSelectedFileItems = () => {
    return files.filter(file => selectedFiles.includes(file.id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const pathSegments = currentPath.split('/').filter(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">File Explorer</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => navigateToPath('/')}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
          >
            <Home className="w-4 h-4 text-neutral-600" />
            <span className="text-sm text-neutral-600">Callao</span>
          </button>
          {pathSegments.map((segment, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
              <button
                onClick={() => navigateToPath('/' + pathSegments.slice(0, index + 1).join('/'))}
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                {segment}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <FileUpload onUpload={uploadFiles} />
          
          <button
            onClick={() => setShowCreateFolder(true)}
            disabled={isCreatingFolder}
            className="flex items-center space-x-2 px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingFolder ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isCreatingFolder ? 'Creating...' : 'New Folder'}
            </span>
          </button>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Selected Actions */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center space-x-2 mt-3 p-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700 font-medium">
              {selectedFiles.length} item{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-1 ml-auto">
              <button
                onClick={() => selectedFiles.forEach(id => downloadFile(id))}
                className="p-1 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-1 text-error-600 hover:bg-error-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
            <p className="text-neutral-600 text-lg font-medium">Loading files...</p>
            <p className="text-neutral-500 text-sm mt-1">Please wait while we fetch your files</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg">No files found</p>
            <p className="text-neutral-500 text-sm">Upload files or create folders to get started</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFiles.includes(file.id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-neutral-50 border border-transparent'
                }`}
                onClick={(e) => handleSingleClick(file, e.ctrlKey || e.metaKey)}
                onDoubleClick={() => handleDoubleClick(file)}
              >
                <div className="flex-shrink-0">
                  {file.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-warning-600" />
                  ) : (
                    <File className="w-5 h-5 text-neutral-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  {renamingFile === file.id ? (
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {file.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-neutral-600">
                  <span className="w-20 text-right">
                    {file.type === 'file' ? formatFileSize(file.size) : '—'}
                  </span>
                  <span className="w-44 whitespace-nowrap">
                    {formatDate(file.lastModified)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(file.id, file.name);
                      }}
                      className="p-1 text-neutral-500 hover:text-primary-600 hover:bg-primary-100 rounded transition-colors"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {file.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.id);
                        }}
                        className="p-1 text-neutral-500 hover:text-secondary-600 hover:bg-secondary-100 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFiles.includes(file.id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-neutral-50 border border-neutral-200'
                }`}
                onClick={(e) => handleSingleClick(file, e.ctrlKey || e.metaKey)}
                onDoubleClick={() => handleDoubleClick(file)}
              >
                <div className="text-center">
                  <div className="mb-3">
                    {file.type === 'folder' ? (
                      <Folder className="w-8 h-8 text-warning-600 mx-auto" />
                    ) : (
                      <File className="w-8 h-8 text-neutral-600 mx-auto" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-neutral-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  {file.type === 'file' && (
                    <p className="text-xs text-neutral-600 mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}

      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          files={getSelectedFileItems()}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </div>
  );
};

export default FileExplorer;