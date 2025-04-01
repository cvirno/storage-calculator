import React, { useState } from 'react';
import { Server as ServerTower, Cpu, Database, HardDrive, Network } from 'lucide-react';
import ServerCalculator from './components/ServerCalculator';
import VirtualizationCalculator from './components/VirtualizationCalculator';
import BackupCalculator from './components/BackupCalculator';
import StorageCalculator from './components/StorageCalculator';
import VsanCalculator from './components/VsanCalculator';
import Header from './components/Header';

function App() {
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Private Cloud Sizing</h1>
        
        {/* Top Navigation */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'physical'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <ServerTower size={20} />
            Physical Servers
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'virtual'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Cpu size={20} />
            Virtualization
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'storage'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <HardDrive size={20} />
            Storage
          </button>
          <button
            onClick={() => setActiveTab('vsan')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'vsan'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Network size={20} />
            vSAN
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'backup'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Database size={20} />
            Backup
          </button>
        </div>

        {/* Main Content */}
        <main className="pb-4">
          {activeTab === 'physical' && <ServerCalculator />}
          {activeTab === 'virtual' && <VirtualizationCalculator />}
          {activeTab === 'storage' && <StorageCalculator />}
          {activeTab === 'vsan' && <VsanCalculator />}
          {activeTab === 'backup' && <BackupCalculator />}
        </main>
      </div>
      
      <footer className="text-center py-2 text-slate-400 text-[10px]">
        <p>Desenvolvido por Cesar Virno © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;