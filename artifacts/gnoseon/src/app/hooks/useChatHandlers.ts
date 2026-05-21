import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useSoundNotifications } from './useSoundNotifications';
import socketService from '../../services/socketService';
import { lmStudioService } from '../../services/lmStudioService';
import { Chat } from '../types';

export const useChatHandlers = () => {
  const { user } = useAuthStore();
  const { 
    chats, 
    selectedChatId, 
    setChats,
    setSelectedChatId,
    setSelectedGroupId,
    addBotMessage,
    setIsBotTyping
  } = useChatStore();
  const { playNotificationSound } = useSoundNotifications();

  const handleSendMessage = useCallback(async (text: string, expiresIn?: number) => {
    if (!selectedChatId || !user) return;
    
    // Check if this is Gnoseon Bot
    if (selectedChatId === 'gnoseon-bot') {
      const userMessage = {
        id: `bot-msg-${Date.now()}`,
        senderId: user.id,
        text,
        timestamp: new Date(),
        type: 'text' as const
      };
      
      addBotMessage(userMessage);
      setIsBotTyping(true);
      
      try {
        const botResponse = await lmStudioService.sendMessage('gnoseon-bot', text);
        const botMessage = {
          id: `bot-response-${Date.now()}`,
          senderId: 'gnoseon-bot',
          text: botResponse,
          timestamp: new Date(),
          type: 'text' as const
        };
        addBotMessage(botMessage);
        playNotificationSound('message');
      } catch (error) {
        console.error('Bot error:', error);
        addBotMessage({
          id: `bot-error-${Date.now()}`,
          senderId: 'gnoseon-bot',
          text: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
          timestamp: new Date(),
          type: 'text' as const
        });
      } finally {
        setIsBotTyping(false);
      }
      return;
    }
    
    const selectedChat = chats.find((c: Chat) => c.id === selectedChatId);
    if (!selectedChat) return;
    
    socketService.sendMessage(selectedChat.contactId!, text, expiresIn);
  }, [selectedChatId, user, addBotMessage, setIsBotTyping, chats, playNotificationSound]);

  const handleSendGroupMessage = useCallback(async (groupId: string, text: string, expiresIn?: number) => {
    if (!groupId || !user) return;
    socketService.sendGroupMessage(groupId, text, expiresIn);
  }, [user]);

  const handleSelectChat = useCallback((chatId: string, callback?: () => void) => {
    setSelectedChatId(chatId);
    if (callback) callback();
    
    const selectedChat = chats.find((c: Chat) => c.id === chatId);
    if (selectedChat && user) {
      socketService.markMessagesRead(selectedChat.contactId!);
      socketService.getMessages(user.id, selectedChat.contactId!);
    }
  }, [chats, user, setSelectedChatId]);

  const handleSelectGroup = useCallback((groupId: string, callback?: () => void) => {
    setSelectedGroupId(groupId);
    setSelectedChatId(null);
    if (callback) callback();
    socketService.joinGroup(groupId);
    socketService.getGroupMessages(groupId);
  }, [setSelectedGroupId, setSelectedChatId]);

  const handleStartChatFromContacts = useCallback((contactId: string, onNavigate?: () => void) => {
    if (!user) return;
    
    if (contactId === 'gnoseon-bot') {
      setSelectedChatId('gnoseon-bot');
      if (onNavigate) onNavigate();
      return;
    }
    
    const existingChat = chats.find((c: Chat) => c.contactId === contactId);
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      socketService.getMessages(user.id, contactId);
    } else {
      const newChat: Chat = {
        id: `temp-${Date.now()}`,
        contactId,
        lastMessage: 'Start a conversation',
        lastMessageTime: 'Now',
        unreadCount: 0,
        messages: [],
        type: 'private'
      };
      setChats([...chats, newChat]);
      setSelectedChatId(newChat.id);
    }
    if (onNavigate) onNavigate();
  }, [user, chats, setSelectedChatId, setChats]);

  const handleCreateGroup = useCallback((name: string, description: string, memberIds: string[]) => {
    if (!user) return;
    socketService.createGroup(name, description, memberIds);
  }, [user]);

  const handleAddMember = useCallback((groupId: string, contactId: string) => {
    if (!user) return;
    socketService.addGroupMember(groupId, contactId);
  }, [user]);

  return {
    handleSendMessage,
    handleSendGroupMessage,
    handleSelectChat,
    handleSelectGroup,
    handleStartChatFromContacts,
    handleCreateGroup,
    handleAddMember
  };
};
