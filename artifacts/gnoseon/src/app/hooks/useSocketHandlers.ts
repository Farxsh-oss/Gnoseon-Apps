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

    // Remove all existing listeners first to avoid duplicates on reconnect
    socketService.off('online_users');
    socketService.off('chats_updated');
    socketService.off('groups_updated');
    socketService.off('new_message');
    socketService.off('new_group_message');
    socketService.off('user_typing');
    socketService.off('user_status_changed');
    socketService.off('messages_loaded');
    socketService.off('group_messages_loaded');
    socketService.off('group_messages_updated');
    socketService.off('reaction_updated');

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
      // Add contactId to each chat (the other user's id)
      const chatsWithContactId = updatedChats.map((chat: any) => ({
        ...chat,
        contactId: chat.userId1 === user.id ? chat.userId2 : chat.userId1
      }));
      if (state.selectedChatId?.startsWith('temp-')) {
        const tempChat = state.chats.find((c: any) => c.id === state.selectedChatId);
        if (tempChat) {
          const realChat = chatsWithContactId.find((c: any) => c.contactId === tempChat.contactId);
          if (realChat) {
            // Found a real chat — switch to it
            state.setSelectedChatId(realChat.id);
            setChats(chatsWithContactId);
          } else {
            // No real chat yet — keep the temp chat in the list
            const withoutTemp = chatsWithContactId.filter((c: any) => c.contactId !== tempChat.contactId);
            setChats([...withoutTemp, tempChat]);
          }
          return;
        }
      }
      setChats(chatsWithContactId);
    });

    // Listen for groups updates
    socketService.onGroupsUpdated((updatedGroups) => {
      setGroups(updatedGroups);
    });

    // Listen for new messages
    socketService.onNewMessage((message) => {
      if (message.receiverId === user.id || message.senderId === user.id) {
        const chatId = message.receiverId === user.id ? message.senderId : message.receiverId;
        addMessage(chatId, message);
        
        if (message.receiverId === user.id) {
          playNotificationSound('message');
        }
      }
    });

    // Listen for new group messages
    socketService.onNewGroupMessage((message) => {
      addGroupMessage(message.groupId, message);
      
      if (message.senderId !== user.id) {
        playNotificationSound('message');
      }
    });

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
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

    // Listen for group messages updated (after a new message is sent)
    socketService.onGroupMessagesUpdated((data) => {
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

  const fetchInitialData = useCallback(() => {
    if (!user || !socketService.isConnected()) return;
    socketService.getOnlineUsers();
    socketService.getChats();
    socketService.getGroups();
  }, [user]);

  useEffect(() => {
    if (!user || !socketService.isConnected()) return;

    fetchInitialData();
    setupSocketListeners();

    // Re-fetch data and re-setup listeners on every reconnect
    socketService.onConnect(() => {
      fetchInitialData();
      setupSocketListeners();
    });

    return () => {
      socketService.off('connect');
    };
  }, [user, fetchInitialData, setupSocketListeners]);
};
