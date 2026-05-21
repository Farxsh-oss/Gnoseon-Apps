import React, { useState } from 'react';
import { Home, Users, Settings, Wifi, Signal, Battery, Shield, LogOut, Menu, X, MessageSquare } from 'lucide-react';
import logo from '@/assets/logo.png';
import { MarqueeText } from './MarqueeText';

interface HeaderProps {
  activeTab: 'home' | 'contacts' | 'settings' | 'groups';
  onTabChange: (tab: 'home' | 'contacts' | 'settings' | 'groups') => void;
  user?: any;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, user, onLogout }: HeaderProps) {
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleTabChange = (tab: 'home' | 'contacts' | 'settings' | 'groups') => {
    onTabChange(tab);
    setShowMobileNav(false);
  };

  return (
    <>
      <header className="bg-[#e6e9f0] px-4 py-3 neu-flat" style={{ fontFamily: 'var(--font-mono)' }}>
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left Side */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Gnoseon Logo"
              className="h-45 w-auto object-contain"
            />

            {/* Navigation - Desktop only */}
            <nav className="hidden md:flex gap-4">
              <button
                onClick={() => handleTabChange('home')}
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
                onClick={() => handleTabChange('contacts')}
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
                onClick={() => handleTabChange('groups')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all neu-raised ${
                  activeTab === 'groups'
                    ? 'neu-pressed text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-semibold">[G]roups</span>
              </button>

              <button
                onClick={() => handleTabChange('settings')}
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

          {/* Marquee Text - Center, desktop only */}
          <div className="hidden lg:flex items-center justify-center w-80 max-w-80">
            <MarqueeText />
          </div>

          {/* Right side - status + mobile hamburger */}
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
            <div className="hidden sm:block neu-inset px-3 py-1 rounded-lg">
              <span className="text-sm font-bold text-green-600">10:24</span>
            </div>

            {/* Hamburger button - mobile only */}
            <button
              onClick={() => setShowMobileNav(true)}
              className="md:hidden p-2 neu-raised rounded-lg text-gray-600 hover:text-green-600 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {showMobileNav && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setShowMobileNav(false)}
        />
      )}

      {/* Mobile Nav Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[#e6e9f0] z-50 md:hidden transition-transform duration-300 ${
          showMobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 neu-flat border-b border-gray-300">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Gnoseon Logo" className="h-8 w-auto object-contain" />
            <span className="text-sm font-bold text-green-600">GNOSEON</span>
          </div>
          <button
            onClick={() => setShowMobileNav(false)}
            className="p-2 neu-raised rounded-lg text-gray-600 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 neu-inset mx-4 mt-4 rounded-lg">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-bold text-purple-600">{user.displayName}</p>
            {user.username && (
              <p className="text-xs text-gray-400">@{user.username}</p>
            )}
          </div>
        )}

        {/* Nav Items */}
        <nav className="p-4 flex flex-col gap-3 mt-2">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all neu-raised text-left ${
              activeTab === 'home'
                ? 'neu-pressed text-green-600'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">[H]ome</p>
              <p className="text-xs text-gray-400">Chat messages</p>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('contacts')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all neu-raised text-left ${
              activeTab === 'contacts'
                ? 'neu-pressed text-green-600'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">[C]ontacts</p>
              <p className="text-xs text-gray-400">Contact database</p>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('groups')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all neu-raised text-left ${
              activeTab === 'groups'
                ? 'neu-pressed text-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">[G]roups</p>
              <p className="text-xs text-gray-400">Group channels</p>
            </div>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all neu-raised text-left ${
              activeTab === 'settings'
                ? 'neu-pressed text-green-600'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Settings className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">[S]ettings</p>
              <p className="text-xs text-gray-400">App preferences</p>
            </div>
          </button>
        </nav>

        {/* Status & Logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-300 neu-flat">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 neu-inset px-3 py-1 rounded-lg">
              <Wifi className="w-3 h-3 text-green-600" />
              <Shield className="w-3 h-3 text-purple-600" />
              <Signal className="w-3 h-3 text-green-600" />
              <Battery className="w-3 h-3 text-green-600" />
            </div>
            <div className="neu-inset px-3 py-1 rounded-lg">
              <span className="text-sm font-bold text-green-600">10:24</span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={() => { onLogout(); setShowMobileNav(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 neu-raised rounded-lg text-red-600 hover:neu-pressed transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
