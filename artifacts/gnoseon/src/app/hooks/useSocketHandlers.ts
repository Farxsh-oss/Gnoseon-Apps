import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useContactsStore } from '../stores/contactsStore';
import { useSoundNotifications } from './useSoundNotifications';
import socketService from '../../services/socketService';
import defaultAvatar from '@/assets/contacts.png';
import { Contact } from '../types';

const CONTACT_STATUSES: Contact['status'][] = ['online', 'offline', 'away', 'busy', 'working', 'school'];

const normalizeContactStatus = (status: unknown): Contact['status'] => {
  return CONTACT_STATUSES.includes(status as Contact['status']) ? status as Contact['status'] : 'offline';
};

export const useSocketHandlers = () => {
  const { user } = useAuthStore();
  const { 
    setChats, 
    setGroups, 
    addMessage, 
    addGroupMessage, 
    setMessages, 
    setGroupMessages,
    setMessageReactions 
  } = useChatStore();
  const { setContacts, updateContact } = useContactsStore();
  const { playNotificationSound } = useSoundNotifications();

  const setupSocketListeners = useCallback(() => {
    if (!user) return;

    // Listen for online users
    socketService.onOnlineUsers((users) => {
      const filteredUsers = users.filter((u: any) => u.id !== user.id);
      const contactsData = filteredUsers.map((u: any) => ({
        id: u.id,
        name: u.displayName,
        avatar: u.avatar || defaultAvatar,
        status: normalizeContactStatus(u.status),
        username: u.username,
        memberSince: u.memberSince,
        bio: u.bio
      }));
      setContacts(contactsData);
    });

    // Listen for chats updates
    socketService.onChatsUpdated((updatedChats) => {
      const state = useChatStore.getState();
      // If a temp chat is selected, remap to the real chat after server update
      if (state.selectedChatId?.startsWith('temp-')) {
        const tempChat = state.chats.find((c: any) => c.id === state.selectedChatId);
        if (tempChat) {
          const realChat = updatedChats.find((c: any) => c.contactId === tempChat.contactId);
          if (realChat) {
            state.setSelectedChatId(realChat.id);
          }
        }
      }
      setChats(updatedChats);
    });

    // Listen for groups updates
    socketService.onGroupsUpdated((updatedGroups) => {
      setGroups(updatedGroups);
    });

    // Listen for new messages
    socketService.onNewMessage((message) => {
      if (message.receiverId === user.id || message.senderId === user.id) {
        // Update messages for this chat
        const chatId = message.receiverId === user.id ? message.senderId : message.receiverId;
        addMessage(chatId, message);
        
        // Play notification sound
        if (message.receiverId === user.id) {
          playNotificationSound('message');
        }
      }
    });

    // Listen for new group messages
    socketService.onNewGroupMessage((message) => {
      addGroupMessage(message.groupId, message);
      
      // Play notification sound
      if (message.senderId !== user.id) {
        playNotificationSound('message');
      }
    });

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      // Handle typing indicators in UI
      console.log(`${data.username} is ${data.isTyping ? 'typing' : 'not typing'}`);
    });

    // Listen for user status changes
    socketService.onUserStatusChanged((data) => {
      updateContact(data.userId, { status: normalizeContactStatus(data.status) });
    });

    // Listen for messages loaded
    socketService.onMessagesLoaded((data) => {
      const chatId = data.userId1 === user.id ? data.userId2 : data.userId1;
      setMessages(chatId, data.messages);
    });

    // Listen for group messages loaded
    socketService.onGroupMessagesLoaded((data) => {
      setGroupMessages(data.groupId, data.messages);
    });

    // Listen for reaction updates
    socketService.onReactionUpdated((data) => {
      setMessageReactions(data.messageId, data.reactions);
    });
  }, [
    user, 
    setChats, 
    setGroups, 
    addMessage, 
    addGroupMessage, 
    setMessages, 
    setGroupMessages,
    setMessageReactions, 
    setContacts, 
    updateContact, 
    playNotificationSound
  ]);

  useEffect(() => {
    if (user && socketService.isConnected()) {
      // Get initial data
      socketService.getOnlineUsers();
      socketService.getChats();
      socketService.getGroups();
      
      setupSocketListeners();
    }
  }, [user, setupSocketListeners]);
};
