import { Phone, Video, MoreVertical, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Contact } from '../types';
import { SharedFile } from './FileSharing';
import { ChatActions } from './ChatActions';

interface InfoPanelProps {
  contact: Contact | null;
  sharedFiles: SharedFile[];
  onClose?: () => void;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
  onBlockUser?: () => void;
}

export function InfoPanel({ 
  contact, 
  sharedFiles, 
  onClose, 
  onClearHistory, 
  onExportHistory, 
  onBlockUser 
}: InfoPanelProps) {
  if (!contact) {
    return null;
  }
  
  return (
    <div className="w-full lg:w-80 bg-[#e6e9f0] flex flex-col h-full overflow-hidden" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Header */}
      <div className="p-3 sm:p-4 neu-flat">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-green-600">
            <span className="text-purple-600">►</span> INFO_PANEL
          </h2>
          <div className="flex items-center gap-2">
            {onClose && (
              <button 
                onClick={onClose}
                className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all lg:hidden"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button className="neu-raised p-2 rounded-lg hover:neu-pressed transition-all">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="text-[8px] text-gray-400">
          ═══════════════════════════════════
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* User Profile */}
        <div className="neu-flat p-4 sm:p-6 rounded-xl mb-4">
          {/* ASCII Frame */}
          <div className="text-[8px] text-gray-400 mb-3 text-center">
            ╔═════════════════╗
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="neu-raised p-4 rounded-xl overflow-hidden">
                <img 
                  src={contact.avatar} 
                  alt={contact.name}
                  className="w-24 h-24 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-24 h-24 bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold hidden">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
              </div>
              {contact.status === 'online' && (
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[#e6e9f0] neu-raised">
                  <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center space-y-2 text-xs">
            <div className="neu-inset p-2 rounded-lg">
              <span className="text-gray-500">status:</span>{' '}
              <span className="text-green-600 font-bold">
                <span className="animate-pulse">●</span> {contact.status}
              </span>
            </div>
            
            {contact.username && (
              <div className="neu-inset p-2 rounded-lg">
                <span className="text-gray-500">user:</span>{' '}
                <span className="text-purple-600">{contact.username}</span>
              </div>
            )}
            
            {contact.bio && (
              <div className="neu-inset p-2 rounded-lg">
                <span className="text-gray-500">bio:</span>{' '}
                <span className="text-blue-600 text-xs leading-relaxed">{contact.bio}</span>
              </div>
            )}
            
            {contact.memberSince && (
              <div className="neu-inset p-2 rounded-lg">
                <span className="text-gray-500">since:</span>{' '}
                <span className="text-purple-600">{contact.memberSince}</span>
              </div>
            )}
          </div>
          
          <div className="text-[8px] text-gray-400 mt-3 text-center">
            ╚═════════════════╝
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          <button className="w-full neu-raised-green px-6 py-3 rounded-xl font-bold text-sm transition-all hover:neu-pressed flex items-center justify-center gap-2 text-green-700">
            <Phone className="w-4 h-4" />
            <span>[ CALL ]</span>
          </button>
          
          <button className="w-full neu-raised px-6 py-3 rounded-xl font-bold text-sm transition-all hover:neu-pressed flex items-center justify-center gap-2 text-gray-700">
            <Video className="w-4 h-4" />
            <span>[ VIDEO ]</span>
          </button>
        </div>
        
        {/* Shared Files */}
        <div className="neu-flat p-4 rounded-xl mb-4">
          <div className="text-[8px] text-gray-400 mb-2">
            ┌─ SHARED_FILES ─────────┐
          </div>
          
          <h3 className="font-bold text-purple-600 mb-3 text-sm">
            <span className="text-purple-600">►</span> Files
          </h3>
          
          <div className="space-y-2">
            {sharedFiles.map(file => (
              <button
                key={file.id}
                className="w-full neu-raised hover:neu-pressed transition-all rounded-lg"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="neu-inset w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                    {file.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-xs text-gray-700 truncate flex-1 text-left">
                    {file.fileName}
                  </span>
                  <span className="text-[10px] text-green-600">→</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-[8px] text-gray-400 mt-2">
            └────────────────────────┘
          </div>
        </div>
        
        {/* Pinned Message */}
        <div className="neu-flat-yellow p-4 rounded-xl mb-4">
          <div className="text-[8px] text-yellow-600 mb-2">
            ╔═ PINNED_MESSAGE ═══════╗
          </div>
          
          <h3 className="font-bold text-purple-600 mb-2 text-sm flex items-center gap-2">
            <span className="text-yellow-600">📌</span>
            <span>Reminder</span>
          </h3>
          
          <div className="neu-inset p-3 rounded-lg">
            <p className="text-xs text-gray-700">
              <span className="text-green-600">$</span> Meeting at 5 PM!
            </p>
          </div>
          
          <div className="text-[8px] text-yellow-600 mt-2">
            ╚════════════════════════╝
          </div>
        </div>
        
        {/* Chat Actions */}
        {(onClearHistory || onExportHistory || onBlockUser) && (
          <ChatActions
            onClearHistory={onClearHistory || (() => {})}
            onExportHistory={onExportHistory || (() => {})}
            onBlockUser={onBlockUser}
            contactName={contact.name}
          />
        )}
      </div>
    </div>
  );
}
