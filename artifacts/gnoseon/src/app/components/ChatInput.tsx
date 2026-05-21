import { useState } from 'react';
import { Smile, Send, Paperclip, Clock, X } from 'lucide-react';
import { FileSharing, SharedFile } from './FileSharing';

type ExpiryTime = undefined | 30 | 60 | 300 | 3600 | 86400; // seconds

interface ChatInputProps {
  onSendMessage: (text: string, expiresIn?: number) => void;
  onSendFile?: (files: FileList) => void;
  onDownloadFile?: (file: SharedFile) => void;
  onDeleteFile?: (fileId: string) => void;
  sharedFiles?: SharedFile[];
}

export function ChatInput({
  onSendMessage,
  onSendFile,
  onDownloadFile,
  onDeleteFile,
  sharedFiles = []
}: ChatInputProps) {
  const [messageText, setMessageText] = useState('');
  const [showFileSharing, setShowFileSharing] = useState(false);
  const [expiryTime, setExpiryTime] = useState<ExpiryTime>(undefined);
  const [showExpirySelector, setShowExpirySelector] = useState(false);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText, expiryTime);
    setMessageText('');
    setExpiryTime(undefined);
  };

  return (
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
              <span className="text-green-600 text-sm">$</span>
              <input
                type="text"
                placeholder="type message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400"
                aria-label="Message input"
              />
              <span className="text-green-600 animate-pulse">█</span>
            </div>
            
            <button 
              className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target"
              onClick={() => setShowFileSharing(!showFileSharing)}
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
            
            <button 
              className={`neu-raised p-2 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target ${expiryTime ? 'text-purple-600' : 'text-gray-600'}`}
              onClick={() => setShowExpirySelector(!showExpirySelector)}
              title="Set message expiry time"
              aria-label="Set expiry time"
            >
              <Clock className="w-4 h-4" />
            </button>
            
            <button 
              onClick={handleSend}
              className="neu-raised-green p-3 rounded-lg hover:neu-pressed transition-all flex-shrink-0 touch-target"
              disabled={!messageText.trim()}
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-green-600" />
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
        
        {/* Expiry Time Selector */}
        {showExpirySelector && (
          <div className="mt-4 neu-flat p-4 rounded-xl mobile-only">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Self-Destruct Timer
              </h4>
              <button
                onClick={() => setShowExpirySelector(false)}
                className="neu-raised p-1 rounded hover:neu-pressed transition-all"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: undefined, label: 'Off' },
                { value: 30, label: '30s' },
                { value: 60, label: '1m' },
                { value: 300, label: '5m' },
                { value: 3600, label: '1h' },
                { value: 86400, label: '1d' },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    setExpiryTime(option.value as ExpiryTime);
                    setShowExpirySelector(false);
                  }}
                  className={`neu-flat p-2 rounded-lg text-sm font-medium transition-all ${
                    expiryTime === option.value
                      ? 'neu-raised-purple text-purple-600'
                      : 'text-gray-600 hover:neu-raised'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
