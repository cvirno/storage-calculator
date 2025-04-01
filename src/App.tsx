import React, { useState } from 'react';
import { Server as ServerTower, Cpu, Database, HardDrive, Network } from 'lucide-react';
import ServerCalculator from './components/ServerCalculator';
import VirtualizationCalculator from './components/VirtualizationCalculator';
import BackupCalculator from './components/BackupCalculator';
import StorageCalculator from './components/StorageCalculator';
import VsanCalculator from './components/VsanCalculator';
import Header from './components/Header';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import { auth0Config } from './auth0-config';

function AppContent() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Storage Calculator</h1>
        <div className="auth-buttons">
          {!isAuthenticated ? (
            <button onClick={() => loginWithRedirect()} className="login-button">
              Login
            </button>
          ) : (
            <div className="user-info">
              <span>Bem-vindo, {user?.name}</span>
              <button onClick={() => logout()} className="logout-button">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        {isAuthenticated ? (
          <StorageCalculator />
        ) : (
          <div className="login-message">
            <h2>Bem-vindo ao Storage Calculator</h2>
            <p>Por favor, faça login para acessar a calculadora.</p>
          </div>
        )}
      </main>
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

export default App;