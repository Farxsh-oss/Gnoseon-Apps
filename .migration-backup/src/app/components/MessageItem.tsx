import React, { useState } from 'react';
import { Flag, Trash2, Smile } from 'lucide-react';
import { Message } from '../types';
import socketService from '../../services/socketService';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  onReportMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  formatTime: (date: Date) => string;
  getTimeUntilExpiration: (expiresAt: Date) => string;
  currentUserId?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  onReportMessage,
  onDeleteMessage,
  formatTime,
  getTimeUntilExpiration,
  currentUserId
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleAddReaction = (emoji: string) => {
    socketService.addReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const handleRemoveReaction = (emoji: string) => {
    socketService.removeReaction(message.id, emoji);
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md message-container ${isMe ? 'order-2' : 'order-1'} group`}>
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
        )}
        
        {/* Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              const hasReacted = users.some(u => u.userId === currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => hasReacted ? handleRemoveReaction(emoji) : handleAddReaction(emoji)}
                  className={`neu-raised px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                    hasReacted ? 'neu-pressed-purple text-purple-600' : 'hover:neu-pressed'
                  }`}
                  title={users.map(u => u.userName).join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 px-2 ${isMe ? 'justify-end' : 'justify-start opacity-0 group-hover:opacity-100 transition-opacity'}`}>
          <span className="text-[10px] text-gray-500">
            [{formatTime(message.timestamp)}]
          </span>
          {message.expiresAt && (
            <span className="text-[10px] text-orange-500 flex items-center gap-1">
              🔥 {getTimeUntilExpiration(message.expiresAt)}
            </span>
          )}
          {message.isEncrypted && (
            <span className="text-[10px] text-purple-500">
              🔒
            </span>
          )}
          {!isMe && onReportMessage && (
            <button
              onClick={() => onReportMessage(message.id)}
              className="neu-raised p-1 rounded hover:neu-pressed transition-all group/btn touch-target"
              title="Report message"
            >
              <Flag className="w-3 h-3 text-gray-400 group-hover/btn:text-red-500 transition-colors" />
            </button>
          )}
          {isMe && onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(message.id)}
              className="neu-raised p-1 rounded hover:neu-pressed transition-all group/btn touch-target"
              title="Delete message"
            >
              <Trash2 className="w-3 h-3 text-gray-400 group-hover/btn:text-red-500 transition-colors" />
            </button>
          )}
          
          {/* Reaction Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="neu-raised p-1 rounded hover:neu-pressed transition-all group/btn touch-target"
              title="Add reaction"
            >
              <Smile className="w-3 h-3 text-gray-400 group-hover/btn:text-yellow-500 transition-colors" />
            </button>
            
            {showEmojiPicker && (
              <div className={`absolute bottom-full mb-2 p-2 neu-flat rounded-lg flex gap-1 z-20 ${isMe ? 'right-0' : 'left-0'}`}>
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="hover:scale-125 transition-transform text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
