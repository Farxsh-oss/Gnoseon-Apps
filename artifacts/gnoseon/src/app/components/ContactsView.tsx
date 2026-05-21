import { Contact } from '../types';
import { Mail, Phone, Video } from 'lucide-react';

interface ContactsViewProps {
  contacts: Contact[];
  onStartChat: (contactId: string) => void;
}

export function ContactsView({ contacts, onStartChat }: ContactsViewProps) {
  return (
    <div className="flex-1 bg-[#e6e9f0] overflow-y-auto" style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* ASCII Header */}
        <div className="text-[10px] text-gray-400 mb-2">
          ╔════════════════════════════════════════════════════════════════════════════╗
        </div>
        
        <h1 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
          <span className="text-purple-600">►</span> CONTACTS_DATABASE
        </h1>
        
        <p className="text-sm text-gray-500 mb-4">
          <span className="text-green-600">$</span> list --all --active
        </p>
        
        <div className="text-[10px] text-gray-400 mb-6">
          ╚════════════════════════════════════════════════════════════════════════════╝
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(contact => (
            <div
              key={contact.id}
              role="button"
              tabIndex={0}
              onClick={() => onStartChat(contact.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStartChat(contact.id);
                }
              }}
              className="neu-flat p-4 rounded-xl hover:neu-raised transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {/* ASCII Card Border */}
              <div className="text-[8px] text-gray-400 mb-3">
                ┌──────────────────────┐
              </div>
              
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative mb-3">
                  <div className="neu-raised p-3 rounded-xl overflow-hidden">
                    <img 
                      src={contact.avatar} 
                      alt={contact.name}
                      className="w-16 h-16 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-bold hidden">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {contact.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#e6e9f0] neu-raised">
                      <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-base text-purple-600 mb-1">
                  {contact.name}
                </h3>
                {contact.username && (
                  <p className="text-xs text-gray-500 mb-2">{contact.username}</p>
                )}
                
                <div className={`neu-inset px-3 py-1 rounded-lg text-[10px] font-bold ${
                  contact.status === 'online' 
                    ? 'text-green-700' 
                    : 'text-gray-700'
                }`}>
                  <span className={contact.status === 'online' ? 'animate-pulse' : ''}>●</span> {contact.status.toUpperCase()}
                </div>
              </div>
              
              <div className="text-[8px] text-gray-400 mb-3">
                ├──────────────────────┤
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat(contact.id);
                  }}
                  className="flex-1 neu-raised-green px-3 py-2 rounded-lg font-bold text-xs transition-all hover:neu-pressed flex items-center justify-center gap-1 text-green-700"
                >
                  <Mail className="w-3 h-3" />
                  <span>[CHAT]</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="neu-raised px-3 py-2 rounded-lg transition-all hover:neu-pressed"
                >
                  <Phone className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="neu-raised px-3 py-2 rounded-lg transition-all hover:neu-pressed"
                >
                  <Video className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              
              <div className="text-[8px] text-gray-400 mt-3">
                └──────────────────────┘
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}