import { Server, Socket } from 'socket.io';
import { ServerDatabaseService } from './server-database';

interface SocketWithUser extends Socket {
  data: {
    user: any;
  };
}

export function handleSocketEvents(socket: SocketWithUser, io: Server, db: ServerDatabaseService) {
  const currentUser = socket.data.user;

  // Validate user exists
  if (!currentUser || !currentUser.id) {
    socket.emit('error', { message: 'User not authenticated' });
    return;
  }

  // Join user to their personal room for private messages
  socket.join(`user:${currentUser.id}`);

  // Update user status to online
  try {
    db.updateUserProfile(currentUser.id, { status: 'online' });
  } catch (error) {
    console.error('Error updating user status:', error);
  }

  // Notify other users that this user is online
  socket.broadcast.emit('user_status_changed', {
    userId: currentUser.id,
    status: 'online',
  });

  // Handle sending private messages
  socket.on('send_message', async (data: { receiverId: string; text: string; expiresIn?: number }) => {
    try {
      const { receiverId, text, expiresIn } = data;

      // Validate input
      if (!receiverId || !text || !text.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Check if receiver exists
      const receiver = db.getUserById(receiverId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }

      // Calculate expiration time if specified
      let expiresAt: Date | undefined;
      if (expiresIn && expiresIn > 0) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      // Create message in database
      const message = db.createMessage(currentUser.id, receiverId, text, undefined, 'text', expiresAt);

      // Get sender and receiver info
      const senderInfo = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
      };

      const receiverInfo = {
        id: receiver.id,
        username: receiver.username,
        displayName: receiver.displayName,
        avatar: receiver.avatar,
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
        receiver: receiverInfo,
      };

      // Send to both sender and receiver
      io.to(`user:${currentUser.id}`).emit('new_message', messageData);
      io.to(`user:${receiverId}`).emit('new_message', messageData);

      // Update chat list for both users
      const senderChats = db.getChatsForUser(currentUser.id);
      const receiverChats = db.getChatsForUser(receiverId);

      io.to(`user:${currentUser.id}`).emit('chats_updated', senderChats);
      io.to(`user:${receiverId}`).emit('chats_updated', receiverChats);

      socket.emit('message_sent', { success: true, messageId: message.id });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle sending group messages
  socket.on('send_group_message', async (data: { groupId: string; text: string; expiresIn?: number }) => {
    try {
      const { groupId, text, expiresIn } = data;

      // Validate input
      if (!groupId || !text || !text.trim()) {
        socket.emit('error', { message: 'Invalid group message data' });
        return;
      }

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
      const message = db.createMessage(currentUser.id, '', text, groupId, 'text', expiresAt);

      // Get sender info
      const senderInfo = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
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
          name: group.name,
        },
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

      socket.emit('group_message_sent', { success: true, messageId: message.id });
    } catch (error) {
      console.error('Send group message error:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', (data: { senderId: string }) => {
    try {
      const { senderId } = data;
      if (!senderId) {
        socket.emit('error', { message: 'Invalid sender ID' });
        return;
      }

      db.markMessagesAsRead(senderId, currentUser.id);

      // Notify sender that messages were read
      io.to(`user:${senderId}`).emit('messages_read', {
        readerId: currentUser.id,
        senderId: senderId,
      });
    } catch (error) {
      console.error('Mark messages read error:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data: { receiverId: string }) => {
    try {
      const { receiverId } = data;
      if (!receiverId) return;

      io.to(`user:${receiverId}`).emit('user_typing', {
        userId: currentUser.id,
        username: currentUser.displayName,
        isTyping: true,
      });
    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on('typing_stop', (data: { receiverId: string }) => {
    try {
      const { receiverId } = data;
      if (!receiverId) return;

      io.to(`user:${receiverId}`).emit('user_typing', {
        userId: currentUser.id,
        username: currentUser.displayName,
        isTyping: false,
      });
    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });

  // Handle user status changes
  socket.on('status_change', (data: { status: string }) => {
    try {
      const { status } = data;
      if (!status) return;

      db.updateUserProfile(currentUser.id, { status });

      // Broadcast status change to all users
      socket.broadcast.emit('user_status_changed', {
        userId: currentUser.id,
        status: status,
      });
    } catch (error) {
      console.error('Status change error:', error);
    }
  });

  // Handle joining group rooms
  socket.on('join_group', (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      if (!groupId) {
        socket.emit('error', { message: 'Invalid group ID' });
        return;
      }

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

      socket.join(`group:${groupId}`);
    } catch (error) {
      console.error('Join group error:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Handle leaving group rooms
  socket.on('leave_group', (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      if (!groupId) return;

      socket.leave(`group:${groupId}`);
    } catch (error) {
      console.error('Leave group error:', error);
    }
  });

  // Handle creating groups
  socket.on('create_group', async (data: { name: string; description: string; memberIds: string[] }) => {
    try {
      const { name, description, memberIds } = data;

      if (!name || !name.trim()) {
        socket.emit('error', { message: 'Group name is required' });
        return;
      }

      // Create group
      const group = db.createGroup(name, description || '', currentUser.id);

      // Add members
      if (memberIds && Array.isArray(memberIds)) {
        memberIds.forEach((memberId) => {
          try {
            db.addGroupMember(group.id, memberId, currentUser.id, 'member');
          } catch (err) {
            console.error('Error adding group member:', err);
          }
        });
      }

      // Get updated groups for creator
      const updatedGroups = db.getGroupsForUser(currentUser.id);
      io.to(`user:${currentUser.id}`).emit('groups_updated', updatedGroups);

      // Notify new members
      memberIds?.forEach((memberId) => {
        const memberGroups = db.getGroupsForUser(memberId);
        io.to(`user:${memberId}`).emit('groups_updated', memberGroups);
      });

      // Send group details to all members
      const fullGroup = db.getGroupById(group.id);
      if (fullGroup) {
        [currentUser.id, ...(memberIds || [])].forEach((memberId) => {
          io.to(`user:${memberId}`).emit('group_created', fullGroup);
        });
      }

      socket.emit('group_created', { success: true, groupId: group.id });
    } catch (error) {
      console.error('Create group error:', error);
      socket.emit('error', { message: 'Failed to create group' });
    }
  });

  // Handle adding group members
  socket.on('add_group_member', (data: { groupId: string; contactId: string }) => {
    try {
      const { groupId, contactId } = data;

      if (!groupId || !contactId) {
        socket.emit('error', { message: 'Invalid group or contact ID' });
        return;
      }

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
      if (updatedGroup) {
        updatedGroup.members.forEach((member: any) => {
          io.to(`user:${member.userId}`).emit('group_updated', updatedGroup);
        });

        // Update groups list for new member
        const memberGroups = db.getGroupsForUser(contactId);
        io.to(`user:${contactId}`).emit('groups_updated', memberGroups);
      }

      socket.emit('member_added', { success: true });
    } catch (error) {
      console.error('Add group member error:', error);
      socket.emit('error', { message: 'Failed to add group member' });
    }
  });

  // Handle getting online users
  socket.on('get_online_users', () => {
    try {
      const allUsers = db.getAllUsers().map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        memberSince: user.createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
      }));

      socket.emit('online_users', allUsers);
    } catch (error) {
      console.error('Get online users error:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  });

  // Handle getting chats
  socket.on('get_chats', () => {
    try {
      const chats = db.getChatsForUser(currentUser.id);
      socket.emit('chats_updated', chats);
    } catch (error) {
      console.error('Get chats error:', error);
      socket.emit('error', { message: 'Failed to get chats' });
    }
  });

  // Handle getting groups
  socket.on('get_groups', () => {
    try {
      const groups = db.getGroupsForUser(currentUser.id);
      socket.emit('groups_updated', groups);
    } catch (error) {
      console.error('Get groups error:', error);
      socket.emit('error', { message: 'Failed to get groups' });
    }
  });

  // Handle getting messages between users
  socket.on('get_messages', (data: { userId1: string; userId2: string }) => {
    try {
      const { userId1, userId2 } = data;

      if (!userId1 || !userId2) {
        socket.emit('error', { message: 'Invalid user IDs' });
        return;
      }

      // Only allow if current user is one of the participants
      if (currentUser.id !== userId1 && currentUser.id !== userId2) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const messages = db.getMessagesBetweenUsers(userId1, userId2);
      socket.emit('messages_loaded', { userId1, userId2, messages });
    } catch (error) {
      console.error('Get messages error:', error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  });

  // Handle getting group messages
  socket.on('get_group_messages', (data: { groupId: string }) => {
    try {
      const { groupId } = data;

      if (!groupId) {
        socket.emit('error', { message: 'Invalid group ID' });
        return;
      }

      // Check if user is member of the group
      const group = db.getGroupById(groupId);
      if (!group || !group.members.some((member: any) => member.userId === currentUser.id)) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      const messages = db.getMessagesForGroup(groupId);
      socket.emit('group_messages_loaded', { groupId, messages });
    } catch (error) {
      console.error('Get group messages error:', error);
      socket.emit('error', { message: 'Failed to get group messages' });
    }
  });

  // Handle file uploaded notification
  socket.on('file_uploaded', (data: { fileId: string; chatId?: string; groupId?: string }) => {
    try {
      const { fileId, chatId, groupId } = data;

      if (!fileId) {
        socket.emit('error', { message: 'Invalid file ID' });
        return;
      }

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
    } catch (error) {
      console.error('File uploaded error:', error);
    }
  });

  // Handle adding message reactions
  socket.on('add_reaction', async (data: { messageId: string; emoji: string }) => {
    try {
      const { messageId, emoji } = data;

      if (!messageId || !emoji) {
        socket.emit('error', { message: 'Invalid reaction data' });
        return;
      }

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
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Handle removing message reactions
  socket.on('remove_reaction', async (data: { messageId: string; emoji: string }) => {
    try {
      const { messageId, emoji } = data;

      if (!messageId || !emoji) {
        socket.emit('error', { message: 'Invalid reaction data' });
        return;
      }

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
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  });

  // Handle file deleted notification
  socket.on('file_deleted', (data: { fileId: string; chatId?: string; groupId?: string }) => {
    try {
      const { fileId, chatId, groupId } = data;

      if (!fileId) {
        socket.emit('error', { message: 'Invalid file ID' });
        return;
      }

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
    } catch (error) {
      console.error('File deleted error:', error);
    }
  });
}
