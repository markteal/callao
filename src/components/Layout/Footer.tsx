import React from 'react';
import { ExternalLink, Zap } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          © 2025 AeroTeal Management LLC
        </div>
        
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
        >
          <Zap className="w-4 h-4" />
          <span>Built with Bolt.new</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;