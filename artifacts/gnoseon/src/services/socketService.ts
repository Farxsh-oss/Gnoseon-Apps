import { io, Socket } from 'socket.io-client';

const SOCKET_URL = '';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        path: '/api/socket.io'
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Message events
  sendMessage(receiverId: string, text: string, expiresIn?: number) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('send_message', { receiverId, text, expiresIn });
  }

  sendGroupMessage(groupId: string, text: string, expiresIn?: number) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('send_group_message', { groupId, text, expiresIn });
  }

  markMessagesRead(senderId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('mark_messages_read', { senderId });
  }

  // Typing indicators
  startTyping(receiverId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('typing_start', { receiverId });
  }

  stopTyping(receiverId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('typing_stop', { receiverId });
  }

  // Status management
  updateStatus(status: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('status_change', { status });
  }

  // Group management
  joinGroup(groupId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join_group', { groupId });
  }

  leaveGroup(groupId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave_group', { groupId });
  }

  createGroup(name: string, description: string, memberIds: string[]) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('create_group', { name, description, memberIds });
  }

  addGroupMember(groupId: string, contactId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('add_group_member', { groupId, contactId });
  }

  // Data fetching
  getOnlineUsers() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('get_online_users');
  }

  getChats() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('get_chats');
  }

  getGroups() {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('get_groups');
  }

  getMessages(userId1: string, userId2: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('get_messages', { userId1, userId2 });
  }

  getGroupMessages(groupId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('get_group_messages', { groupId });
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('new_message', callback);
  }

  onNewGroupMessage(callback: (message: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('new_group_message', callback);
  }

  onUserTyping(callback: (data: { userId: string; username: string; isTyping: boolean }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('user_typing', callback);
  }

  onUserStatusChanged(callback: (data: { userId: string; status: string }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('user_status_changed', callback);
  }

  onChatsUpdated(callback: (chats: any[]) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('chats_updated', callback);
  }

  onGroupsUpdated(callback: (groups: any[]) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('groups_updated', callback);
  }

  onMessagesLoaded(callback: (data: { userId1: string; userId2: string; messages: any[] }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('messages_loaded', callback);
  }

  onGroupMessagesLoaded(callback: (data: { groupId: string; messages: any[] }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('group_messages_loaded', callback);
  }

  onGroupMessagesUpdated(callback: (data: { groupId: string; messages: any[] }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('group_messages_updated', callback);
  }

  onMessagesRead(callback: (data: { readerId: string; senderId: string }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('messages_read', callback);
  }

  onGroupCreated(callback: (group: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('group_created', callback);
  }

  onGroupUpdated(callback: (group: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('group_updated', callback);
  }

  onOnlineUsers(callback: (users: any[]) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('online_users', callback);
  }

  onConnect(callback: () => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('connect', callback);
  }

  addReaction(messageId: string, emoji: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('add_reaction', { messageId, emoji });
  }

  removeReaction(messageId: string, emoji: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('remove_reaction', { messageId, emoji });
  }

  onReactionUpdated(callback: (data: { messageId: string; reactions: { [emoji: string]: any[] } }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('reaction_updated', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('error', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
