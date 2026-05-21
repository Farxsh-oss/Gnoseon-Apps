import { Search, Grid3x3 } from 'lucide-react';
import { Contact, Chat } from '../types';

interface ChatSidebarProps {
  contacts: Contact[];
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ChatSidebar({ 
  contacts, 
  chats, 
  selectedChatId, 
  onSelectChat,
  searchQuery,
  onSearchChange 
}: ChatSidebarProps) {
  const getContactById = (id: string) => contacts.find(c => c.id === id);
  
  return (
    <div className="w-full lg:w-80 bg-[#e6e9f0] flex flex-col h-full" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Header */}
      <div className="p-4">
        <div className="neu-flat p-4 rounded-xl">
          {/* ASCII Title */}
          <div className="text-[10px] text-gray-400 mb-2">
            ╔═══════════════════════╗
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-green-600">
              <span className="text-purple-600">►</span> CHATS_PANEL
            </h2>
            <button className="neu-raised p-2 rounded-lg hover:text-green-600 transition-all">
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-[10px] text-gray-400 mb-3">
            ╚═══════════════════════╝
          </div>
          
          {/* Search */}
          <div className="relative">
            <div className="neu-inset rounded-lg">
              <div className="flex items-center px-3 py-2">
                <span className="text-green-600 mr-2">$</span>
                <input
                  type="text"
                  placeholder="search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-400"
                  aria-label="Search chats"
                />
                <Search className="w-4 h-4 text-gray-400 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {chats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No contacts available</p>
          </div>
        )}
        {chats
          .filter(chat => {
            const contact = getContactById(chat.contactId!);
            return contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
          })
          .map((chat, index) => {
            const contact = getContactById(chat.contactId!);
            if (!contact) return null;
            
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full mb-3 rounded-xl transition-all ${
                  selectedChatId === chat.id ? 'neu-pressed' : 'neu-raised hover:neu-flat'
                }`}
              >
                <div className="p-3">
                  {/* ASCII Separator */}
                  {index === 0 && (
                    <div className="text-[8px] text-gray-400 mb-2">
                      ─────────────────────────────
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg overflow-hidden ${
                        selectedChatId === chat.id ? 'neu-inset' : 'neu-raised'
                      }`}>
                        <img 
                          src={contact.avatar} 
                          alt={contact.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold hidden">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      {contact.status === 'online' && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#e6e9f0]">
                          <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-sm truncate ${
                          contact.name === 'CryptoBot' ? 'text-purple-600' : 'text-purple-600'
                        }`}>
                          {selectedChatId === chat.id ? '► ' : ''}{contact.name}
                        </h3>
                        <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                          [{chat.lastMessageTime}]
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 truncate">
                          <span className="text-green-600">{'>'} </span>
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded-full text-[10px] font-bold flex-shrink-0 neu-raised">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* ASCII Bottom Border */}
                  <div className="text-[8px] text-gray-400 mt-2">
                    ─────────────────────────────
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
