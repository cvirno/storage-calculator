import React from 'react';
import { Database, Bell, Settings } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 py-2">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-500" />
            <div>
              <h1 className="text-base font-bold text-white">InfiniSizing</h1>
              <p className="text-xs text-slate-400">por Cesar Virno</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-slate-700/50 rounded transition-colors relative">
              <Bell size={16} className="text-slate-400" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            </button>
            <button className="p-1 hover:bg-slate-700/50 rounded transition-colors">
              <Settings size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;