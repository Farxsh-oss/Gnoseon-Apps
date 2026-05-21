export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status?: 'online' | 'offline' | 'away' | 'busy' | 'working' | 'school';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'file' | 'system';
  expiresAt?: Date;
  isEncrypted: boolean;
}

export interface Chat {
  id: string;
  userId1?: string;
  userId2?: string;
  groupId?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  type: 'private' | 'group';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
  settings: GroupSettings;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  addedBy: string;
}

export interface GroupSettings {
  isPublic: boolean;
  allowInvites: boolean;
  messageRetention: number; // days
  allowFileSharing: boolean;
  requireApproval: boolean;
}

export interface MessageReport {
  id: string;
  messageId: string;
  reportedBy: string;
  reason: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}
