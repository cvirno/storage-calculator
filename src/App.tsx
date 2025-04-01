import { useState } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import './App.css'
import ServerCalculator from './components/ServerCalculator'
import VirtualizationCalculator from './components/VirtualizationCalculator'
import StorageCalculator from './components/StorageCalculator'
import VsanCalculator from './components/VsanCalculator'
import BackupCalculator from './components/BackupCalculator'
import Header from './components/Header'
import { Desktop, Cpu, HardDrive, Globe, Database } from 'phosphor-react'
import { auth0Config } from './auth0-config'

function AppContent() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>InfiniSizing</h1>
          <div className="auth-buttons">
            <button onClick={() => loginWithRedirect()} className="login-button">
              Login
            </button>
          </div>
        </header>
        <div className="login-message">
          <h2 className="text-2xl font-bold mb-4">Bem-vindo ao InfiniSizing!</h2>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nosso aplicativo foi desenvolvido com o objetivo de apoiar na arquitetura de infraestrutura, proporcionando informações e insights úteis para seus projetos. No entanto, ressaltamos que os resultados obtidos e decisões tomadas com base nas informações fornecidas pelo aplicativo são de total responsabilidade do usuário.
          </p>
          <p className="mt-4 text-slate-400">Por favor, faça login para acessar a calculadora.</p>
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
            <p className="text-sm text-slate-400 max-w-2xl">
              Essa ferramenta tem o intuito de ajudar Pre sales e Arquitetos de Soluçãoes com ESTIMATIVAS de SIZING, portanto a ferramente pode apresentar calculos incorretos e sempre recomendo verificar com o seu projeto os cálculso apresentados.
            </p>
          </div>
          <div className="auth-buttons">
            <div className="user-info">
              <span className="welcome-text">Bem Vindo ao InfiniSizing</span>
              <button onClick={() => logout()} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
        
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
            <Desktop size={20} />
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
            <Globe size={20} />
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

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AppContent />
    </Auth0Provider>
  );
}

export default App