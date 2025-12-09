import React from 'react';
import { Home, Sprout, MapPin, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'locations' | 'settings';
  onTabChange: (tab: 'home' | 'locations' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen pb-20 bg-slate-50 relative">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
        {children}
      </main>
      
      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 max-w-md mx-auto">
        <div className="flex justify-around items-center p-2">
          <button 
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Garden</span>
          </button>
          <button 
            onClick={() => onTabChange('locations')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'locations' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapPin size={24} strokeWidth={activeTab === 'locations' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Zones</span>
          </button>
          <button 
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;