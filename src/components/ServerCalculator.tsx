import React, { useState, useRef, useEffect } from 'react';
import { HardDrive, Plus, AlertTriangle, Trash2, Download, Edit2, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import RackVisualization from './RackVisualization';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { mockProcessors } from '../lib/mockData';

interface Processor {
  id: string;
  name: string;
  cores: number;
  frequency: string;
  generation: string;
  spec_int_base: number;
  tdp: number;
}

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

const COLORS = ['#3B82F6', '#10B981'];

const DISK_SIZES = [
  240,      // 240 GB
  480,      // 480 GB
  960,      // 960 GB
  1966.08,  // 1.92 TB
  2048,     // 2 TB
  3932.16,  // 3.84 TB
  4096,     // 4 TB
  6144,     // 6 TB
  7864.32,  // 7.68 TB
  8192,     // 8 TB
  10240,    // 10 TB
  12288,    // 12 TB
  14336,    // 14 TB
  15728.64, // 15.36 TB
  16384,    // 16 TB
  18432,    // 18 TB
  20480,    // 20 TB
  22528,    // 22 TB
  24576,    // 24 TB
];

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

const ServerCalculator = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [rackView, setRackView] = useState<'front' | 'rear'>('front');
  const [considerNPlusOne, setConsiderNPlusOne] = useState(false);
  const [processors, setProcessors] = useState<Processor[]>(mockProcessors);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor>(mockProcessors[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [newServer, setNewServer] = useState<Omit<Server, 'id'>>({
    name: '',
    quantity: 1,
    rackUnits: 1,
    processorId: mockProcessors[0].id,
    processors: 1,
    coresPerProcessor: mockProcessors[0].cores,
    disks: 1,
    diskSize: DISK_SIZES[0],
    raidType: 'RAID 1'
  });

  useEffect(() => {
    const fetchProcessors = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('processors')
          .select('*')
          .order('generation', { ascending: false })
          .order('spec_int_base', { ascending: false });

        if (error) {
          console.error('Error fetching processors:', error);
          return;
        }

        if (data && data.length > 0) {
          setProcessors(data);
          setSelectedProcessor(data[0]);
          setNewServer(prev => ({
            ...prev,
            processorId: data[0].id,
            coresPerProcessor: data[0].cores
          }));
        }
      } catch (error) {
        console.error('Error in fetchProcessors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessors();
  }, []);

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

    const defaultProcessor = processors[0];
    setNewServer({
      name: '',
      quantity: 1,
      rackUnits: 1,
      processorId: defaultProcessor?.id || '',
      processors: 1,
      coresPerProcessor: defaultProcessor?.cores || 0,
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

  const calculateTotalSpecInt = () => {
    return servers.reduce((total, server) => {
      const processor = processors.find(p => p.id === server.processorId);
      return total + (processor?.spec_int_base ?? 0) * server.processors;
    }, 0);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#0f172a'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('data-center-report.pdf');
  };

  const handleProcessorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProcessor = processors.find(p => p.id === e.target.value);
    if (selectedProcessor) {
      setNewServer({
        ...newServer,
        processorId: selectedProcessor.id,
        coresPerProcessor: selectedProcessor.cores
      });
    }
  };

  const handleDiskSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewServer({ ...newServer, diskSize: parseInt(e.target.value) });
  };

  const storageData = [
    { name: 'Armazenamento Bruto', value: servers.reduce((acc, server) => acc + (server.disks * server.diskSize), 0) },
    { name: 'Armazenamento Utilizável', value: servers.reduce((acc, server) => acc + calculateTotalStorage(server), 0) }
  ];

  if (isLoading) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="flex flex-row-reverse gap-8">
      <div className="w-[400px] flex-shrink-0">
        <div className="sticky top-2">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">Gerenciamento de Servidores</h2>
            <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nome do Servidor
                  </label>
                  <input
                    type="text"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Digite o nome do servidor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={newServer.quantity}
                    onChange={(e) => setNewServer({ ...newServer, quantity: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    disabled={editingServer !== null}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Unidades de Rack (U)
                  </label>
                  <input
                    type="number"
                    value={newServer.rackUnits}
                    onChange={(e) => setNewServer({ ...newServer, rackUnits: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max="42"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Modelo do Processador
                  </label>
                  <select
                    value={newServer.processorId}
                    onChange={handleProcessorChange}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {processors.map((processor) => (
                      <option key={processor.id} value={processor.id}>
                        {processor.name} ({processor.cores} cores)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Número de Processadores
                  </label>
                  <input
                    type="number"
                    value={newServer.processors}
                    onChange={(e) => setNewServer({ ...newServer, processors: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Número de Discos
                  </label>
                  <input
                    type="number"
                    value={newServer.disks}
                    onChange={(e) => setNewServer({ ...newServer, disks: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tamanho do Disco
                  </label>
                  <select
                    value={newServer.diskSize}
                    onChange={handleDiskSizeChange}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
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
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="RAID 1">RAID 1</option>
                    <option value="RAID 5">RAID 5</option>
                    <option value="RAID 6">RAID 6</option>
                  </select>
                </div>
              </div>

              <button
                onClick={addServer}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                {editingServer ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingServer ? 'Atualizar Servidor' : 'Adicionar Servidor'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllServers}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
              Limpar Tudo
            </button>
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
              <input
                type="checkbox"
                id="nPlusOne"
                checked={considerNPlusOne}
                onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                className="rounded border-slate-500"
              />
              <label htmlFor="nPlusOne" className="text-sm text-slate-300">
                Redundância N+1
              </label>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Exportar Relatório
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Total de Servidores</div>
            <div className="text-2xl font-bold">
              {servers.length}{considerNPlusOne && servers.length > 0 ? ' (+1)' : ''}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Total SPECint Rate</div>
            <div className="text-2xl font-bold">
              {calculateTotalSpecInt().toLocaleString()}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Lista de Servidores</h2>
              <span className="text-sm text-slate-400">
                {servers.length} servidor{servers.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {servers.map(server => {
                const processor = processors.find(p => p.id === server.processorId);
                return (
                  <div
                    key={server.id}
                    className="bg-slate-700/50 p-2 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Server size={14} className="text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{server.name}</h3>
                        <p className="text-xs text-slate-400 truncate">
                          {server.processors}x {processor?.name.split(' ').slice(-1)[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => editServer(server)}
                        className="p-1 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => deleteServer(server.id)}
                        className="p-1 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Distribuição de Armazenamento</h2>
              <div className="text-sm text-slate-400">
                Total: {formatStorage(storageData[0].value)}
              </div>
            </div>
            {servers.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {storageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatStorage(Number(value))}
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem'
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                Nenhum servidor adicionado ainda
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Layout do Rack</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setRackView('front')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    rackView === 'front'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Vista Frontal
                </button>
                <button
                  onClick={() => setRackView('rear')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    rackView === 'rear'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Vista Traseira
                </button>
              </div>
            </div>
            <RackVisualization servers={servers} view={rackView} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerCalculator;