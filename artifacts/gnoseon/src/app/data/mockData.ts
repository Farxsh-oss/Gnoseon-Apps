import { Contact, Chat, SharedFile } from "../types";

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Alex",
    avatar: "👨‍💻",
    status: "online",
    username: "@alex_chat",
    memberSince: "Jan 2021",
  },
  {
    id: "2",
    name: "CryptoBot",
    avatar: "🤖",
    status: "online",
    username: "@crypto_bot",
    memberSince: "Mar 2020",
  },
  {
    id: "3",
    name: "Lina",
    avatar: "👩‍🎨",
    status: "online",
    username: "@lina_design",
    memberSince: "Jun 2021",
  },
];

export const chats: Chat[] = [
  {
    id: "1",
    contactId: "1",
    lastMessage: "Hey, are you free?",
    lastMessageTime: "2:15 PM",
    unreadCount: 0,
    type: "private",
    messages: [
      {
        id: "m1",
        senderId: "1",
        text: "Hey, check out the latest update!",
        timestamp: new Date("2024-03-15T14:13:00"),
      },
      {
        id: "m2",
        senderId: "1",
        text: "Update v2.3",
        timestamp: new Date("2024-03-15T14:13:30"),
        type: "image",
        imageUrl: "update-image",
      },
      {
        id: "m3",
        senderId: "me",
        text: "Looks great! 🚀",
        timestamp: new Date("2024-03-15T14:15:00"),
      },
      {
        id: "m4",
        senderId: "me",
        text: "Testing it now...",
        timestamp: new Date("2024-03-15T14:16:00"),
      },
      {
        id: "m5",
        senderId: "1",
        text: "New features are awesome!",
        timestamp: new Date("2024-03-15T14:14:00"),
      },
    ],
  },
  {
    id: "2",
    contactId: "2",
    lastMessage: "Thanks for the help!",
    lastMessageTime: "1:30 PM",
    unreadCount: 0,
    type: "private",
    messages: [
      {
        id: "m6",
        senderId: "2",
        text: "Here are the latest crypto updates for today!",
        timestamp: new Date("2024-03-15T13:48:00"),
      },
    ],
  },
  {
    id: "3",
    contactId: "3",
    lastMessage: "See you tomorrow!",
    lastMessageTime: "12:45 PM",
    unreadCount: 0,
    type: "private",
    messages: [
      {
        id: "m7",
        senderId: "3",
        text: "Let's meet at 5?",
        timestamp: new Date("2024-03-15T12:30:00"),
      },
    ],
  },
];

export const sharedFiles: SharedFile[] = [
  {
    id: "1",
    name: "update_notes.txt",
    type: "document",
  },
  {
    id: "2",
    name: "screenshot_23.png",
    type: "image",
  },
];