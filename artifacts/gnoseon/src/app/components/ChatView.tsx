import { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import { Contact, Message } from '../types';
import { MessageSearch } from './MessageSearch';
import { InputValidator } from '../../utils/security';
import { ChatHeader } from './ChatHeader';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { EmptyChat } from './EmptyChat';
import { SharedFile } from './FileSharing';

interface ChatViewProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (text: string, expiresIn?: number) => void;
  onShowInfo?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  onSendFile?: (files: FileList) => void;
  onDownloadFile?: (file: SharedFile) => void;
  onDeleteFile?: (fileId: string) => void;
  sharedFiles?: SharedFile[];
  currentUserId?: string;
  encryptionEnabled?: boolean;
  onToggleEncryption?: () => void;
  isEncryptedChat?: boolean;
  isBotChat?: boolean;
  isBotTyping?: boolean;
}

export function ChatView({ 
  contact, 
  messages, 
  onSendMessage, 
  onShowInfo, 
  onDeleteMessage, 
  onReportMessage,
  onSendFile,
  onDownloadFile,
  onDeleteFile,
  sharedFiles = [],
  currentUserId,
  encryptionEnabled = false,
  onToggleEncryption,
  isBotChat = false,
  isBotTyping = false
}: ChatViewProps) {
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [expiredMessages, setExpiredMessages] = useState<Set<string>>(new Set());
  
  // Client-side cleanup of expired messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newExpiredMessages = new Set<string>();
      
      messages.forEach((message) => {
        if (message.expiresAt && new Date(message.expiresAt) <= now) {
          newExpiredMessages.add(message.id);
        }
      });
      
      if (newExpiredMessages.size > 0) {
        setExpiredMessages(prev => {
          const combined = new Set(prev);
          newExpiredMessages.forEach(id => combined.add(id));
          return combined;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [messages]);
  
  const handleSend = (text: string, expiresIn?: number) => {
    try {
      // Validate and sanitize message
      const validation = InputValidator.validateMessage(text);
      if (!validation.valid) {
        console.error('Message validation failed:', validation.error);
        return;
      }
      
      // Use sanitized message
      const sanitizedMessage = validation.sanitized || text;
      onSendMessage(sanitizedMessage, expiresIn);
    } catch (error) {
      console.error('Error in handleSend:', error);
    }
  };

  const handleReport = (messageId: string) => {
    if (onReportMessage && reportReason.trim()) {
      onReportMessage(messageId, reportReason);
      setShowReportDialog(null);
      setReportReason('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntilExpiration = (expiresAt: Date) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000));
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  if (!contact) {
    return <EmptyChat />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#e6e9f0] relative" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Header */}
      <ChatHeader 
        contact={contact}
        encryptionEnabled={encryptionEnabled}
        onToggleEncryption={isBotChat ? undefined : onToggleEncryption}
        onShowMessageSearch={() => setShowMessageSearch(true)}
        onShowInfo={onShowInfo}
      />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 relative message-container">
        {/* Message Search Overlay */}
        {showMessageSearch && (
          <div className="absolute inset-0 bg-[#e6e9f0] z-10 neu-flat rounded-xl m-2 md:m-4 p-2 md:p-4 mobile-only">
            <MessageSearch
              currentUserId={currentUserId || ''}
              onClose={() => setShowMessageSearch(false)}
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-2 md:space-y-4">
          {messages.filter(message => !expiredMessages.has(message.id)).map((message) => (
            <MessageItem 
              key={message.id}
              message={message}
              isMe={currentUserId === message.senderId}
              onReportMessage={setShowReportDialog}
              onDeleteMessage={onDeleteMessage}
              formatTime={formatTime}
              getTimeUntilExpiration={getTimeUntilExpiration}
              currentUserId={currentUserId}
            />
          ))}
          
          {isBotTyping && (
            <div className="flex justify-start">
              <div className="neu-flat-green p-3 rounded-xl">
                <p className="text-xs text-green-700 animate-pulse">Gnoseon Bot is thinking...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Message Input */}
      <ChatInput 
        onSendMessage={handleSend}
        onSendFile={onSendFile}
        onDownloadFile={onDownloadFile}
        onDeleteFile={onDeleteFile}
        sharedFiles={sharedFiles}
      />
      
      {/* Report Message Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md neu-flat rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" />
              Report Message
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reporting
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please explain why you're reporting this message..."
                rows={3}
                className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportDialog(null);
                  setReportReason('');
                }}
                className="flex-1 neu-button px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReport(showReportDialog)}
                disabled={!reportReason.trim()}
                className="flex-1 neu-raised-red px-4 py-2 rounded-lg text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
