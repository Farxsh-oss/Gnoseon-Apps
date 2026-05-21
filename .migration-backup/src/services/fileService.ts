import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SharedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedBy: string;
  chatId?: string;
  groupId?: string;
  uploadedAt: Date;
}

export const fileService = {
  async uploadFile(file: File, uploadedBy: string, chatId?: string, groupId?: string): Promise<SharedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);
    if (chatId) formData.append('chatId', chatId);
    if (groupId) formData.append('groupId', groupId);

    const response = await axios.post(`${API_BASE}/api/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE}/api/files/${fileId}/download`, {
      responseType: 'blob',
    });

    return response.data;
  },

  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(`${API_BASE}/api/files/${fileId}`);
    return response.data;
  },

  async getFilesForChat(chatId: string): Promise<SharedFile[]> {
    const response = await axios.get(`${API_BASE}/api/files/chat/${chatId}`);
    return response.data;
  },

  async getFilesForGroup(groupId: string): Promise<SharedFile[]> {
    const response = await axios.get(`${API_BASE}/api/files/group/${groupId}`);
    return response.data;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};
