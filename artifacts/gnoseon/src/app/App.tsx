import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatView } from './components/ChatView';
import { GroupChatView } from './components/GroupChatView';
import { InfoPanel } from './components/InfoPanel';
import { ContactsView } from './components/ContactsView';
import { SettingsView } from './components/SettingsView';
import { GroupChat } from './components/GroupChat';
import { GroupManagement } from './components/GroupManagement';
import { CreateGroup } from './components/CreateGroup';
import { StatusBar } from './components/StatusBar';
import { LoginForm } from './components/LoginForm';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import { useContactsStore } from './stores/contactsStore';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useEncryption } from './hooks/useEncryption';
import { useSocketHandlers } from './hooks/useSocketHandlers';
import { useChatHandlers } from './hooks/useChatHandlers';
import { Chat, Group } from './types';
import { Menu, X } from 'lucide-react';
import gnoseonRobot from '@/assets/Kepala-Robot-Gnoseon.png';
import { SharedFile } from './components/FileSharing';

function AppContent() {
  const { user, logout } = useAuthStore();
  const { requestPermission } = useNotifications();
  const { theme } = useTheme();
  const { 
    encryptionEnabled, 
    toggleEncryption
  } = useEncryption();
  
  // Use new hooks
  useSocketHandlers();
  const {
    handleSendMessage,
    handleSendGroupMessage,
    handleSelectChat,
    handleSelectGroup,
    handleStartChatFromContacts,
    handleCreateGroup,
    handleAddMember
  } = useChatHandlers();

  const [activeTab, setActiveTab] = React.useState<'home' | 'contacts' | 'settings' | 'groups'>('home');
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showGroupManagement, setShowGroupManagement] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showInfoPanel, setShowInfoPanel] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [sharedFiles] = React.useState<SharedFile[]>([]);
  
  // Zustand stores
  const { 
    chats, 
    groups, 
    selectedChatId, 
    selectedGroupId, 
    messages, 
    groupMessages, 
    botMessages, 
    isBotTyping
  } = useChatStore();
  
  const { contacts } = useContactsStore();
  
  const selectedChat = selectedChatId === 'gnoseon-bot' ? {
  id: 'gnoseon-bot',
  contactId: 'gnoseon-bot',
  lastMessage: botMessages[botMessages.length - 1]?.text || 'Start a conversation with Gnoseon Bot',
  lastMessageTime: 'Now',
  unreadCount: 0,
  messages: [],
  type: 'private' as const
} : chats.find((c: Chat) => c.id === selectedChatId);

  const selectedContact = selectedChatId === 'gnoseon-bot' ? {
    id: 'gnoseon-bot',
    name: 'Gnoseon Bot',
    avatar: gnoseonRobot,
    status: 'online' as const,
    username: '@gnoseon-bot',
    bio: 'AI Assistant untuk membantu Anda memahami fitur aplikasi Gnoseon'
  } : (selectedChat ? contacts.find((c: any) => c.id === selectedChat.contactId) : null);
  
  const selectedGroup = groups.find((g: Group) => g.id === selectedGroupId);
  
  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user]);

  // Initialize auth on mount
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  // Simplified handlers for UI
  const handleSendMessageWrapper = (text: string) => {
    handleSendMessage(text);
  };

  const handleSelectChatWrapper = (chatId: string) => {
    handleSelectChat(chatId, () => {
      setShowSidebar(false);
      setActiveTab('home');
    });
  };
  
  const handleSelectGroupWrapper = (groupId: string) => {
    handleSelectGroup(groupId, () => {
      setShowSidebar(false);
    });
  };

  const handleStartChatFromContactsWrapper = (contactId: string) => {
    handleStartChatFromContacts(contactId, () => {
      setActiveTab('home');
      setShowSidebar(false);
    });
  };

  const handleManageGroup = () => {
    // Note: selectedGroupId should already be set by handleSelectGroup
    setShowGroupManagement(true);
  };

  const handleUpdateGroup = (_groupId: string, _updates: Partial<Group>) => {
    // In a full implementation, this would update group on server
    console.log('Update group:', _groupId, _updates);
  };

  const handleRemoveMember = (_groupId: string, _contactId: string) => {
    // In a full implementation, this would remove member on server
    console.log('Remove member:', _groupId, _contactId);
  };

  const handlePromoteToAdmin = (_groupId: string, _contactId: string) => {
    // In a full implementation, this would promote member on server
    console.log('Promote to admin:', _groupId, _contactId);
  };

  const handleReportMessage = (messageId: string, reason: string) => {
    // In a full implementation, this would report message on server
    console.log('Report message:', messageId, reason);
  };

  const handleSendFile = async (_files: FileList) => {
    // In a full implementation, you'd upload files to a server
    console.log('Send files:', _files);
  };

  const handleDownloadFile = (_file: SharedFile) => {
    // In a full implementation, this would download from server
    console.log('Download file:', _file);
  };

  const handleDeleteFile = (fileId: string) => {
    // In a full implementation, this would delete from server
    console.log('Delete file:', fileId);
  };

  const handleClearHistory = () => {
    // In a full implementation, this would clear chat history on server
    console.log('Clear chat history');
  };

  const handleExportHistory = () => {
    // In a full implementation, this would export chat history from server
    console.log('Export chat history');
  };

  const handleBlockUser = () => {
    // In a full implementation, this would block user on server
    console.log('Block user');
  };

  const handleDeleteMessage = (messageId: string) => {
    // In a full implementation, this would delete message on server
    console.log('Delete message:', messageId);
  };
  
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#e6e9f0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#e6e9f0]'}`} style={{ fontFamily: 'var(--font-mono)' }}>
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user}
        onLogout={logout}
      />
    
    {activeTab === 'home' && (
      <div className="flex-1 flex overflow-hidden relative p-4 gap-4">
        {/* Mobile Menu Button */}
        {!showSidebar && selectedChatId && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed bottom-4 left-4 z-40 lg:hidden p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        
        {/* Chat Sidebar */}
        <div className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 fixed lg:relative h-full z-30 w-full sm:w-80 lg:w-80 top-0 left-0`}
        style={{ height: 'calc(100vh - 120px)' }}>
          <div className="lg:hidden absolute top-4 right-4 z-50">
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="h-full neu-flat rounded-lg p-4">
            <ChatSidebar
              contacts={contacts}
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChatWrapper}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
        
        {/* Overlay for mobile */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Chat View */}
        <div className="flex-1 min-w-0 neu-flat rounded-lg p-4">
          <ChatView
            contact={selectedContact || null}
            messages={selectedChatId === 'gnoseon-bot' ? botMessages : (messages[selectedChat?.contactId || ''] || [])}
            onSendMessage={handleSendMessageWrapper}
            onShowInfo={() => setShowInfoPanel(true)}
            onDeleteMessage={handleDeleteMessage}
            onReportMessage={handleReportMessage}
            onSendFile={handleSendFile}
            onDownloadFile={handleDownloadFile}
            onDeleteFile={handleDeleteFile}
            sharedFiles={sharedFiles}
            currentUserId={user.id}
            encryptionEnabled={encryptionEnabled}
            onToggleEncryption={toggleEncryption}
            isEncryptedChat={selectedChat?.type === 'private' && encryptionEnabled}
            isBotChat={selectedChatId === 'gnoseon-bot'}
            isBotTyping={isBotTyping}
          />
        </div>
        
        {/* Info Panel */}
        <div className={`${
          showInfoPanel ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 fixed lg:relative h-full z-30 w-full sm:w-80 lg:w-80 top-0 right-0 ${
          !showInfoPanel ? 'lg:flex hidden' : 'flex'
        }`}
        style={{ height: 'calc(100vh - 120px)' }}>
          <div className="h-full neu-flat rounded-lg p-4">
            <InfoPanel
              contact={selectedContact || null}
              sharedFiles={sharedFiles}
              onClose={() => setShowInfoPanel(false)}
              onClearHistory={handleClearHistory}
              onExportHistory={handleExportHistory}
              onBlockUser={handleBlockUser}
            />
          </div>
        </div>
        
        {/* Info Panel Overlay for mobile */}
        {showInfoPanel && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setShowInfoPanel(false)}
          />
        )}
      </div>
    )}
    
    {activeTab === 'groups' && (
      <div className="flex-1 flex overflow-hidden relative p-4 gap-4">
        {/* Group Sidebar */}
        <div className="h-full neu-flat rounded-lg p-4 w-full sm:w-80 lg:w-80">
          <GroupChat
            groups={groups}
            onSelectGroup={handleSelectGroupWrapper}
            onManageGroup={handleManageGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
        </div>
        
        {/* Group Chat View or Management */}
        <div className="flex-1 min-w-0 neu-flat rounded-lg p-4">
          {showGroupManagement && selectedGroupId && selectedGroup ? (
            <GroupManagement
              group={selectedGroup}
              contacts={contacts}
              onClose={() => setShowGroupManagement(false)}
              onUpdateGroup={handleUpdateGroup}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onPromoteToAdmin={handlePromoteToAdmin}
            />
          ) : selectedGroupId && selectedGroup ? (
            <GroupChatView
              group={selectedGroup}
              messages={groupMessages[selectedGroupId] || []}
              onSendMessage={(text) => handleSendGroupMessage(selectedGroupId, text)}
              onShowInfo={() => setShowInfoPanel(true)}
              onDeleteMessage={handleDeleteMessage}
              onReportMessage={handleReportMessage}
              onSendFile={handleSendFile}
              onDownloadFile={handleDownloadFile}
              onDeleteFile={handleDeleteFile}
              sharedFiles={sharedFiles}
              currentUserId={user.id}
              onShowGroupInfo={() => setShowInfoPanel(true)}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Select a group or create a new one</p>
            </div>
          )}
        </div>
        
        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md neu-flat rounded-lg p-4">
              <CreateGroup
                contacts={contacts}
                onClose={() => setShowCreateGroup(false)}
                onCreateGroup={handleCreateGroup}
              />
            </div>
          </div>
        )}
      </div>
    )}
    
    {activeTab === 'contacts' && (
      <ContactsView 
        contacts={contacts} 
        onStartChat={handleStartChatFromContactsWrapper}
      />
    )}
    
    {activeTab === 'settings' && (
      <SettingsView user={user} />
    )}
    
    <StatusBar />
  </div>
  );
}

export default function App() {
  return <AppContent />;
}
