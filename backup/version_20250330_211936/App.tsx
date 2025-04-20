import React, { useState } from 'react';
import Header from './components/Header';
import ServerCalculator from './components/ServerCalculator';
import VirtualizationCalculator from './components/VirtualizationCalculator';
import VsanCalculator from './components/VsanCalculator';
import BackupCalculator from './components/BackupCalculator';
import RackVisualization from './components/RackVisualization';

function App() {
  const [activeTab, setActiveTab] = useState('server');
  const [servers, setServers] = useState<Array<{
    id: string;
    name: string;
    rackUnits: number;
    processors?: number;
    coresPerProcessor?: number;
  }>>([]);
  const [view, setView] = useState<'front' | 'rear'>('front');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'server' && <ServerCalculator />}
        {activeTab === 'virtualization' && <VirtualizationCalculator />}
        {activeTab === 'vsan' && <VsanCalculator />}
        {activeTab === 'backup' && <BackupCalculator />}
        {activeTab === 'rack' && <RackVisualization servers={servers} view={view} />}
      </main>
    </div>
  );
}

export default App; 