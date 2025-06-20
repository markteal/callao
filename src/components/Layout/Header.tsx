import React from 'react';
import { Shield, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  const handleSettingsClick = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleUserClick = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Callao Server</h1>
              <p className="text-sm text-neutral-600">Personal Cloud File Server</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleUserClick}
              className="p-2 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              title="User Management"
            >
              <User className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <p className="text-sm font-medium text-neutral-900">{user?.username}</p>
              <p className="text-xs text-neutral-600 capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleSettingsClick}
              className="p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;