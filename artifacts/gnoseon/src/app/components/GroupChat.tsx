import React, { useState } from 'react';
import { Users, Settings, Plus, Search } from 'lucide-react';
import { Group } from '../types';

interface GroupChatProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  onManageGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({
  groups,
  onSelectGroup,
  onManageGroup,
  onCreateGroup
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Group Chats
          </h2>
          <button
            onClick={onCreateGroup}
            className="neu-raised-green p-2 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Plus className="w-4 h-4 text-green-700" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {groups.length > 0 ? (
          groups.map(group => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className="neu-flat p-4 rounded-lg cursor-pointer hover:neu-raised transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-600 dark:text-gray-200">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {group.memberCount} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageGroup(group.id);
                  }}
                  className="neu-button p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No groups yet</p>
            <button
              onClick={onCreateGroup}
              className="neu-raised-green px-4 py-2 rounded-lg text-green-700 font-medium"
            >
              Create Your First Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
