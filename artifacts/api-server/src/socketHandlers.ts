import { Server, Socket } from 'socket.io';
import { ServerDatabaseService } from './server-database';

interface SocketWithUser extends Socket {
  data: {
    user: any;
  };
}

export function handleSocketEvents(socket: SocketWithUser, io: Server, db: ServerDatabaseService) {
  const currentUser = socket.data.user;

  // Join user to their personal room for private messages
  socket.join(`user:${currentUser.id}`);

  // Update user status to online
  db.updateUserProfile(currentUser.id, { status: 'online' });

  // Notify other users that this user is online
  socket.broadcast.emit('user_status_changed', {
    userId: currentUser.id,
    status: 'online'
  });

  // Handle sending private messages
  socket.on('send_message', async (data: { receiverId: string; text: string; expiresIn?: number }) => {
    try {
      const { receiverId, text, expiresIn } = data;

      // Check if receiver exists
      const receiver = db.getUserById(receiverId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }

      // For now, we'll skip blocking logic
      // Check if sender is blocked by receiver
      // if (db.isUserBlocked(receiverId, currentUser.id)) {
      //   socket.emit('error', { message: 'Message blocked' });
      //   return;
      // }

      // Calculate expiration time if specified
      let expiresAt: Date | undefined;
      if (expiresIn && expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      // Create message in database
      const message = db.createMessage(
        currentUser.id,
        receiverId,
        text,
        undefined, // groupId (undefined for private messages)
        'text',
        expiresAt
      );

      // Get sender and receiver info
      const senderInfo = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar
      };

      const receiverInfo = {
        id: receiver.id,
        username: receiver.username,
        displayName: receiver.displayName,
        avatar: receiver.avatar
      };

      // Prepare message data for broadcasting
      const messageData = {
        id: message.id,
        senderId: currentUser.id,
        receiverId: receiverId,
        text: message.text,
        timestamp: message.timestamp,
        type: message.type,
        expiresAt: message.expiresAt,
        isEncrypted: message.isEncrypted,
        sender: senderInfo,
        receiver: receiverInfo
      };

      // Send to both sender and receiver
      io.to(`user:${currentUser.id}`).emit('new_message', messageData);
      io.to(`user:${receiverId}`).emit('new_message', messageData);

      // Update chat list for both users
      const senderChats = db.getChatsForUser(currentUser.id);
      const receiverChats = db.getChatsForUser(receiverId);

      io.to(`user:${currentUser.id}`).emit('chats_updated', senderChats);
      io.to(`user:${receiverId}`).emit('chats_updated', receiverChats);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle sending group messages
  socket.on('send_group_message', async (data: { groupId: string; text: string; expiresIn?: number }) => {
    try {
      const { groupId, text, expiresIn } = data;

      // Check if user is member of the group
      const group = db.getGroupById(groupId);
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      const isMember = group.members.some((member: any) => member.userId === currentUser.id);
      if (!isMember) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      // Calculate expiration time if specified
      let expiresAt: Date | undefined;
      if (expiresIn && expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      // Create message in database
      const message = db.createMessage(
        currentUser.id,
        '', // No receiver for group messages
        text,
        groupId,
        'text',
        expiresAt
      );

      // Get sender info
      const senderInfo = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar
      };

      // Prepare message data for broadcasting
      const messageData = {
        id: message.id,
        senderId: currentUser.id,
        groupId: groupId,
        text: message.text,
        timestamp: message.timestamp,
        type: message.type,
        expiresAt: message.expiresAt,
        isEncrypted: message.isEncrypted,
        sender: senderInfo,
        group: {
          id: group.id,
          name: group.name
        }
      };

      // Send to all group members
      group.members.forEach((member: any) => {
        io.to(`user:${member.userId}`).emit('new_group_message', messageData);
      });

      // Update group messages for all members
      const groupMessages = db.getMessagesForGroup(groupId);
      group.members.forEach((member: any) => {
        io.to(`user:${member.userId}`).emit('group_messages_updated', { groupId, messages: groupMessages });
      });

    } catch (error) {
      console.error('Send group message error:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', (data: { senderId: string }) => {
    try {
      const { senderId } = data;
      db.markMessagesAsRead(senderId, currentUser.id);
      
      // Notify sender that messages were read
      io.to(`user:${senderId}`).emit('messages_read', {
        readerId: currentUser.id,
        senderId: senderId
      });
    } catch (error) {
      console.error('Mark messages read error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data: { receiverId: string }) => {
    const { receiverId } = data;
    io.to(`user:${receiverId}`).emit('user_typing', {
      userId: currentUser.id,
      username: currentUser.displayName,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data: { receiverId: string }) => {
    const { receiverId } = data;
    io.to(`user:${receiverId}`).emit('user_typing', {
      userId: currentUser.id,
      username: currentUser.displayName,
      isTyping: false
    });
  });

  // Handle user status changes
  socket.on('status_change', (data: { status: string }) => {
    try {
      const { status } = data;
      db.updateUserProfile(currentUser.id, { status });
      
      // Broadcast status change to all users
      socket.broadcast.emit('user_status_changed', {
        userId: currentUser.id,
        status: status
      });
    } catch (error) {
      console.error('Status change error:', error);
    }
  });

  // Handle joining group rooms
  socket.on('join_group', (data: { groupId: string }) => {
    const { groupId } = data;
    socket.join(`group:${groupId}`);
  });

  // Handle leaving group rooms
  socket.on('leave_group', (data: { groupId: string }) => {
    const { groupId } = data;
    socket.leave(`group:${groupId}`);
  });

  // Handle creating groups
  socket.on('create_group', async (data: { name: string; description: string; memberIds: string[] }) => {
    try {
      const { name, description, memberIds } = data;
      
      // Create group
      const group = db.createGroup(name, description, currentUser.id);
      
      // Add members
      memberIds.forEach(memberId => {
        db.addGroupMember(group.id, memberId, currentUser.id, 'member');
      });

      // Get updated groups for creator
      const updatedGroups = db.getGroupsForUser(currentUser.id);
      io.to(`user:${currentUser.id}`).emit('groups_updated', updatedGroups);

      // Notify new members
      memberIds.forEach(memberId => {
        const memberGroups = db.getGroupsForUser(memberId);
        io.to(`user:${memberId}`).emit('groups_updated', memberGroups);
      });

      // Send group details to all members
      const fullGroup = db.getGroupById(group.id);
      [currentUser.id, ...memberIds].forEach(memberId => {
        io.to(`user:${memberId}`).emit('group_created', fullGroup);
      });

    } catch (error) {
      console.error('Create group error:', error);
      socket.emit('error', { message: 'Failed to create group' });
    }
  });

  // Handle adding group members
  socket.on('add_group_member', (data: { groupId: string; contactId: string }) => {
    try {
      const { groupId, contactId } = data;
      
      // Check if user is admin of the group
      const group = db.getGroupById(groupId);
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      const userMembership = group.members.find((member: any) => member.userId === currentUser.id);
      if (!userMembership || userMembership.role !== 'admin') {
        socket.emit('error', { message: 'Only admins can add members' });
        return;
      }

      // Add member
      db.addGroupMember(groupId, contactId, currentUser.id, 'member');

      // Get updated group and notify all members
      const updatedGroup = db.getGroupById(groupId);
      updatedGroup!.members.forEach((member: any) => {
        io.to(`user:${member.userId}`).emit('group_updated', updatedGroup);
      });

      // Update groups list for new member
      const memberGroups = db.getGroupsForUser(contactId);
      io.to(`user:${contactId}`).emit('groups_updated', memberGroups);

    } catch (error) {
      console.error('Add group member error:', error);
      socket.emit('error', { message: 'Failed to add group member' });
    }
  });

  // Handle getting online users
  socket.on('get_online_users', () => {
    const allUsers = db.getAllUsers().map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      memberSince: user.createdAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
    }));
    
    socket.emit('online_users', allUsers);
  });

  // Handle getting chats
  socket.on('get_chats', () => {
    const chats = db.getChatsForUser(currentUser.id);
    socket.emit('chats_updated', chats);
  });

  // Handle getting groups
  socket.on('get_groups', () => {
    const groups = db.getGroupsForUser(currentUser.id);
    socket.emit('groups_updated', groups);
  });

  // Handle getting messages between users
  socket.on('get_messages', (data: { userId1: string; userId2: string }) => {
    const { userId1, userId2 } = data;
    
    // Only allow if current user is one of the participants
    if (currentUser.id !== userId1 && currentUser.id !== userId2) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const messages = db.getMessagesBetweenUsers(userId1, userId2);
    socket.emit('messages_loaded', { userId1, userId2, messages });
  });

  // Handle getting group messages
  socket.on('get_group_messages', (data: { groupId: string }) => {
    const { groupId } = data;
    
    // Check if user is member of the group
    const group = db.getGroupById(groupId);
    if (!group || !group.members.some((member: any) => member.userId === currentUser.id)) {
      socket.emit('error', { message: 'Not a member of this group' });
      return;
    }

    const messages = db.getMessagesForGroup(groupId);
    socket.emit('group_messages_loaded', { groupId, messages });
  });

  // Handle file uploaded notification
  socket.on('file_uploaded', (data: { fileId: string; chatId?: string; groupId?: string }) => {
    const { fileId, chatId, groupId } = data;
    
    const file = db.getFileById(fileId);
    if (!file) {
      socket.emit('error', { message: 'File not found' });
      return;
    }

    // Broadcast to relevant users
    if (chatId) {
      const chat = db.getChatForUsers(currentUser.id, file.uploadedBy);
      if (chat) {
        io.to(`user:${file.uploadedBy}`).emit('file_uploaded', file);
        io.to(`user:${currentUser.id}`).emit('file_uploaded', file);
      }
    } else if (groupId) {
      const group = db.getGroupById(groupId);
      if (group) {
        group.members.forEach((member: any) => {
          io.to(`user:${member.userId}`).emit('file_uploaded', file);
        });
      }
    }
  });

  // Handle adding message reactions
  socket.on('add_reaction', async (data: { messageId: string; emoji: string }) => {
    try {
      const { messageId, emoji } = data;
      const success = db.addReaction(messageId, currentUser.id, emoji);
      
      if (success) {
        const message = db.getMessageById(messageId);
        if (message) {
          const reactions = db.getReactionsForMessage(messageId);
          
          // Notify relevant users
          if (message.groupId) {
            const group = db.getGroupById(message.groupId);
            if (group) {
              group.members.forEach((member: any) => {
                io.to(`user:${member.userId}`).emit('reaction_updated', { messageId, reactions });
              });
            }
          } else if (message.receiverId) {
            io.to(`user:${message.senderId}`).emit('reaction_updated', { messageId, reactions });
            io.to(`user:${message.receiverId}`).emit('reaction_updated', { messageId, reactions });
          }
        }
      }
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });

  // Handle removing message reactions
  socket.on('remove_reaction', async (data: { messageId: string; emoji: string }) => {
    try {
      const { messageId, emoji } = data;
      const success = db.removeReaction(messageId, currentUser.id, emoji);
      
      if (success) {
        const message = db.getMessageById(messageId);
        if (message) {
          const reactions = db.getReactionsForMessage(messageId);
          
          // Notify relevant users
          if (message.groupId) {
            const group = db.getGroupById(message.groupId);
            if (group) {
              group.members.forEach((member: any) => {
                io.to(`user:${member.userId}`).emit('reaction_updated', { messageId, reactions });
              });
            }
          } else if (message.receiverId) {
            io.to(`user:${message.senderId}`).emit('reaction_updated', { messageId, reactions });
            io.to(`user:${message.receiverId}`).emit('reaction_updated', { messageId, reactions });
          }
        }
      }
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  });

  // Handle file deleted notification
  socket.on('file_deleted', (data: { fileId: string; chatId?: string; groupId?: string }) => {
    const { fileId, chatId, groupId } = data;
    
    // Broadcast to relevant users
    if (chatId) {
      const file = db.getFileById(fileId);
      if (file) {
        io.to(`user:${file.uploadedBy}`).emit('file_deleted', { fileId });
        io.to(`user:${currentUser.id}`).emit('file_deleted', { fileId });
      }
    } else if (groupId) {
      const group = db.getGroupById(groupId);
      if (group) {
        group.members.forEach((member: any) => {
          io.to(`user:${member.userId}`).emit('file_deleted', { fileId });
        });
      }
    }
  });
}
