import { useState, useEffect } from 'react';
import { Search, X, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import apiService from '../../services/apiService';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  senderName?: string;
  receiverName?: string;
  groupName?: string;
  groupId?: string;
  receiverId?: string;
}

interface MessageSearchProps {
  currentUserId: string;
  onMessageSelect?: (messageId: string) => void;
  onClose?: () => void;
}

export function MessageSearch({ 
  currentUserId, 
  onMessageSelect, 
  onClose 
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const results = await apiService.searchMessages(searchQuery, currentUserId);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search messages. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserId]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMessageClick = (messageId: string) => {
    onMessageSelect?.(messageId);
    onClose?.();
  };

  const getDisplayName = (message: Message) => {
    if (message.groupName) return message.groupName;
    if (message.senderId === currentUserId) return 'You';
    return message.senderName || 'Contact';
  };

  return (
    <div className="neu-flat rounded-xl p-4 space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-600 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Messages
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="neu-inset rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-sm"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="neu-raised p-1 rounded hover:neu-pressed transition-all"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isSearching ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full mx-auto mb-2"></div>
            <p className="text-sm">Searching...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-300" />
            <p className="text-sm">Search error</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No messages found</p>
            <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="text-sm text-gray-500 px-2">
              Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''}
            </div>
            {searchResults.map((message) => {
              const isMe = message.senderId === currentUserId;
              const displayName = getDisplayName(message);
              return (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className={`
                    neu-flat p-3 rounded-lg cursor-pointer hover:neu-raised transition-all
                    ${isMe ? 'ml-4 border-l-4 border-purple-400' : 'mr-4 border-l-4 border-green-400'}
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-xs font-medium ${isMe ? 'text-purple-600' : 'text-green-600'}`}>
                      {displayName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(message.timestamp)} • {formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 leading-relaxed">
                    {highlightText(message.text, searchQuery)}
                  </p>
                </div>
              );
            })}
          </>
        ) : searchQuery === '' ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Type to search messages</p>
            <p className="text-xs text-gray-400 mt-1">Search by message content</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
