import { useState } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import './App.css'
import ServerCalculator from './components/ServerCalculator'
import VirtualizationCalculator from './components/VirtualizationCalculator'
import StorageCalculator from './components/StorageCalculator'
import VsanCalculator from './components/VsanCalculator'
import BackupCalculator from './components/BackupCalculator'
import Header from './components/Header'
import { Desktop, Cpu, HardDrive, Globe, Database, ArrowRight, ChartLine, Users, Shield, SignOut, SignIn } from 'phosphor-react'
import { auth0Config } from './auth0-config'

function AppContent() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } = useAuth0();
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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

          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 animate-float">
                <Desktop size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 animate-float-delayed">
                <Globe size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 animate-float-more-delayed">
                <Database size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 animate-float-most-delayed">
                <HardDrive size={32} className="mx-auto text-blue-400" />
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Bem-vindo ao InfiniSizing</h2>
            <p className="text-lg text-slate-300 mb-8">
              Calcule e otimize seus recursos de data center com precisão
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                <Shield size={24} className="mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-slate-300">Segurança</p>
              </div>
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                <ChartLine size={24} className="mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-slate-300">Precisão</p>
              </div>
              <div className="p-4 bg-blue-800/20 rounded-lg backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                <Users size={24} className="mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-slate-300">Colaboração</p>
              </div>
            </div>

            <button
              onClick={() => loginWithRedirect()}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-white px-8 py-3 rounded-lg text-lg font-medium flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <SignIn size={24} />
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">InfiniSizing</h1>
            {user && (
              <p className="text-sm text-slate-400">
                Olá, {user.name || user.email}
              </p>
            )}
          </div>
          <div className="auth-buttons">
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-white transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50"
                >
                  <SignOut size={20} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Navigation */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'physical'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Desktop size={20} />
            Servidores Físicos
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'virtual'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu size={20} />
            Virtualização
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'storage'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardDrive size={20} />
            Armazenamento
          </button>
          <button
            onClick={() => setActiveTab('vsan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'vsan'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe size={20} />
            vSAN
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AppContent />
    </Auth0Provider>
  );
}

export default App