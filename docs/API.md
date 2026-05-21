# Gnōseōn API Documentation

This document provides detailed information about the Gnōseōn application's internal APIs, database operations, and component interfaces.

## 📚 Table of Contents

- [Database API](#database-api)
- [Component APIs](#component-apis)
- [Hook APIs](#hook-apis)
- [Utility APIs](#utility-apis)
- [Type Definitions](#type-definitions)

## 🗄 Database API

### Database Initialization

```typescript
// Initialize database
import { getDatabase } from '../database';

const db = await getDatabase();
```

### User Management

#### `createUser(userData)`

Creates a new user with encrypted password.

```typescript
interface UserData {
  displayName: string;
  email: string;
  password: string;
  avatar?: string;
}

const user = db.createUser(userData);
```

#### `authenticateUser(email, password)`

Authenticates user credentials.

```typescript
const user = db.authenticateUser(email, password);
```

#### `getAllUsers()`

Returns all users in the database.

```typescript
const users = db.getAllUsers();
```

#### `updateUser(userId, updates)`

Updates user information.

```typescript
const updatedUser = db.updateUser(userId, {
  displayName: 'New Name',
  avatar: 'new-avatar.png'
});
```

#### `deleteUser(userId)`

Deletes a user and all associated data.

```typescript
const success = db.deleteUser(userId);
```

### Message Management

#### `createMessage(senderId, recipientId, text, groupId?, type?, expiresAt?, isEncrypted?)`

Creates a new message.

```typescript
const message = db.createMessage(
  'user1',
  'user2',
  'Hello, world!',
  undefined, // groupId
  'text',    // type
  undefined, // expiresAt
  false      // isEncrypted
);
```

#### `getMessagesBetweenUsers(userId1, userId2)`

Retrieves messages between two users.

```typescript
const messages = db.getMessagesBetweenUsers('user1', 'user2');
```

#### `deleteMessage(messageId)`

Deletes a specific message.

```typescript
const success = db.deleteMessage('message123');
```

#### `markMessagesAsRead(senderId, recipientId)`

Marks messages as read.

```typescript
const success = db.markMessagesAsRead('user1', 'user2');
```

#### `cleanupExpiredMessages()`

Removes expired messages.

```typescript
const deletedCount = db.cleanupExpiredMessages();
```

### Group Management

#### `createGroup(name, description, createdBy)`

Creates a new group.

```typescript
const group = db.createGroup(
  'Group Name',
  'Group Description',
  'creator123'
);
```

#### `addGroupMember(groupId, userId, addedBy, role)`

Adds a member to a group.

```typescript
const success = db.addGroupMember(
  'group123',
  'user456',
  'admin789',
  'member'
);
```

#### `removeGroupMember(groupId, userId)`

Removes a member from a group.

```typescript
const success = db.removeGroupMember('group123', 'user456');
```

#### `getGroupsForUser(userId)`

Gets all groups for a user.

```typescript
const groups = db.getGroupsForUser('user123');
```

#### `updateGroupSettings(groupId, settings)`

Updates group settings.

```typescript
const success = db.updateGroupSettings('group123', {
  allowInvites: false,
  messageRetention: 30
});
```

### File Management

#### `saveSharedFile(messageId, fileName, fileSize, fileType, filePath)`

Saves file information.

```typescript
const file = db.saveSharedFile(
  'message123',
  'document.pdf',
  1024000,
  'application/pdf',
  '/files/document.pdf'
);
```

#### `getSharedFilesForUsers(userId1, userId2)`

Gets shared files between users.

```typescript
const files = db.getSharedFilesForUsers('user1', 'user2');
```

#### `deleteSharedFile(fileId)`

Deletes a shared file.

```typescript
const success = db.deleteSharedFile('file123');
```

### User Relationships

#### `blockUser(blockerId, blockedId, reason)`

Blocks a user.

```typescript
const success = db.blockUser('user1', 'user2', 'Spam');
```

#### `unblockUser(blockerId, blockedId)`

Unblocks a user.

```typescript
const success = db.unblockUser('user1', 'user2');
```

#### `isUserBlocked(userId1, userId2)`

Checks if a user is blocked.

```typescript
const isBlocked = db.isUserBlocked('user1', 'user2');
```

### Chat Management

#### `getChatsForUser(userId)`

Gets all chats for a user.

```typescript
const chats = db.getChatsForUser('user123');
```

#### `getChatForUsers(userId1, userId2)`

Gets chat between two users.

```typescript
const chat = db.getChatForUsers('user1', 'user2');
```

#### `clearChatHistory(userId1, userId2)`

Clears chat history.

```typescript
const success = db.clearChatHistory('user1', 'user2');
```

#### `exportChatHistory(userId1, userId2)`

Exports chat history.

```typescript
const history = db.exportChatHistory('user1', 'user2');
```

### Reporting

#### `reportMessage(messageId, reporterId, reason)`

Reports a message.

```typescript
const success = db.reportMessage('msg123', 'user456', 'Inappropriate content');
```

#### `getReportedMessages()`

Gets all reported messages.

```typescript
const reports = db.getReportedMessages();
```

## 🧩 Component APIs

### Header Component

```typescript
interface HeaderProps {
  activeTab: 'home' | 'contacts' | 'settings' | 'groups';
  onTabChange: (tab: string) => void;
  user: User;
  onLogout: () => void;
}
```

### ChatSidebar Component

```typescript
interface ChatSidebarProps {
  contacts: Contact[];
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
```

### ChatView Component

```typescript
interface ChatViewProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string, expiresIn?: number) => void;
  onShowInfo: () => void;
  onDeleteMessage: (messageId: string) => void;
  onReportMessage: (messageId: string, reason: string) => void;
  onSendFile: (files: FileList) => void;
  onDownloadFile: (file: SharedFile) => void;
  onDeleteFile: (fileId: string) => void;
  sharedFiles: SharedFile[];
  currentUserId: string;
  encryptionEnabled: boolean;
  onToggleEncryption: () => void;
  isEncryptedChat: boolean;
}
```

### ContactsView Component

```typescript
interface ContactsViewProps {
  contacts: Contact[];
  onStartChat: (contactId: string) => void;
}
```

### SettingsView Component

```typescript
interface SettingsViewProps {
  user: User;
}
```

### GroupChat Component

```typescript
interface GroupChatProps {
  group: Group;
  onSelectGroup: (groupId: string) => void;
  onManageGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}
```

## 🪝 Hook APIs

### useAuth Hook

```typescript
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: UserData) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
}

const { user, login, logout, register, updateUser } = useAuth();
```

### useTheme Hook

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const { theme, toggleTheme, setTheme } = useTheme();
```

### useNotifications Hook

```typescript
interface NotificationContextValue {
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, body: string) => void;
  permission: NotificationPermission;
}

const { requestPermission, showNotification, permission } = useNotifications();
```

### useSoundNotifications Hook

```typescript
interface SoundNotificationContextValue {
  playNotificationSound: (type: 'message' | 'file' | 'system') => void;
  enableSoundNotifications: boolean;
  toggleSoundNotifications: () => void;
}

const { playNotificationSound, enableSoundNotifications, toggleSoundNotifications } = useSoundNotifications();
```

### useEncryption Hook

```typescript
interface EncryptionContextValue {
  encryptionEnabled: boolean;
  encryptMessage: (message: string, publicKey: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string, privateKey: string) => Promise<string>;
  toggleEncryption: () => void;
  generateKeyPair: () => { publicKey: string; privateKey: string };
  storeUserKey: (userId: string, keyPair: KeyPair) => void;
  getUserKey: (userId: string) => KeyPair | null;
}

const {
  encryptionEnabled,
  encryptMessage,
  decryptMessage,
  toggleEncryption,
  generateKeyPair,
  storeUserKey,
  getUserKey
} = useEncryption();
```

## 🔧 Utility APIs

### Validation Utilities

```typescript
// Email validation
const isValidEmail = validateEmail('user@example.com');

// Password strength validation
const passwordStrength = validatePassword('Password123!');

// Input sanitization
const sanitizedInput = sanitizeInput('<script>alert("xss")</script>');
```

### File Utilities

```typescript
// File size validation
const isValidSize = validateFileSize(file, 10 * 1024 * 1024); // 10MB

// File type validation
const isValidType = validateFileType(file, ['image/*', 'application/pdf']);

// File format validation
const fileFormat = getFileFormat(file);
```

### Date Utilities

```typescript
// Format timestamp
const formattedTime = formatTimestamp(new Date());

// Calculate relative time
const relativeTime = getRelativeTime(new Date('2023-01-01'));

// Check if message is expired
const isExpired = isMessageExpired(message.expiresAt);
```

## 📝 Type Definitions

### User Types

```typescript
interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}
```

### Message Types

```typescript
interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  expiresAt?: Date;
  isEncrypted: boolean;
  groupId?: string;
  isRead: boolean;
}
```

### Chat Types

```typescript
interface Chat {
  id: string;
  contactId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  type: 'private' | 'group';
  groupId?: string;
}
```

### Group Types

```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
  role: 'admin' | 'member';
  settings: GroupSettings;
  members: GroupMember[];
}

interface GroupSettings {
  allowInvites: boolean;
  messageRetention: number; // days
  requireApproval: boolean;
  maxMembers: number;
}

interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  addedBy: string;
}
```

### Contact Types

```typescript
interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  isBlocked: boolean;
}
```

### File Types

```typescript
interface SharedFile {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: string;
}
```

## 🔐 Security Considerations

### Input Validation

All user inputs should be validated before processing:

```typescript
// Sanitize user input
const sanitizedText = sanitizeInput(userInput);

// Validate email format
if (!validateEmail(email)) {
  throw new Error('Invalid email format');
}

// Validate password strength
if (validatePassword(password).strength < 3) {
  throw new Error('Password too weak');
}
```

### Encryption

Sensitive data should be encrypted:

```typescript
// Encrypt messages
if (encryptionEnabled) {
  const encryptedText = await encryptMessage(message, recipientPublicKey);
  db.createMessage(senderId, recipientId, encryptedText, undefined, 'text', undefined, true);
}
```

### Authentication

Always verify user authentication:

```typescript
// Check user authentication
if (!user) {
  throw new Error('User not authenticated');
}

// Verify permissions
if (!hasPermission(user, 'admin')) {
  throw new Error('Insufficient permissions');
}
```

## 🚀 Error Handling

### Database Errors

```typescript
try {
  const message = db.createMessage(senderId, recipientId, text);
  return message;
} catch (error) {
  console.error('Failed to create message:', error);
  throw new Error('Message creation failed');
}
```

### Network Errors

```typescript
try {
  const response = await fetch('/api/messages', options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
} catch (error) {
  console.error('Network error:', error);
  throw new Error('Network request failed');
}
```

### Validation Errors

```typescript
if (!validateInput(input)) {
  throw new ValidationError('Invalid input format');
}
```

## 📊 Performance Considerations

### Database Optimization

- Use transactions for multiple operations
- Implement proper indexing
- Use prepared statements for queries
- Cache frequently accessed data

### Component Optimization

- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load components when possible
- Use useCallback and useMemo hooks

### Memory Management

- Clean up expired messages regularly
- Dispose of blob URLs after use
- Implement proper component cleanup
- Monitor memory usage

---

This API documentation will be updated as the application evolves. For the most current information, always refer to the source code and inline documentation.
