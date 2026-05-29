import { useState } from 'react';
import { Phone, Video, Smile, Send, MoreVertical, Trash2, Paperclip, Search, Users, Info, Flag } from 'lucide-react';
import { Group, Message } from '../types';
import { FileSharing, SharedFile } from './FileSharing';
import { MessageSearch } from './MessageSearch';
import { InputValidator } from '../../utils/security';

interface GroupChatViewProps {
  group: Group | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onShowInfo?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  onSendFile?: (files: FileList) => void;
  onDownloadFile?: (file: SharedFile) => void;
  onDeleteFile?: (fileId: string) => void;
  sharedFiles?: SharedFile[];
  currentUserId?: string;
  onShowGroupInfo?: () => void;
}

export function GroupChatView({ 
  group, 
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
  onShowGroupInfo
}: GroupChatViewProps) {
  const [messageText, setMessageText] = useState('');
  const [showFileSharing, setShowFileSharing] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  
  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#e6e9f0]" style={{ fontFamily: 'var(--font-mono)' }}>
        <div className="text-center neu-flat p-12 rounded-2xl mt-20">
          <div className="text-4xl mb-4 text-gray-400">
            ┌─────────┐<br/>
            │ ░░░░░░░ │<br/>
            │ ░░👥░░░ │<br/>
            │ ░░░░░░░ │<br/>
            └─────────┘
          </div>
          <p className="text-gray-500 text-sm mt-4">
            <span className="text-purple-600">$</span> select_group <span className="text-green-600">--start</span>
          </p>
          <p className="text-gray-400 text-xs mt-2">// Choose a group to begin messaging</p>
        </div>
      </div>
    );
  }
  
  const handleSend = () => {
    if (!messageText.trim()) return;
    
    // Validate and sanitize message
    const validation = InputValidator.validateMessage(messageText);
    if (!validation.valid) {
      console.error('Message validation failed:', validation.error);
      return;
    }
    
    // Use sanitized message
    const sanitizedMessage = validation.sanitized || messageText;
    onSendMessage(sanitizedMessage);
    setMessageText('');
  };
  
  const handleReport = (messageId: string) => {
    if (reportReason.trim() && onReportMessage) {
      onReportMessage(messageId, reportReason);
      setShowReportDialog(null);
      setReportReason('');
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const getTimeUntilExpiration = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getSenderName = (senderId: string) => {
    // Check if sender is current user
    if (senderId === currentUserId) {
      return 'You';
    }
    
    // Try to find sender in group members
    const member = group?.members.find(m => m.userId === senderId);
    if (member) {
      return `User_${senderId.slice(0, 8)}`;
    }
    
    // Fallback to formatted ID
    return `User_${senderId.slice(0, 8)}`;
  };
  
  return (
    <div className="flex-1 flex flex-col bg-[#e6e9f0] h-full" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Group Chat Header */}
      <div className="px-3 sm:px-4 py-3 neu-flat">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Group Avatar with ASCII border */}
            <div className="relative neu-raised rounded-lg p-2 overflow-hidden">
              {group.avatar ? (
                <img 
                  src={group.avatar} 
                  alt={group.name}
                  className="w-10 h-10 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold ${group.avatar ? 'hidden' : ''}`}>
                <Users className="w-5 h-5" />
              </div>
            </div>
            
            <div>
              <h2 className="font-bold text-sm sm:text-base text-purple-600 flex items-center gap-2">
                <span className="text-purple-600">►</span> {group.name}
                <span className="text-xs text-gray-500">({group.memberCount} members)</span>
              </h2>
              <p className="text-[10px] text-gray-500">
                <span className="text-green-600">●</span> Group chat • {group.description || 'No description'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all"
              onClick={() => setShowMessageSearch(true)}
              title="Search messages"
            >
              <Search className="w-4 h-4 text-gray-600" />
            </button>
            <button className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all">
              <Phone className="w-4 h-4 text-gray-600" />
            </button>
            <button className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all">
              <Video className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all"
              onClick={onShowGroupInfo}
              title="Group info"
            >
              <Info className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all lg:hidden"
              onClick={onShowInfo}
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* ASCII Divider */}
        <div className="text-[8px] text-gray-400 mt-2 overflow-hidden">
          ═══════════════════════════════════════════════════════════════════════════════
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 relative message-container">
        {/* Message Search Overlay */}
        {showMessageSearch && (
          <div className="absolute inset-0 bg-[#e6e9f0] z-10 neu-flat rounded-xl m-4 p-4 mobile-only">
            <MessageSearch
              currentUserId={currentUserId || ''}
              onClose={() => setShowMessageSearch(false)}
            />
          </div>
        )}
        
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isMe = currentUserId && message.senderId === currentUserId;
            
            return (
              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md message-container ${isMe ? 'order-2' : 'order-1'}`}>
                  {message.type === 'image' ? (
                    <div className={`neu-flat p-4 rounded-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                      {/* ASCII Frame */}
                      <div className="text-[8px] text-gray-400 mb-2">
                        ╔════════════════════════╗
                      </div>
                      
                      <div className="neu-inset p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🔧</div>
                          <div className="text-green-600 font-bold mb-1">Update v2.3</div>
                          <div className="text-xs text-gray-600">System Enhancements</div>
                          <div className="mt-3 h-2 bg-gradient-to-r from-green-500 to-purple-500 rounded-full neu-inset"></div>
                        </div>
                      </div>
                      
                      <div className="text-[8px] text-gray-400 mt-2">
                        ╚════════════════════════╝
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Sender name for group messages (only show for others' messages) */}
                      {!isMe && (
                        <div className="px-2 pb-1">
                          <span className="text-xs text-purple-600 font-medium">
                            {getSenderName(message.senderId)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`${isMe ? 'neu-flat-purple' : 'neu-flat-green'} p-3 rounded-xl relative`}>
                        {/* Message pointer */}
                        <div className={`absolute top-3 ${isMe ? '-right-1' : '-left-1'} text-xs ${
                          isMe ? 'text-purple-400' : 'text-green-400'
                        }`}>
                          {isMe ? '►' : '◄'}
                        </div>
                        
                        <p className={`text-sm ${isMe ? 'text-purple-900' : 'text-green-900'}`}>
                          {message.text}
                        </p>
                        
                        {/* ASCII underline */}
                        <div className="text-[6px] text-gray-400 mt-1">
                          {'─'.repeat(message.text.length > 30 ? 30 : message.text.length)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-2 mt-1 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-500">
                      [{formatTime(message.timestamp)}]
                    </span>
                    {message.expiresAt && (
                      <span className="text-[10px] text-orange-500 flex items-center gap-1">
                        🔥 {getTimeUntilExpiration(message.expiresAt)}
                      </span>
                    )}
                    {!isMe && onReportMessage && (
                      <button
                        onClick={() => setShowReportDialog(message.id)}
                        className="neu-raised p-1 rounded hover:neu-pressed transition-all group touch-target"
                        title="Report message"
                      >
                        <Flag className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                    {isMe && onDeleteMessage && (
                      <button
                        onClick={() => onDeleteMessage(message.id)}
                        className="neu-raised p-1 rounded hover:neu-pressed transition-all group touch-target"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Message Input */}
      <div className="p-4 neu-flat mobile-chat-input">
        <div className="max-w-4xl mx-auto">
          {/* ASCII Top Border */}
          <div className="text-[8px] text-gray-400 mb-2">
            ┌{'─'.repeat(50)}┐
          </div>
          
          <div className="neu-inset rounded-xl p-3">
            <div className="flex items-center gap-2">
              <button className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target">
                <Smile className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="flex-1 flex items-center gap-2">
                <span className="text-purple-600 text-sm">$</span>
                <input
                  type="text"
                  placeholder={`Message ${group.name}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  onTouchEnd={(e) => {
                    if (e.target instanceof HTMLInputElement) {
                      e.target.focus();
                    }
                  }}
                  className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400"
                />
                <span className="text-purple-600 animate-pulse">█</span>
              </div>
              
              <button 
                className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target"
                onClick={() => setShowFileSharing(!showFileSharing)}
              >
                <Paperclip className="w-4 h-4 text-gray-600" />
              </button>
              
              <button 
                onClick={handleSend}
                className="neu-raised-purple p-3 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target"
              >
                <Send className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>
          
          {/* ASCII Bottom Border */}
          <div className="text-[8px] text-gray-400 mt-2">
            └{'─'.repeat(50)}┘
          </div>
          
          {/* File Sharing Panel */}
          {showFileSharing && (
            <div className="mt-4 neu-flat p-4 rounded-xl mobile-only">
              <FileSharing
                onFileSelect={onSendFile || (() => {})}
                sharedFiles={sharedFiles}
                onDownloadFile={onDownloadFile}
                onDeleteFile={onDeleteFile}
              />
            </div>
          )}
        </div>
      </div>
      
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
