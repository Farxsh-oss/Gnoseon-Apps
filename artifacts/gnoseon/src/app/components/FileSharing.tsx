import React, { useState, useRef } from 'react';
import { Paperclip, X, Download, FileText, Image, Film, Music, Loader2 } from 'lucide-react';
import { fileService, SharedFile as ApiSharedFile } from '../../services/fileService';

export interface SharedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: Date;
}

interface FileSharingProps {
  onFileSelect?: (files: FileList) => void;
  sharedFiles?: SharedFile[];
  onDownloadFile?: (file: SharedFile) => void;
  onDeleteFile?: (fileId: string) => void;
  disabled?: boolean;
  uploadedBy?: string;
  chatId?: string;
  groupId?: string;
  onFileUploaded?: (file: ApiSharedFile) => void;
}

export function FileSharing({ 
  onFileSelect, 
  sharedFiles = [], 
  onDownloadFile,
  onDeleteFile,
  disabled = false,
  uploadedBy,
  chatId,
  groupId,
  onFileUploaded
}: FileSharingProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && !disabled && uploadedBy) {
      await uploadFile(files[0]);
    } else if (files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && !disabled && uploadedBy) {
      await uploadFile(files[0]);
    } else if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
  };

  const uploadFile = async (file: File) => {
    if (!uploadedBy) return;
    
    setUploading(true);
    try {
      const uploadedFile = await fileService.uploadFile(file, uploadedBy, chatId, groupId);
      onFileUploaded?.(uploadedFile);
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: SharedFile) => {
    if (onDownloadFile) {
      onDownloadFile(file);
      return;
    }

    try {
      const blob = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      onDeleteFile?.(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return fileService.formatFileSize(bytes);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Film className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 mx-auto mb-2 text-blue-500 animate-spin" />
        ) : (
          <Paperclip className="w-6 h-6 mx-auto mb-2 text-gray-400" />
        )}
        <p className="text-sm text-gray-600">
          {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum file size: 10MB
        </p>
      </div>

      {/* Shared Files List */}
      {sharedFiles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700">Shared Files</h4>
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg neu-flat"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getFileIcon(file.fileType)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-purple-600 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {onDeleteFile && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
