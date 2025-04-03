import { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, MemoryStick as Memory, Database, AlertCircle, Calculator, Trash, Plus, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { Tooltip } from './Tooltip';
import { LoadingSpinner } from './LoadingSpinner';

const COLORS = ['#3B82F6', '#1F2937'];

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

const DATA_REDUCTION_RATIOS = [
  1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 2.0
];

interface Processor {
  id: string;
  name: string;
  cores: number;
  frequency: string;
  generation: string;
  spec_int_base: number;
  tdp: number;
}

interface VirtualMachine {
  name: string;
  vCPUs: number;
  memory: number;
  storage: number;
  count: number;
}

interface ServerConfig {
  formFactor: '1U' | '2U';
  maxDisksPerServer: number;
  disksPerServer: number;
  diskSize: number;
  ftt: 1 | 2;
  raidType: 'RAID1' | 'RAID5';
  dataReductionRatio: number;
}

interface Server {
  id: number;
  cpu: number;
  memory: number;
  disk: number;
}

const FTT_RAID_FACTORS = {
  1: {
    'RAID1': 1/2,  // FTT 1 with RAID1: 1/2 factor
    'RAID5': 3/4   // FTT 1 with RAID5: 3/4 factor
  },
  2: {
    'RAID1': 1/3,  // FTT 2 with RAID1: 1/3 factor
    'RAID5': 2/3   // FTT 2 with RAID5: 2/3 factor
  }
};

const formatStorage = (gb: number): string => {
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(2)} TiB`;
  }
  return `${gb.toFixed(2)} GiB`;
};

const formatRawStorage = (gb: number): string => {
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(2)} TB`;
  }
  return `${gb.toFixed(2)} GB`;
};

const formatStorageSize = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb.toFixed(2)} GB`;
};

const calculateNetStorage = (rawStorage: number, ftt: number, dataReductionRatio: number): number => {
  const fttMultiplier = ftt + 1;
  const netStorage = (rawStorage / fttMultiplier) * dataReductionRatio;
  return netStorage;
};

const VsanCalculator = () => {
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [vms, setVms] = useState<VirtualMachine[]>([
    { name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }
  ]);
  const [vmCoreRatio, setVmCoreRatio] = useState(4);
  const [processorsPerServer, setProcessorsPerServer] = useState(2);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor | null>(null);
  const [considerNPlusOne, setConsiderNPlusOne] = useState(true);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    formFactor: '2U',
    maxDisksPerServer: 24,
    disksPerServer: 12,
    diskSize: DISK_SIZES[0],
    ftt: 1,
    raidType: 'RAID5',
    dataReductionRatio: 1.0
  });
  const [servers, setServers] = useState<Server[]>([{ id: 1, cpu: 0, memory: 0, disk: 0 }]);
  const [utilizationThreshold, setUtilizationThreshold] = useState(95);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{
    totalStorage: number;
    totalMemory: number;
    totalCpu: number;
    recommendedServers: number;
    rawStorage: number;
    netStorage: number;
    effectiveCapacity: number;
  } | null>(null);

  useEffect(() => {
    const fetchProcessors = async () => {
      const { data, error } = await supabase
        .from('processors')
        .select('*')
        .order('generation', { ascending: true })
        .order('spec_int_base', { ascending: false });

      if (error) {
        console.error('Error fetching processors:', error);
        return;
      }

      setProcessors(data);
      if (data.length > 0) {
        setSelectedProcessor(data[0]);
      }
    };

    fetchProcessors();
  }, []);

  useEffect(() => {
    // Atualiza os cálculos quando FTT, RAID ou Data Reduction Ratio mudar
    const totalRawStorage = calculateTotalRawStorage();
    const netStorage = calculateNetStorage(totalRawStorage, serverConfig.ftt, serverConfig.dataReductionRatio);
    const effectiveCapacity = netStorage * (utilizationThreshold / 100);

    if (result) {
      setResult({
        ...result,
        rawStorage: totalRawStorage,
        netStorage: netStorage,
        effectiveCapacity: effectiveCapacity
      });
    }
  }, [serverConfig.ftt, serverConfig.raidType, serverConfig.dataReductionRatio, utilizationThreshold]);

  const addVM = () => {
    setVms([...vms, {
      name: `VM-${vms.length + 1}`,
      vCPUs: 2,
      memory: 4,
      storage: 1024,
      count: 1
    }]);
  };

  const removeVM = (index: number) => {
    setVms(vms.filter((_, i) => i !== index));
  };

  const updateVM = (index: number, field: keyof VirtualMachine, value: number | string) => {
    const newVMs = [...vms];
    if (field === 'name') {
      newVMs[index] = { ...newVMs[index], [field]: value as string };
    } else {
      newVMs[index] = { ...newVMs[index], [field]: Number(value) };
    }
    setVms(newVMs);
  };

  const calculateTotalResources = () => {
    const totalCpu = servers.reduce((sum, server) => sum + server.cpu, 0);
    const totalMemory = servers.reduce((sum, server) => sum + server.memory, 0);
    const totalDisk = servers.reduce((sum, server) => sum + server.disk, 0);

    const usableCpu = totalCpu * (utilizationThreshold / 100);
    const usableMemory = totalMemory * (utilizationThreshold / 100);
    const usableDisk = totalDisk * (utilizationThreshold / 100);

    return {
      totalCpu,
      totalMemory,
      totalDisk,
      usableCpu,
      usableMemory,
      usableDisk
    };
  };

  const calculateRequiredServers = () => {
    if (!selectedProcessor) return { total: 0, forCompute: 0, forStorage: 0, storagePerServer: 0 };

    const totalResources = calculateTotalResources();
    
    // Calculate servers needed for compute
    const requiredCores = Math.ceil(totalResources.totalCpu / vmCoreRatio);
    const coresPerServer = selectedProcessor.cores * processorsPerServer;
    const serversForCompute = Math.ceil(requiredCores / coresPerServer);
    
    // Calculate servers needed for storage
    const totalStorageGB = totalResources.totalDisk;
    let usableStoragePerDisk = serverConfig.diskSize;

    // Apply vSAN FTT RAID factor
    usableStoragePerDisk *= FTT_RAID_FACTORS[serverConfig.ftt][serverConfig.raidType];

    // Apply data reduction ratio
    usableStoragePerDisk *= serverConfig.dataReductionRatio;

    const usableStoragePerServer = usableStoragePerDisk * serverConfig.disksPerServer;
    const serversForStorage = Math.ceil(totalStorageGB / usableStoragePerServer);
    
    // Get the maximum number of servers needed based on all resources
    let servers = Math.max(serversForCompute, serversForStorage);
    
    if (considerNPlusOne) {
      servers += 1;
    }

    return {
      total: servers,
      forCompute: serversForCompute,
      forStorage: serversForStorage,
      storagePerServer: usableStoragePerServer
    };
  };

  const calculateCPUUtilization = () => {
    if (!selectedProcessor) return 0;
    
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const totalAvailableCores = serverReqs.total * selectedProcessor.cores * 2;
    const cpuUtilization = (totalResources.usableCpu / (totalAvailableCores * vmCoreRatio)) * 100;
    
    return cpuUtilization;
  };

  const calculateStorageUtilization = () => {
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const storageUtilization = (totalResources.usableDisk / (serverReqs.total * serverReqs.storagePerServer)) * 100;
    
    return storageUtilization;
  };

  const calculateTotalSpecInt = () => {
    if (!selectedProcessor) return 0;
    const servers = calculateRequiredServers().total;
    return servers * selectedProcessor.spec_int_base * 2;
  };

  const handleFormFactorChange = (formFactor: '1U' | '2U') => {
    const maxDisks = formFactor === '1U' ? 10 : 24;
    setServerConfig({
      ...serverConfig,
      formFactor,
      maxDisksPerServer: maxDisks,
      disksPerServer: Math.min(serverConfig.disksPerServer, maxDisks)
    });
  };

  const totalResources = calculateTotalResources();
  const serverRequirements = calculateRequiredServers();
  const cpuUtilization = calculateCPUUtilization();
  const storageUtilization = calculateStorageUtilization();

  const cpuUtilizationData = [
    { name: 'Used', value: cpuUtilization },
    { name: 'Available', value: 100 - cpuUtilization }
  ];

  const storageUtilizationData = [
    { name: 'Used', value: storageUtilization },
    { name: 'Available', value: 100 - storageUtilization }
  ];

  const calculateTotalRawStorage = () => {
    const totalDisks = serverConfig.disksPerServer * (considerNPlusOne ? serverRequirements.total + 1 : serverRequirements.total);
    return totalDisks * serverConfig.diskSize;
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      // Reset VMs to initial state
      setVms([{ name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }]);
      
      // Reset server configuration to default
      setServerConfig({
        formFactor: '2U',
        maxDisksPerServer: 24,
        disksPerServer: 12,
        diskSize: DISK_SIZES[0],
        ftt: 1,
        raidType: 'RAID5',
        dataReductionRatio: 1.0
      });

      // Reset other settings
      setVmCoreRatio(4);
      setConsiderNPlusOne(true);
      
      // Reset processor selection to first available
      if (processors.length > 0) {
        setSelectedProcessor(processors[0]);
      }
    }
  };

  const calculateVsan = () => {
    setIsCalculating(true);
    // Simulando um delay para mostrar o loading
    setTimeout(() => {
      const totalStorage = servers.reduce((sum, server) => sum + server.disk, 0);
      const totalMemory = servers.reduce((sum, server) => sum + server.memory, 0);
      const totalCpu = servers.reduce((sum, server) => sum + server.cpu, 0);
      const totalRawStorage = calculateTotalRawStorage();
      const netStorage = calculateNetStorage(totalRawStorage, serverConfig.ftt, serverConfig.dataReductionRatio);
      const effectiveCapacity = netStorage * (utilizationThreshold / 100);

      // Cálculo simplificado para exemplo
      const recommendedServers = Math.ceil(
        (totalStorage * (100 / utilizationThreshold)) / 1000
      );

      setResult({
        totalStorage,
        totalMemory,
        totalCpu,
        recommendedServers,
        rawStorage: totalRawStorage,
        netStorage: netStorage,
        effectiveCapacity: effectiveCapacity
      });
      setIsCalculating(false);
    }, 1000);
  };

  const addServer = () => {
    setServers([...servers, { id: servers.length + 1, cpu: 0, memory: 0, disk: 0 }]);
  };

  const removeServer = (id: number) => {
    setServers(servers.filter((server) => server.id !== id));
  };

  const updateServer = (id: number, field: keyof Server, value: number) => {
    const newServers = servers.map((server) =>
      server.id === id ? { ...server, [field]: value } : server
    );
    setServers(newServers);
  };

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Static */}
      <div className="bg-slate-800/50 p-4 backdrop-blur-sm border-b border-blue-500/30">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator size={24} className="text-blue-400" />
          Calculadora vSAN
          <Tooltip 
            text="Calcule a capacidade necessária para sua infraestrutura vSAN baseada nos requisitos de CPU, memória e armazenamento."
            position="right"
          />
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrollable Inputs Section */}
        <div className="bg-slate-800/50 rounded-lg backdrop-blur-sm border border-blue-500/30">
          <div className="p-4 border-b border-blue-500/30">
            <h3 className="text-lg font-semibold text-white">Configuração dos Servidores</h3>
          </div>
          <div className="h-[calc(100vh-12rem)] overflow-y-auto p-4 space-y-6">
            {servers.map((server, index) => (
              <div key={server.id} className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Server size={20} className="text-blue-400" />
                    Servidor {index + 1}
                  </h3>
                  <button
                    onClick={() => removeServer(server.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={servers.length === 1}
                  >
                    <Trash size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Cpu size={16} className="text-blue-400" />
                      CPUs
                      <Tooltip text="Número de CPUs por servidor" />
                    </label>
                    <input
                      type="number"
                      value={server.cpu}
                      onChange={(e) => updateServer(server.id, 'cpu', Number(e.target.value))}
                      className="w-full bg-slate-600/50 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Memory size={16} className="text-blue-400" />
                      Memória (GB)
                      <Tooltip text="Quantidade de memória RAM em GB" />
                    </label>
                    <input
                      type="number"
                      value={server.memory}
                      onChange={(e) => updateServer(server.id, 'memory', Number(e.target.value))}
                      className="w-full bg-slate-600/50 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                      <HardDrive size={16} className="text-blue-400" />
                      Armazenamento (GB)
                      <Tooltip text="Capacidade de armazenamento em GB" />
                    </label>
                    <input
                      type="number"
                      value={server.disk}
                      onChange={(e) => updateServer(server.id, 'disk', Number(e.target.value))}
                      className="w-full bg-slate-600/50 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                Threshold de Utilização (%)
                <Tooltip text="Porcentagem máxima de utilização permitida para o vSAN" />
              </label>
              <input
                type="number"
                value={utilizationThreshold}
                onChange={(e) => setUtilizationThreshold(Number(e.target.value))}
                className="w-full bg-slate-600/50 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="1"
                max="100"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={addServer}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-white px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50"
              >
                <Plus size={20} />
                Adicionar Servidor
              </button>
              <button
                onClick={calculateVsan}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <LoadingSpinner size="sm" text="Calculando..." />
                ) : (
                  'Calcular'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Static Results Section */}
        <div className="bg-slate-800/50 rounded-lg backdrop-blur-sm border border-blue-500/30 p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Resultados</h3>
          {result && !isCalculating ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Armazenamento Total</p>
                <p className="text-2xl font-bold text-white">{formatStorage(result.totalStorage)}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Memória Total</p>
                <p className="text-2xl font-bold text-white">{result.totalMemory} GB</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">CPUs Totais</p>
                <p className="text-2xl font-bold text-white">{result.totalCpu}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Servidores Recomendados</p>
                <p className="text-2xl font-bold text-white">{result.recommendedServers}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Armazenamento Bruto</p>
                <p className="text-2xl font-bold text-white">{formatRawStorage(result.rawStorage)}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Armazenamento Líquido</p>
                <p className="text-2xl font-bold text-white">{formatStorage(result.netStorage)}</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-blue-500/20">
                <p className="text-slate-300">Capacidade Efetiva</p>
                <p className="text-2xl font-bold text-white">{formatStorage(result.effectiveCapacity)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              {isCalculating ? (
                <LoadingSpinner size="lg" text="Calculando resultados..." />
              ) : (
                <p>Configure os servidores e clique em Calcular para ver os resultados</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VsanCalculator;