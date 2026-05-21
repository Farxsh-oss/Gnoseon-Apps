export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'working' | 'school';
  username?: string;
  memberSince?: string;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file' | 'system';
  imageUrl?: string;
  expiresAt?: Date;
  isEncrypted?: boolean;
  isRead?: boolean;
  reactions?: { [emoji: string]: Array<{ userId: string; userName: string }> };
}

export interface Chat {
  id: string;
  contactId?: string;
  groupId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  type: 'private' | 'group';
  groupName?: string;
  groupAvatar?: string;
  memberCount?: number;
}

export interface SharedFile {
  id: string;
  name: string;
  type: 'document' | 'image';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
  role: 'admin' | 'member';
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    messageRetention: number;
    allowFileSharing: boolean;
    requireApproval: boolean;
  };
  members: Array<{
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
    addedBy: string;
  }>;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  status: 'active' | 'busy' | 'working' | 'school';
  memberSince?: string;
}
