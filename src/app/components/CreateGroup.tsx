import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { Contact } from '../types';

interface CreateGroupProps {
  contacts: Contact[];
  onClose: () => void;
  onCreateGroup: (name: string, description: string, members: string[]) => void;
}

export const CreateGroup: React.FC<CreateGroupProps> = ({
  contacts,
  onClose,
  onCreateGroup
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleToggleMember = (contactId: string) => {
    setSelectedMembers(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName.trim(), groupDescription.trim(), selectedMembers);
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Create New Group
          </h2>
          <button
            onClick={onClose}
            className="neu-button p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="Enter group description (optional)"
            rows={3}
            className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Members *
          </label>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => handleToggleMember(contact.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedMembers.includes(contact.id)
                    ? 'neu-raised-purple bg-purple-50'
                    : 'neu-flat hover:neu-raised'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.status}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedMembers.includes(contact.id)
                    ? 'bg-purple-600 border-purple-600'
                    : 'border-gray-300'
                }`}>
                  {selectedMembers.includes(contact.id) && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedMembers.length > 0 && (
          <div className="neu-flat p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Members ({selectedMembers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(memberId => {
                const contact = contacts.find(c => c.id === memberId);
                return contact ? (
                  <span
                    key={memberId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                  >
                    {contact.name}
                    <button
                      onClick={() => handleToggleMember(memberId)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedMembers.length === 0}
          className="w-full neu-raised-green py-2 rounded-lg text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Group
        </button>
      </div>
    </div>
  );
};
