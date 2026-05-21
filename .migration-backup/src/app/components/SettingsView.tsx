import { Bell, Lock, Palette, Globe, HelpCircle, Edit3, User, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { InputValidator } from '../../utils/security';
import { handleDatabaseError } from '../../utils/errorHandler';

interface SettingsViewProps {
  user?: any;
}

export function SettingsView({ user }: SettingsViewProps) {
  const [marqueeText, setMarqueeText] = useState('://Welcome </To> ://Gnoseon [idn] ://Selamat_datang </Di> ://Gnoseon>');
  const [isEditingMarquee, setIsEditingMarquee] = useState(false);
  const [tempMarqueeText, setTempMarqueeText] = useState('');
  
  // Profile states
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileBio, setProfileBio] = useState('');
  const [profileStatus, setProfileStatus] = useState<'online' | 'offline' | 'away' | 'busy' | 'working' | 'school' | 'active'>('offline');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('');
  
  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const dbUser = await apiService.getUser(user.id);
        if (dbUser) {
          setProfileBio(dbUser.bio || '');
          setProfileStatus(dbUser.status || 'offline');
          setProfileAvatar(dbUser.avatar || '');
        }
      } catch (error) {
        handleDatabaseError('Profile load error', error instanceof Error ? error : new Error(String(error)));
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    const savedText = localStorage.getItem('gnoseon_marquee_text');
    if (savedText) {
      setMarqueeText(savedText);
    }
    
    // Fallback to localStorage if database not available
    const savedAvatar = localStorage.getItem('gnoseon_profile_avatar');
    const savedBio = localStorage.getItem('gnoseon_profile_bio');
    const savedStatus = localStorage.getItem('gnoseon_profile_status');
    
    if (savedAvatar && !profileAvatar) setProfileAvatar(savedAvatar);
    if (savedBio && !profileBio) setProfileBio(savedBio);
    if (savedStatus && !profileStatus) {
      const status = savedStatus as 'online' | 'offline' | 'away' | 'busy' | 'working' | 'school' | 'active';
      if (['online', 'offline', 'away', 'busy', 'working', 'school'].includes(status)) {
        setProfileStatus(status);
      } else if (status === 'active') {
        setProfileStatus('online'); // Map old 'active' to 'online'
      }
    }
  }, [profileAvatar, profileBio, profileStatus]);

  const isAdmin = user?.username === 'Farxsh' || user?.displayName === 'Administrator';

  // Profile handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileAvatar(result);
        localStorage.setItem('gnoseon_profile_avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditBio = () => {
    setTempBio(profileBio);
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    setProfileBio(tempBio);
    localStorage.setItem('gnoseon_profile_bio', tempBio);
    
    if (user) {
      try {
        await apiService.updateUserProfile(user.id, { bio: tempBio });
      } catch (error) {
        handleDatabaseError('Error saving bio', error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    setIsEditingBio(false);
  };

  const handleCancelEditBio = () => {
    setTempBio(profileBio);
    setIsEditingBio(false);
  };

  const handleStatusChange = async (status: 'online' | 'offline' | 'away' | 'busy' | 'working' | 'school' | 'active') => {
    setProfileStatus(status);
    localStorage.setItem('gnoseon_profile_status', status);
    
    if (user) {
      try {
        await apiService.updateUserProfile(user.id, { status });
      } catch (error) {
        handleDatabaseError('Error saving status', error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  const handleSaveMarquee = () => {
    setMarqueeText(tempMarqueeText);
    localStorage.setItem('gnoseon_marquee_text', tempMarqueeText);
    setIsEditingMarquee(false);
  };

  const handleCancelEdit = () => {
    setTempMarqueeText(marqueeText);
    setIsEditingMarquee(false);
  };

  const handleEditMarquee = () => {
    setTempMarqueeText(marqueeText);
    setIsEditingMarquee(true);
  };

  // Delete account handlers
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (deleteConfirmation !== 'DELETE' || !deletePassword) {
      alert('Please type "DELETE" and enter your password to confirm');
      return;
    }
    
    // Validate password
    const passwordValidation = InputValidator.validatePassword(deletePassword);
    if (!passwordValidation.valid) {
      alert(passwordValidation.error || 'Invalid password format');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Call API to delete account
      await apiService.deleteAccount(user.id, deletePassword);
      
      // Clear local data
      localStorage.clear();
      
      // Redirect to login or home page
      window.location.reload();
    } catch (error) {
      handleDatabaseError('Error deleting account', error instanceof Error ? error : new Error(String(error)));
      alert('Failed to delete account. Please check your password and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteConfirmation('');
  };
  return (
    <div className="flex-1 bg-[#e6e9f0] overflow-y-auto" style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* ASCII Header */}
        <div className="text-[10px] text-gray-400 mb-2">
          ╔═══════════════════════════════════════════════════════════════════════════╗
        </div>
        
        <h1 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
          <span className="text-purple-600">►</span> SYSTEM_SETTINGS
        </h1>
        
        <p className="text-sm text-gray-500 mb-4">
          <span className="text-green-600">$</span> config --edit --user
        </p>
        
        <div className="text-[10px] text-gray-400 mb-6">
          ╚═══════════════════════════════════════════════════════════════════════════╝
        </div>
        
        <div className="space-y-4">
          {/* Profile Section */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ USER_PROFILE ───────────────────────┐
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-600 text-sm">Profile Settings</h3>
                <p className="text-xs text-gray-500">// Manage your profile</p>
              </div>
            </div>
            
            <div className="space-y-4 neu-inset p-4 rounded-lg">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 neu-raised rounded-full overflow-hidden flex items-center justify-center">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-green-400 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 neu-raised-green w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:neu-pressed transition-all">
                    <Camera className="w-3 h-3 text-green-700" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-purple-600 mb-1">
                    {user?.displayName || user?.username || 'Anonymous User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    @{user?.username || 'anonymous'}
                  </div>
                </div>
              </div>
              
              {/* Status Selector */}
              <div>
                <div className="text-xs text-gray-600 mb-2">
                  <span className="text-green-600">$</span> Status:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'online', label: '🟢 Online', color: 'text-green-600' },
                    { value: 'away', label: '� Away', color: 'text-yellow-600' },
                    { value: 'offline', label: '⚫ Offline', color: 'text-gray-600' },
                    { value: 'busy', label: '🔴 Busy', color: 'text-red-600' },
                    { value: 'working', label: '💼 Working', color: 'text-blue-600' },
                    { value: 'school', label: '📚 School', color: 'text-purple-600' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value as any)}
                      className={`neu-raised px-2 py-1 rounded text-xs font-bold transition-all ${
                        profileStatus === status.value
                          ? 'neu-pressed ' + status.color
                          : 'text-gray-600 hover:neu-pressed'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bio Section */}
              <div>
                <div className="text-xs text-gray-600 mb-2">
                  <span className="text-green-600">$</span> Bio:
                </div>
                {!isEditingBio ? (
                  <div className="space-y-2">
                    <div className="neu-raised p-2 rounded min-h-[60px]">
                      <p className="text-xs text-gray-700">
                        {profileBio || 'No bio set. Click edit to add one!'}
                      </p>
                    </div>
                    <button
                      onClick={handleEditBio}
                      className="neu-raised-green px-3 py-1 rounded text-green-700 hover:neu-pressed transition-all font-bold text-xs"
                    >
                      [EDIT_BIO]
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      className="w-full neu-raised p-2 rounded text-xs text-gray-600 font-mono resize-none h-20 focus:neu-pressed transition-all outline-none"
                      placeholder="Enter your bio..."
                      maxLength={200}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveBio}
                        className="neu-raised-green px-3 py-1 rounded text-green-700 hover:neu-pressed transition-all font-bold text-xs"
                      >
                        [SAVE]
                      </button>
                      <button
                        onClick={handleCancelEditBio}
                        className="neu-raised px-3 py-1 rounded text-gray-600 hover:neu-pressed transition-all font-bold text-xs"
                      >
                        [CANCEL]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Notifications */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ NOTIFICATIONS ────────────────────┐
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-600 text-sm">Notifications</h3>
                <p className="text-xs text-gray-500">// Manage preferences</p>
              </div>
            </div>
            
            <div className="space-y-2 ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[✓] Message notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[✓] Call notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[ ] Sound effects</span>
              </label>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Privacy */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ PRIVACY_&_SECURITY ───────────────┐
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-600 text-sm">Privacy & Security</h3>
                <p className="text-xs text-gray-500">// Control privacy settings</p>
              </div>
            </div>
            
            <div className="space-y-2 ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[✓] Show online status</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[✓] Read receipts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">[ ] Two-factor auth</span>
              </label>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Appearance */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ APPEARANCE ───────────────────────┐
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-purple-600 text-sm">Appearance</h3>
                <p className="text-xs text-gray-500">// Customize theme</p>
              </div>
            </div>
            
            <div className="space-y-2 ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="theme" defaultChecked className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">(•) Light mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="theme" className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">( ) Dark mode</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="theme" className="w-4 h-4 accent-green-600" />
                <span className="text-xs text-gray-700">( ) Auto (system)</span>
              </label>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Admin Marquee Settings - Only visible to admin */}
          {isAdmin && (
            <div className="neu-flat p-4 rounded-xl">
              <div className="text-[8px] text-gray-400 mb-3">
                ┌─ ADMIN_MARQUEE_SETTINGS ────────────┐
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-600 text-sm">Marquee Text Editor</h3>
                  <p className="text-xs text-gray-500">// Customize scrolling text</p>
                </div>
              </div>
              
              {!isEditingMarquee ? (
                <div className="space-y-2 ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
                  <div className="text-xs text-gray-700 mb-2">
                    <span className="text-green-600">$</span> Current marquee text:
                  </div>
                  <div className="neu-raised p-2 rounded text-xs text-gray-600 font-mono break-all">
                    {marqueeText}
                  </div>
                  <button 
                    onClick={handleEditMarquee}
                    className="neu-raised-green px-3 py-1 rounded text-green-700 hover:neu-pressed transition-all font-bold text-xs mt-2"
                  >
                    [EDIT_TEXT]
                  </button>
                </div>
              ) : (
                <div className="space-y-2 ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
                  <div className="text-xs text-gray-700 mb-2">
                    <span className="text-green-600">$</span> Edit marquee text:
                  </div>
                  <textarea
                    value={tempMarqueeText}
                    onChange={(e) => setTempMarqueeText(e.target.value)}
                    className="w-full neu-raised p-2 rounded text-xs text-gray-600 font-mono resize-none h-20 focus:neu-pressed transition-all outline-none"
                    placeholder="Enter marquee text..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={handleSaveMarquee}
                      className="neu-raised-green px-3 py-1 rounded text-green-700 hover:neu-pressed transition-all font-bold text-xs"
                    >
                      [SAVE]
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="neu-raised px-3 py-1 rounded text-gray-600 hover:neu-pressed transition-all font-bold text-xs"
                    >
                      [CANCEL]
                    </button>
                  </div>
                </div>
              )}
              
              <div className="text-[8px] text-gray-400 mt-3">
                └────────────────────────────────────┘
              </div>
            </div>
          )}
          
          {/* Language */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ LANGUAGE ─────────────────────────┐
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-600 text-sm">Language</h3>
                  <p className="text-xs text-gray-500">English (US)</p>
                </div>
              </div>
              <button className="neu-raised px-4 py-2 rounded-lg text-green-600 hover:neu-pressed transition-all font-bold text-xs">
                [CHANGE]
              </button>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Help */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ HELP_&_SUPPORT ───────────────────┐
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-600 text-sm">Help & Support</h3>
                  <p className="text-xs text-gray-500">// Get help or send feedback</p>
                </div>
              </div>
              <button className="neu-raised px-4 py-2 rounded-lg text-green-600 hover:neu-pressed transition-all font-bold text-xs">
                [OPEN]
              </button>
            </div>
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* Delete Account */}
          <div className="neu-flat p-4 rounded-xl">
            <div className="text-[8px] text-gray-400 mb-3">
              ┌─ DANGER_ZONE ─────────────────────┐
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-600 text-sm">Delete Account</h3>
                <p className="text-xs text-gray-500">// Permanently remove account</p>
              </div>
            </div>
            
            {!showDeleteConfirm ? (
              <div className="ml-0 sm:ml-13 neu-inset p-3 rounded-lg">
                <div className="text-xs text-red-600 mb-2 font-bold">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  WARNING: This action cannot be undone!
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Deleting your account will permanently remove all your data including messages, contacts, and profile information.
                </p>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="neu-raised-red px-3 py-1 rounded text-red-700 hover:neu-pressed transition-all font-bold text-xs"
                >
                  [DELETE_ACCOUNT]
                </button>
              </div>
            ) : (
              <div className="ml-0 sm:ml-13 neu-inset p-3 rounded-lg border-2 border-red-300">
                <div className="text-xs text-red-600 mb-3 font-bold">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  FINAL CONFIRMATION REQUIRED
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">
                      <span className="text-green-600">$</span> Type "DELETE" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full neu-raised p-2 rounded text-xs text-gray-600 font-mono focus:neu-pressed transition-all outline-none"
                      placeholder="DELETE"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">
                      <span className="text-green-600">$</span> Enter your password:
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full neu-raised p-2 rounded text-xs text-gray-600 font-mono focus:neu-pressed transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmation !== 'DELETE' || !deletePassword}
                      className="neu-raised-red px-3 py-1 rounded text-red-700 hover:neu-pressed transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? '[DELETING...]' : '[PERMANENTLY_DELETE]'}
                    </button>
                    <button 
                      onClick={handleCancelDelete}
                      className="neu-raised px-3 py-1 rounded text-gray-600 hover:neu-pressed transition-all font-bold text-xs"
                    >
                      [CANCEL]
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-[8px] text-gray-400 mt-3">
              └────────────────────────────────────┘
            </div>
          </div>
          
          {/* About */}
          <div className="neu-flat p-6 rounded-xl text-center">
            <div className="text-[8px] text-gray-400 mb-3">
              ╔═══════════════════════════════════╗
            </div>
            
            <div className="text-xl font-bold mb-2">
              <span className="text-green-600">►</span>
              <span className="text-green-600">G</span>
              <span className="text-purple-600">noseon</span>
              <span className="text-green-600 ml-1">█</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Version 2.3.0</p>
            <p className="text-[10px] text-gray-400">© 2026 Gnoseon. All rights reserved.</p>
            
            <div className="text-[8px] text-gray-400 mt-3">
              ╚═══════════════════════════════════╝
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
