import { create } from 'zustand';
import { Chat, Message, Group } from '../types';

interface ChatState {
  chats: Chat[];
  groups: Group[];
  selectedChatId: string | null;
  selectedGroupId: string | null;
  messages: { [chatId: string]: Message[] };
  groupMessages: { [groupId: string]: Message[] };
  botMessages: Message[];
  isBotTyping: boolean;
  setChats: (chats: Chat[]) => void;
  setGroups: (groups: Group[]) => void;
  setSelectedChatId: (chatId: string | null) => void;
  setSelectedGroupId: (groupId: string | null) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  setGroupMessages: (groupId: string, messages: Message[]) => void;
  addGroupMessage: (groupId: string, message: Message) => void;
  setBotMessages: (messages: Message[]) => void;
  addBotMessage: (message: Message) => void;
  setIsBotTyping: (isTyping: boolean) => void;
  setMessageReactions: (messageId: string, reactions: { [emoji: string]: any[] }) => void;
  clearMessages: (chatId: string) => void;
  clearGroupMessages: (groupId: string) => void;
}

export const useChatStore = create<ChatState>((set: any) => ({
  chats: [],
  groups: [],
  selectedChatId: null,
  selectedGroupId: null,
  messages: {},
  groupMessages: {},
  botMessages: [],
  isBotTyping: false,

  setChats: (chats: Chat[]) => set({ chats }),
  
  setGroups: (groups: Group[]) => set({ groups }),
  
  setSelectedChatId: (chatId: string | null) => set({ selectedChatId: chatId }),
  
  setSelectedGroupId: (groupId: string | null) => set({ selectedGroupId: groupId }),
  
  setMessages: (chatId: string, messages: Message[]) => 
    set((state: ChatState) => ({
      messages: { ...state.messages, [chatId]: messages }
    })),
  
  addMessage: (chatId: string, message: Message) =>
    set((state: ChatState) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message]
      }
    })),
  
  setGroupMessages: (groupId: string, messages: Message[]) =>
    set((state: ChatState) => ({
      groupMessages: { ...state.groupMessages, [groupId]: messages }
    })),
  
  addGroupMessage: (groupId: string, message: Message) =>
    set((state: ChatState) => ({
      groupMessages: {
        ...state.groupMessages,
        [groupId]: [...(state.groupMessages[groupId] || []), message]
      }
    })),
  
  setBotMessages: (messages: Message[]) => set({ botMessages: messages }),
  
  addBotMessage: (message: Message) =>
    set((state: ChatState) => ({
      botMessages: [...state.botMessages, message]
    })),
  
  setIsBotTyping: (isTyping: boolean) => set({ isBotTyping: isTyping }),
  
  setMessageReactions: (messageId: string, reactions: { [emoji: string]: any[] }) =>
    set((state: ChatState) => {
      // Update in private messages
      const newMessages = { ...state.messages };
      Object.keys(newMessages).forEach(chatId => {
        newMessages[chatId] = newMessages[chatId].map(msg => 
          msg.id === messageId ? { ...msg, reactions } : msg
        );
      });

      // Update in group messages
      const newGroupMessages = { ...state.groupMessages };
      Object.keys(newGroupMessages).forEach(groupId => {
        newGroupMessages[groupId] = newGroupMessages[groupId].map(msg => 
          msg.id === messageId ? { ...msg, reactions } : msg
        );
      });

      return { messages: newMessages, groupMessages: newGroupMessages };
    }),
  
  clearMessages: (chatId: string) =>
    set((state: ChatState) => ({
      messages: { ...state.messages, [chatId]: [] }
    })),
  
  clearGroupMessages: (groupId: string) =>
    set((state: ChatState) => ({
      groupMessages: { ...state.groupMessages, [groupId]: [] }
    })),
}));
