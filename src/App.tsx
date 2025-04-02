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
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <header className="flex justify-between items-center mb-12 animate-fade-in">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white">InfiniSizing</h1>
              <span className="text-sm text-blue-300">By Cesar Virno</span>
            </div>
            <button
              onClick={() => logout()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <SignOut size={16} />
              Logout
            </button>
          </header>

          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-blue-800/30 rounded-lg animate-float">
                <Desktop size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/30 rounded-lg animate-float-delayed">
                <Globe size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/30 rounded-lg animate-float-more-delayed">
                <Database size={32} className="mx-auto text-blue-400" />
              </div>
              <div className="p-4 bg-blue-800/30 rounded-lg animate-float-most-delayed">
                <HardDrive size={32} className="mx-auto text-blue-400" />
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6">Bem-vindo ao InfiniSizing</h2>
            <p className="text-lg text-slate-300 mb-8">
              Calcule e otimize seus recursos de data center com precisão
            </p>

            <div className="bg-slate-800/50 p-4 rounded-lg text-sm text-slate-300 mb-8">
              <h2 className="font-semibold text-blue-400 mb-2">Aviso Legal:</h2>
              <p className="mb-2">
                As estimativas e os cálculos gerados pelo InfiniSizing são de caráter aproximativo e têm como objetivo servir como apoio à tomada de decisão. A ferramenta não substitui análises técnicas detalhadas ou a consulta a especialistas.
              </p>
              <p className="mb-2">
                A responsabilidade pela interpretação e pelo uso das informações fornecidas é exclusivamente do usuário. A equipe do InfiniSizing se exime de qualquer responsabilidade por decisões tomadas com base nos resultados apresentados pela ferramenta.
              </p>
              <p>
                Utilize o InfiniSizing como um recurso adicional para impulsionar sua capacidade analítica, respeitando os limites de sua função e aplicabilidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-800/30 rounded-lg">
                <Shield size={24} className="mx-auto text-blue-400 mb-2" />
              </div>
              <div className="p-4 bg-blue-800/30 rounded-lg">
                <ChartLine size={24} className="mx-auto text-blue-400 mb-2" />
              </div>
              <div className="p-4 bg-blue-800/30 rounded-lg">
                <Users size={24} className="mx-auto text-blue-400 mb-2" />
              </div>
            </div>

            <button
              onClick={() => loginWithRedirect()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
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
            <p className="text-sm text-slate-400 max-w-2xl">
              Essa ferramenta tem o intuito de ajudar Pre sales e Arquitetos de Soluçãoes com ESTIMATIVAS de SIZING, portanto a ferramente pode apresentar calculos incorretos e sempre recomendo verificar com o seu projeto os cálculso apresentados.
            </p>
          </div>
          <div className="auth-buttons">
            {isAuthenticated && (
              <div className="user-info">
                <span className="welcome-text">Bem Vindo ao InfiniSizing</span>
                <button onClick={() => logout()} className="logout-button">
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Navigation */}
        <div className="flex gap-3 mb-6">
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
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'storage'
                ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <HardDrive size={20} />
            Armazenamento
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