import { useState } from 'react';
import { Trash2, Download, AlertTriangle } from 'lucide-react';

interface ChatActionsProps {
  onClearHistory: () => void;
  onExportHistory: () => void;
  onBlockUser?: () => void;
  contactName: string;
}

export function ChatActions({ 
  onClearHistory, 
  onExportHistory, 
  onBlockUser, 
  contactName 
}: ChatActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setShowConfirmDialog(action);
  };

  const executeAction = () => {
    switch (showConfirmDialog) {
      case 'clear':
        onClearHistory();
        break;
      case 'export':
        onExportHistory();
        break;
      case 'block':
        onBlockUser?.();
        break;
    }
    setShowConfirmDialog(null);
  };

  const getConfirmContent = (action: string) => {
    switch (action) {
      case 'clear':
        return {
          title: 'Clear Chat History',
          message: `Are you sure you want to delete all messages with ${contactName}? This action cannot be undone.`,
          icon: <Trash2 className="w-6 h-6 text-red-500" />,
          buttonClass: 'bg-red-500 hover:bg-red-600 text-white'
        };
      case 'export':
        return {
          title: 'Export Chat History',
          message: `Export all messages with ${contactName} to a file?`,
          icon: <Download className="w-6 h-6 text-blue-500" />,
          buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
      case 'block':
        return {
          title: 'Block User',
          message: `Block ${contactName}? You will no longer receive messages from this user.`,
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Chat Actions</h4>
      
      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleAction('export')}
          className="w-full neu-raised p-3 rounded-lg hover:neu-pressed transition-all flex items-center gap-3 text-left"
        >
          <Download className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-purple-600">Export Chat</p>
            <p className="text-xs text-gray-500">Download conversation history</p>
          </div>
        </button>

        <button
          onClick={() => handleAction('clear')}
          className="w-full neu-raised p-3 rounded-lg hover:neu-pressed transition-all flex items-center gap-3 text-left"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-sm font-medium text-purple-600">Clear History</p>
            <p className="text-xs text-gray-500">Delete all messages</p>
          </div>
        </button>

        {onBlockUser && (
          <button
            onClick={() => handleAction('block')}
            className="w-full neu-raised p-3 rounded-lg hover:neu-pressed transition-all flex items-center gap-3 text-left"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-purple-600">Block User</p>
              <p className="text-xs text-gray-500">Stop receiving messages</p>
            </div>
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (() => {
        const content = getConfirmContent(showConfirmDialog);
        if (!content) return null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="neu-flat rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                {content.icon}
                <h3 className="text-lg font-bold text-purple-600">{content.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">{content.message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 neu-raised p-3 rounded-lg hover:neu-pressed transition-all text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`flex-1 p-3 rounded-lg transition-all ${content.buttonClass}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
