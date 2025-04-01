import { useState } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import './App.css'
import ServerCalculator from './components/ServerCalculator'
import VirtualizationCalculator from './components/VirtualizationCalculator'
import StorageCalculator from './components/StorageCalculator'
import VsanCalculator from './components/VsanCalculator'
import BackupCalculator from './components/BackupCalculator'
import Header from './components/Header'
import { Desktop, Cpu, HardDrive, Globe, Database, ArrowRight } from 'phosphor-react'
import { auth0Config } from './auth0-config'

function AppContent() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <header className="flex justify-between items-center mb-12">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">InfiniSizing</h1>
          </header>
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Transforme suas ideias em Infraestrutura
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Nossa ferramenta foi desenvolvida para apoiar Pre sales e Arquitetos de Soluções com estimativas precisas de sizing. 
                Simplifique seus cálculos e tome decisões mais informadas para seus projetos.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => loginWithRedirect()} 
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-2 mx-auto"
                >
                  Começar Agora
                  <ArrowRight size={20} />
                </button>
                <p className="text-slate-400 text-sm">
                  Acesso seguro e gratuito para profissionais de TI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">InfiniSizing</h1>
            <p className="text-slate-300 max-w-2xl">
              Ferramenta especializada para estimativas de sizing, desenvolvida para Pre sales e Arquitetos de Soluções.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">Olá, {user?.name}</span>
            <button 
              onClick={() => logout()} 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('physical')}
            className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'physical'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                activeTab === 'physical' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                <Desktop size={24} className={activeTab === 'physical' ? 'text-white' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Servidores Físicos</h3>
                <p className="text-sm text-slate-400">Cálculo de recursos físicos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('virtual')}
            className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'virtual'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                activeTab === 'virtual' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                <Cpu size={24} className={activeTab === 'virtual' ? 'text-white' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Virtualização</h3>
                <p className="text-sm text-slate-400">Dimensionamento de VMs</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'storage'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                activeTab === 'storage' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                <HardDrive size={24} className={activeTab === 'storage' ? 'text-white' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Armazenamento</h3>
                <p className="text-sm text-slate-400">Cálculo de storage</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('vsan')}
            className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'vsan'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                activeTab === 'vsan' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                <Globe size={24} className={activeTab === 'vsan' ? 'text-white' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">vSAN</h3>
                <p className="text-sm text-slate-400">Dimensionamento vSAN</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'backup'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                activeTab === 'backup' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                <Database size={24} className={activeTab === 'backup' ? 'text-white' : 'text-blue-400'} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold mb-1">Backup</h3>
                <p className="text-sm text-slate-400">Cálculo de backup</p>
              </div>
            </div>
          </button>
        </div>

        {/* Main Content */}
        <main className="bg-slate-800/50 rounded-xl p-6 shadow-xl">
          {activeTab === 'physical' && <ServerCalculator />}
          {activeTab === 'virtual' && <VirtualizationCalculator />}
          {activeTab === 'storage' && <StorageCalculator />}
          {activeTab === 'vsan' && <VsanCalculator />}
          {activeTab === 'backup' && <BackupCalculator />}
        </main>
      </div>
      
      <footer className="text-center py-4 text-slate-400 text-sm border-t border-slate-800">
        <p>Desenvolvido por Cesar Virno © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AppContent />
    </Auth0Provider>
  );
}

export default App