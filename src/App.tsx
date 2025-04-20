import React, { useState } from 'react'
import './App.css'
import ServerCalculator from './components/ServerCalculator'
import VirtualizationCalculator from './components/VirtualizationCalculator'
import VsanCalculator from './components/VsanCalculator'
import BackupCalculator from './components/BackupCalculator'
import TestComponent from './components/TestComponent'
import Header from './components/Header'
import { Desktop, Cpu, HardDrive, Globe } from 'phosphor-react'

function App() {
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'vsan'>('physical');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <header className="flex justify-between items-center mb-12 animate-fade-in">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">InfiniSizing</h1>
            <span className="text-sm text-blue-300">By Cesar Virno</span>
          </div>
        </header>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'physical'
                ? 'bg-blue-600/40 text-white'
                : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/40'
            }`}
          >
            <Desktop size={20} />
            Servidores
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'virtual'
                ? 'bg-blue-600/40 text-white'
                : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/40'
            }`}
          >
            <Cpu size={20} />
            Virtualização
          </button>
          <button
            onClick={() => setActiveTab('vsan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'vsan'
                ? 'bg-blue-600/40 text-white'
                : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/40'
            }`}
          >
            <HardDrive size={20} />
            vSAN
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'backup'
                ? 'bg-blue-600/40 text-white'
                : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/40'
            }`}
          >
            <Globe size={20} />
            Backup
          </button>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'physical' && <ServerCalculator />}
          {activeTab === 'virtual' && <VirtualizationCalculator />}
          {activeTab === 'vsan' && <VsanCalculator />}
          {activeTab === 'backup' && <BackupCalculator />}
        </div>
      </div>
    </div>
  );
}

export default App;