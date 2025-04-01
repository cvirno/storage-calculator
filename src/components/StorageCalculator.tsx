import React, { useState } from 'react';
import { HardDrive, Database, Download, Activity, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Server {
  id: string;
  name: string;
  quantity: number;
  rackUnits: number;
  processorId: string;
  processors: number;
  coresPerProcessor: number;
  disks: number;
  diskSize: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6';
}

interface StorageConfig {
  desiredCapacity: number;
  growthRate: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  diskSize: number;
  numberOfDisks: number;
  forecastYears: number;
}

interface ServerConfig {
  maxUtilization: number;
  memoryDimmSize: number;
  memoryDimmsPerServer: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DISK_SIZES = [
  240,      // 240 GB
  480,      // 480 GB
  960,      // 960 GB
  1920,     // 1.92 TB
  2048,     // 2 TB
  3840,     // 3.84 TB
  4096,     // 4 TB
  6144,     // 6 TB
  7680,     // 7.68 TB
  8192,     // 8 TB
  10240,    // 10 TB
  12288,    // 12 TB
  14336,    // 14 TB
  15360,    // 15.36 TB
  16384,    // 16 TB
  18432,    // 18 TB
  20480,    // 20 TB
  22000,    // 22 TB
  24000,    // 24 TB
];

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

const formatStorage = (gb: number): string => {
  const GiB = gb * (1000/1024); // Convert GB to GiB
  if (GiB >= 1024) {
    const TiB = GiB / 1024;
    // Use exact decimal points for specific values
    if (Math.abs(TiB - 1.92) < 0.01) return '1.92 TiB';
    if (Math.abs(TiB - 3.84) < 0.01) return '3.84 TiB';
    if (Math.abs(TiB - 7.68) < 0.01) return '7.68 TiB';
    if (Math.abs(TiB - 15.36) < 0.01) return '15.36 TiB';
    // For standard TiB values, show as whole numbers
    if (Math.floor(TiB) === TiB) return `${TiB} TiB`;
    return `${TiB.toFixed(2)} TiB`;
  }
  return `${GiB.toFixed(2)} GiB`;
};

const StorageCalculator = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [considerNPlusOne, setConsiderNPlusOne] = useState(false);
  const [newServer, setNewServer] = useState<Omit<Server, 'id'>>({
    name: '',
    quantity: 1,
    rackUnits: 1,
    processorId: '',
    processors: 1,
    coresPerProcessor: 0,
    disks: 1,
    diskSize: DISK_SIZES[0],
    raidType: 'RAID 1'
  });

  const addServer = () => {
    if (editingServer) {
      setServers(servers.map(server => 
        server.id === editingServer ? { ...newServer, id: server.id } : server
      ));
      setEditingServer(null);
    } else {
      const newServers = Array.from({ length: newServer.quantity }, (_, index) => ({
        ...newServer,
        id: `${Date.now()}-${index}`,
        name: newServer.quantity > 1 ? `${newServer.name}-${index + 1}` : newServer.name
      }));
      setServers([...servers, ...newServers]);
    }

    setNewServer({
      name: '',
      quantity: 1,
      rackUnits: 1,
      processorId: '',
      processors: 1,
      coresPerProcessor: 0,
      disks: 1,
      diskSize: DISK_SIZES[0],
      raidType: 'RAID 1'
    });
  };

  const deleteServer = (id: string) => {
    setServers(servers.filter(server => server.id !== id));
  };

  const clearAllServers = () => {
    setServers([]);
    setEditingServer(null);
  };

  const editServer = (server: Server) => {
    setNewServer({
      name: server.name,
      quantity: 1,
      rackUnits: server.rackUnits,
      processorId: server.processorId,
      processors: server.processors,
      coresPerProcessor: server.coresPerProcessor,
      disks: server.disks,
      diskSize: server.diskSize,
      raidType: server.raidType
    });
    setEditingServer(server.id);
  };

  const calculateTotalStorage = (server: Server) => {
    const totalRawStorage = server.disks * server.diskSize;
    switch (server.raidType) {
      case 'RAID 1': return totalRawStorage / 2;
      case 'RAID 5': return totalRawStorage * ((server.disks - 1) / server.disks);
      case 'RAID 6': return totalRawStorage * ((server.disks - 2) / server.disks);
      default: return totalRawStorage;
    }
  };

  return (
    <div className="space-y-8">
      {/* Server List */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Adição de Servidores</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nPlusOne"
                checked={considerNPlusOne}
                onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500"
              />
              <label htmlFor="nPlusOne" className="text-sm text-slate-300">
                Considerar N+1
              </label>
            </div>
            <button
              onClick={clearAllServers}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Limpar Todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {servers.map((server) => (
            <div key={server.id} className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Server className="text-blue-400" size={20} />
                    <span className="font-medium">{server.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{server.rackUnits}U</span>
                    <span>•</span>
                    <span>{server.processors}x Processador</span>
                    <span>•</span>
                    <span>{server.disks}x {formatStorage(server.diskSize)}</span>
                    <span>•</span>
                    <span>{server.raidType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editServer(server)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteServer(server.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Server Form */}
        <div className="mt-6 bg-slate-700 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nome do Servidor
              </label>
              <input
                type="text"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
                placeholder="Nome do servidor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                value={newServer.quantity}
                onChange={(e) => setNewServer({ ...newServer, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Unidades de Rack
              </label>
              <input
                type="number"
                value={newServer.rackUnits}
                onChange={(e) => setNewServer({ ...newServer, rackUnits: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Processadores
              </label>
              <input
                type="number"
                value={newServer.processors}
                onChange={(e) => setNewServer({ ...newServer, processors: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Discos
              </label>
              <input
                type="number"
                value={newServer.disks}
                onChange={(e) => setNewServer({ ...newServer, disks: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tamanho do Disco
              </label>
              <select
                value={newServer.diskSize}
                onChange={(e) => setNewServer({ ...newServer, diskSize: Number(e.target.value) })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
              >
                {DISK_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {formatStorage(size)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tipo de RAID
              </label>
              <select
                value={newServer.raidType}
                onChange={(e) => setNewServer({ ...newServer, raidType: e.target.value as Server['raidType'] })}
                className="w-full bg-slate-600 rounded-lg px-4 py-2 text-sm"
              >
                <option value="RAID 1">RAID 1</option>
                <option value="RAID 5">RAID 5</option>
                <option value="RAID 6">RAID 6</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={addServer}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                {editingServer ? 'Atualizar Servidor' : 'Adicionar Servidor'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Total de Servidores</div>
          <div className="text-2xl font-bold">
            {servers.length}{considerNPlusOne && servers.length > 0 ? ' (+1)' : ''}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Armazenamento Bruto</div>
          <div className="text-2xl font-bold">
            {formatStorage(servers.reduce((acc, server) => acc + (server.disks * server.diskSize), 0))}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Armazenamento Utilizável</div>
          <div className="text-2xl font-bold">
            {formatStorage(servers.reduce((acc, server) => acc + calculateTotalStorage(server), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageCalculator;