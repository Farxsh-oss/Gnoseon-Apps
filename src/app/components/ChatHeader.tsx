import React from 'react';
import { Phone, Video, Search, MoreVertical, Lock, Unlock } from 'lucide-react';
import { Contact } from '../types';

interface ChatHeaderProps {
  contact: Contact;
  encryptionEnabled: boolean;
  onToggleEncryption?: () => void;
  onShowMessageSearch: () => void;
  onShowInfo?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  contact,
  encryptionEnabled,
  onToggleEncryption,
  onShowMessageSearch,
  onShowInfo
}) => {
  return (
    <div className="p-4 bg-white/50 backdrop-blur-md border-b border-gray-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={contact.avatar} 
              alt={contact.name}
              className="w-10 h-10 rounded-full neu-raised object-cover"
            />
            {contact.status === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="text-purple-600">@</span>{contact.username || contact.name.toLowerCase().replace(/\s+/g, '_')}
            </h3>
            <p className="text-[10px] text-gray-500 font-mono">
              status: <span className={contact.status === 'online' ? 'text-green-600' : 'text-gray-400'}>{contact.status}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onToggleEncryption && (
            <button 
              className={`neu-raised p-2 rounded-lg hover:neu-pressed transition-all ${encryptionEnabled ? 'text-purple-600' : 'text-gray-400'}`}
              onClick={onToggleEncryption}
              title={encryptionEnabled ? 'End-to-end encryption enabled' : 'Enable end-to-end encryption'}
            >
              {encryptionEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          )}
          
          <button 
            className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all"
            onClick={onShowMessageSearch}
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
  );
};
