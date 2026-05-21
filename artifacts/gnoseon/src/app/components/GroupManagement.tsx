import React, { useState } from 'react';
import { Users, Plus, X, Shield, UserMinus, Crown } from 'lucide-react';
import { Group, Contact } from '../types';

interface GroupManagementProps {
  group?: Group;
  contacts: Contact[];
  onClose: () => void;
  onUpdateGroup: (groupId: string, updates: Partial<Group>) => void;
  onAddMember: (groupId: string, contactId: string) => void;
  onRemoveMember: (groupId: string, contactId: string) => void;
  onPromoteToAdmin: (groupId: string, contactId: string) => void;
}

export const GroupManagement: React.FC<GroupManagementProps> = ({
  group,
  contacts,
  onClose,
  onUpdateGroup,
  onAddMember,
  onRemoveMember,
  onPromoteToAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'settings'>('info');
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDescription, setGroupDescription] = useState(group?.description || '');
  const [showAddMember, setShowAddMember] = useState(false);

  // Early return if group is undefined
  if (!group) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  const handleSaveInfo = () => {
    onUpdateGroup(group.id, {
      name: groupName,
      description: groupDescription
    });
  };

  const handleAddMember = (contactId: string) => {
    onAddMember(group.id, contactId);
    setShowAddMember(false);
  };

  const availableContacts = contacts.filter(contact => 
    !group.members.some(member => member.userId === contact.id)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Group Management</h2>
          <button
            onClick={onClose}
            className="neu-button p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'neu-raised-purple text-purple-700'
                : 'neu-flat text-gray-600 hover:text-purple-600'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'neu-raised-purple text-purple-700'
                : 'neu-flat text-gray-600 hover:text-purple-600'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'neu-raised-purple text-purple-700'
                : 'neu-flat text-gray-600 hover:text-purple-600'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
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
                rows={3}
                className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Group Avatar</p>
                <button className="text-purple-600 text-sm hover:underline">
                  Change Avatar
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveInfo}
              className="w-full neu-raised-green py-2 rounded-lg text-green-700 font-medium"
            >
              Save Changes
            </button>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Members ({group.memberCount})</h3>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="neu-raised-green p-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-green-700" />
              </button>
            </div>

            {showAddMember && (
              <div className="neu-flat p-3 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Add Members</h4>
                {availableContacts.length > 0 ? (
                  availableContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleAddMember(contact.id)}
                      className="flex items-center gap-3 p-2 neu-inset rounded-lg cursor-pointer hover:neu-raised transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{contact.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No available contacts</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {group.members.map(member => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 neu-flat rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {contacts.find(c => c.id === member.userId)?.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {contacts.find(c => c.id === member.userId)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {member.role === 'admin' ? (
                          <>
                            <Crown className="w-3 h-3 text-yellow-500" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 text-gray-400" />
                            Member
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => onPromoteToAdmin(group.id, member.userId)}
                        className="neu-button p-1 rounded hover:bg-yellow-100 transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield className="w-3 h-3 text-yellow-600" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveMember(group.id, member.userId)}
                      className="neu-button p-1 rounded hover:bg-red-100 transition-colors"
                      title="Remove Member"
                    >
                      <UserMinus className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="neu-flat p-4 rounded-lg">
              <h3 className="font-medium mb-3">Group Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Public Group</span>
                  <input
                    type="checkbox"
                    checked={group.settings.isPublic}
                    onChange={(e) => onUpdateGroup(group.id, {
                      settings: { ...group.settings, isPublic: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Allow Members to Invite</span>
                  <input
                    type="checkbox"
                    checked={group.settings.allowInvites}
                    onChange={(e) => onUpdateGroup(group.id, {
                      settings: { ...group.settings, allowInvites: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Allow File Sharing</span>
                  <input
                    type="checkbox"
                    checked={group.settings.allowFileSharing}
                    onChange={(e) => onUpdateGroup(group.id, {
                      settings: { ...group.settings, allowFileSharing: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm">Require Approval for New Members</span>
                  <input
                    type="checkbox"
                    checked={group.settings.requireApproval}
                    onChange={(e) => onUpdateGroup(group.id, {
                      settings: { ...group.settings, requireApproval: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Retention (days, 0 = forever)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={group.settings.messageRetention}
                    onChange={(e) => onUpdateGroup(group.id, {
                      settings: { ...group.settings, messageRetention: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
