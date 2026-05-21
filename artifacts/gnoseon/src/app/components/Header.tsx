import { Home, Users, Settings, Wifi, Signal, Battery, Shield, LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';
import { MarqueeText } from './MarqueeText';

interface HeaderProps {
  activeTab: 'home' | 'contacts' | 'settings' | 'groups';
  onTabChange: (tab: 'home' | 'contacts' | 'settings' | 'groups') => void;
  user?: any;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, user, onLogout }: HeaderProps) {
  return (
    <>
      <header className="bg-[#e6e9f0] px-4 py-3 neu-flat" style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="flex items-center justify-between h-20">
        {/* Logo and Navigation - Left Side */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img 
            src={logo} 
            alt="Gnoseon Logo" 
            className="h-45 w-auto object-contain"
          />
          
          {/* Navigation */}
          <nav className="flex gap-4">
            <button
              onClick={() => onTabChange('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all neu-raised ${
                activeTab === 'home' 
                  ? 'neu-pressed text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-semibold">[H]ome</span>
            </button>
            
            <button
              onClick={() => onTabChange('contacts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all neu-raised ${
                activeTab === 'contacts' 
                  ? 'neu-pressed text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">[C]ontacts</span>
            </button>
            
            <button
              onClick={() => onTabChange('groups')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all neu-raised ${
                activeTab === 'groups' 
                  ? 'neu-pressed text-purple-600' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">[G]roups</span>
            </button>
            
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all neu-raised ${
                activeTab === 'settings' 
                  ? 'neu-pressed text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-semibold">[S]ettings</span>
            </button>
          </nav>
        </div>
        
        {/* Marquee Text - Tengah dengan batasan */}
        <div className="flex items-center justify-center hidden md:flex w-80 max-w-80">
          <MarqueeText />
        </div>
        
        {/* Status Icons */}
        <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2 neu-inset px-3 py-1 rounded-lg">
              <span className="text-xs font-medium text-purple-600">{user.displayName}</span>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 neu-inset px-3 py-1 rounded-lg">
            <Wifi className="w-3 h-3 text-green-600" />
            <Shield className="w-3 h-3 text-purple-600" />
            <Signal className="w-3 h-3 text-green-600" />
            <Battery className="w-3 h-3 text-green-600" />
          </div>
          <div className="neu-inset px-3 py-1 rounded-lg">
            <span className="text-sm font-bold text-green-600">10:24</span>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
