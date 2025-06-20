import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: FileList) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      await onUpload(files);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </>
        )}
      </button>

      {/* Drag overlay */}
      {isDragOver && (
        <div
          className="fixed inset-0 bg-primary-500/20 backdrop-blur-sm z-50 flex items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-dashed border-primary-400">
            <div className="text-center">
              <Upload className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Drop files here</h3>
              <p className="text-neutral-600">Release to upload your files</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload feedback overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Uploading Files</h3>
              <p className="text-neutral-600 text-sm">
                Please wait while your files are being uploaded...
              </p>
              <div className="mt-4 bg-neutral-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUpload;