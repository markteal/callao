import React from 'react';
import { 
  Home, 
  FolderOpen, 
  Activity, 
  Settings, 
  Users, 
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'files', label: 'File Manager', icon: FolderOpen },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'storage', label: 'Storage Analytics', icon: HardDrive },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 h-full flex flex-col">
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Image link at bottom of sidebar */}
      <div className="p-4 border-t border-neutral-200">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full hover:opacity-80 transition-opacity duration-200"
        >
          <img
            src="https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/refs/heads/main/src/public/bolt-badge/black_circle_360x360/black_circle_360x360.png"
            alt="Built with Bolt.new"
            className="w-full h-auto rounded-lg shadow-sm border border-neutral-200"
            style={{ width: '100px', height: '100px' }}
          />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;