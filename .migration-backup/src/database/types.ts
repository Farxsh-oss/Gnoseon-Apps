export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  userId1: string;
  userId2: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
}
