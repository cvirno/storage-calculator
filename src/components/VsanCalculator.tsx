import { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, MemoryStick as Memory, Database, AlertCircle } from 'lucide-react';
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

      // Cálculo simplificado para exemplo
      const recommendedServers = Math.ceil(
        (totalStorage * (100 / utilizationThreshold)) / 1000
      );

      setResult({
        totalStorage,
        totalMemory,
        totalCpu,
        recommendedServers
      });
      setIsCalculating(false);
    }, 1000);
  };

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Configuração VM</h2>
            <button
              onClick={resetAllData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Reset All
            </button>
          </div>
          
          <div className="space-y-4">
            {vms.map((vm, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Virtual Machine {index + 1}</h3>
                  {vms.length > 1 && (
                    <button
                      onClick={() => removeVM(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-medium text-slate-300 mb-1">
                      VM Name
                    </label>
                    <input
                      type="text"
                      value={vm.name}
                      onChange={(e) => updateVM(index, 'name', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-[10px]"
                      placeholder="Enter VM name"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-medium text-slate-300 mb-1">
                      Number of VMs
                    </label>
                    <input
                      type="number"
                      value={vm.count}
                      onChange={(e) => updateVM(index, 'count', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-[10px]"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-medium text-slate-300 mb-1">
                      vCPUs
                    </label>
                    <input
                      type="number"
                      value={vm.vCPUs}
                      onChange={(e) => updateVM(index, 'vCPUs', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-[10px]"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-medium text-slate-300 mb-1">
                      Memory (GB)
                    </label>
                    <input
                      type="number"
                      value={vm.memory}
                      onChange={(e) => updateVM(index, 'memory', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-[10px]"
                      min="1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[9px] font-medium text-slate-300 mb-1">
                      Storage (GB)
                    </label>
                    <input
                      type="number"
                      value={vm.storage}
                      onChange={(e) => updateVM(index, 'storage', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-[10px]"
                      min="1"
                    />
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    <div>Total vCPUs: {vm.vCPUs * vm.count}</div>
                    <div>Total Memory: {formatStorage(vm.memory * vm.count)}</div>
                    <div>Total Storage: {formatStorage(vm.storage * vm.count)}</div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addVM}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors text-[10px]"
            >
              Add Another VM Configuration
            </button>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                VM Core Ratio (vCPU:pCPU)
              </label>
              <input
                type="number"
                value={vmCoreRatio}
                onChange={(e) => setVmCoreRatio(parseInt(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                min="1"
              />
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Processors per Server
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setProcessorsPerServer(1)}
                  className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                    processorsPerServer === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Cpu size={20} />
                  Single CPU
                </button>
                <button
                  onClick={() => setProcessorsPerServer(2)}
                  className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                    processorsPerServer === 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Cpu size={20} />
                  Dual CPU
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Processor Model
              </label>
              <select
                value={selectedProcessor.id}
                onChange={(e) => {
                  const processor = processors.find(p => p.id === e.target.value);
                  if (processor) setSelectedProcessor(processor);
                }}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
              >
                {processors.map((processor) => (
                  <option key={processor.id} value={processor.id}>
                    {processor.name} ({processor.cores} cores, {processor.frequency}, {processor.tdp}W)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Server Form Factor
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFormFactorChange('1U')}
                  className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                    serverConfig.formFactor === '1U'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Server size={20} />
                  1U (Max 10 Disks)
                </button>
                <button
                  onClick={() => handleFormFactorChange('2U')}
                  className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                    serverConfig.formFactor === '2U'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Server size={20} />
                  2U (Max 24 Disks)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Disks per Server
              </label>
              <input
                type="number"
                value={serverConfig.disksPerServer}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value <= serverConfig.maxDisksPerServer) {
                    setServerConfig({ ...serverConfig, disksPerServer: value });
                  }
                }}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                min="1"
                max={serverConfig.maxDisksPerServer}
              />
              <p className="text-[8px] text-slate-400 mt-1">
                Maximum {serverConfig.maxDisksPerServer} disks for {serverConfig.formFactor} server
              </p>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Disk Size
              </label>
              <select
                value={serverConfig.diskSize}
                onChange={(e) => setServerConfig({ ...serverConfig, diskSize: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
              >
                {DISK_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {formatStorageSize(size)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-slate-300 mb-1">
                Configuração vSAN
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[8px] font-medium text-slate-400 mb-1">
                    Falhas a Tolerar (FTT)
                  </label>
                  <select
                    value={serverConfig.ftt}
                    onChange={(e) => setServerConfig({ ...serverConfig, ftt: Number(e.target.value) as ServerConfig['ftt'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                  >
                    <option value={1}>FTT=1</option>
                    <option value={2}>FTT=2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-medium text-slate-400 mb-1">
                    Tipo de RAID
                  </label>
                  <select
                    value={serverConfig.raidType}
                    onChange={(e) => setServerConfig({ ...serverConfig, raidType: e.target.value as ServerConfig['raidType'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                  >
                    <option value="RAID1">RAID-1 (Espelhamento)</option>
                    <option value="RAID5">RAID-5 (Codificação de Eliminação)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-medium text-slate-400 mb-1">
                    Data Reduction Ratio
                  </label>
                  <select
                    value={serverConfig.dataReductionRatio}
                    onChange={(e) => setServerConfig({ ...serverConfig, dataReductionRatio: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                  >
                    {DATA_REDUCTION_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}:1 ({((ratio - 1) * 100).toFixed(0)}% savings)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2 text-[8px] text-slate-400 bg-slate-800/50 p-2 rounded">
                <p>Storage Efficiency:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>RAID Factor: {(FTT_RAID_FACTORS[serverConfig.ftt][serverConfig.raidType] * 100).toFixed(0)}%</li>
                  <li>Data Reduction: {serverConfig.dataReductionRatio}:1</li>
                  <li>Total Efficiency: {(FTT_RAID_FACTORS[serverConfig.ftt][serverConfig.raidType] * serverConfig.dataReductionRatio * 100).toFixed(0)}%</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nPlusOne"
                checked={considerNPlusOne}
                onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500"
              />
              <label htmlFor="nPlusOne" className="text-[9px] text-slate-300">
                Consider N+1 redundancy
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Requisitos de Recursos</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Servidores Necessários</p>
                <p className="text-2xl font-bold">{serverRequirements.total}</p>
                <div className="text-[9px] text-slate-400 mt-1">
                  <p>Computação: {serverRequirements.forCompute}</p>
                  <p>Armazenamento: {serverRequirements.forStorage}</p>
                </div>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Total de vCPUs</p>
                <p className="text-2xl font-bold">{totalResources.totalCpu}</p>
                <p className="text-[9px] text-slate-400 mt-1">
                  {(totalResources.usableCpu / (serverRequirements.total * selectedProcessor.cores * 2)).toFixed(2)}:1 proporção
                </p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Memória Total</p>
                <p className="text-2xl font-bold">{totalResources.totalMemory} GB</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Armazenamento Total</p>
                <p className="text-2xl font-bold">{totalResources.totalDisk} TB</p>
                <p className="text-[9px] text-slate-400 mt-1">
                  {formatStorage(serverRequirements.storagePerServer)} por servidor
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CPU Utilization */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="text-blue-400" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold">CPU</h3>
                      <p className="text-3xl font-bold mt-1">{cpuUtilization.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={cpuUtilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                    >
                      {cpuUtilizationData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <span className="text-[10px]">Used</span>
                    </div>
                    <span className="font-medium text-[10px]">{cpuUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                      <span className="text-[10px]">Available</span>
                    </div>
                    <span className="font-medium text-[10px]">{(100 - cpuUtilization).toFixed(1)}%</span>
                  </div>
                </div>

                {cpuUtilization > 80 && (
                  <div className="mt-4 bg-slate-900/50 text-slate-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <p className="text-[10px]">High utilization!</p>
                  </div>
                )}
              </div>

              {/* Memory Utilization */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Memory className="text-green-400" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold">Memory</h3>
                      <p className="text-3xl font-bold mt-1">
                        {calculateTotalResources().totalMemory > 0 
                          ? ((calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100).toFixed(1) 
                          : '0.0'}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={[
                        { 
                          name: 'Used', 
                          value: calculateTotalResources().totalMemory > 0 
                            ? (calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100 
                            : 0 
                        },
                        { 
                          name: 'Available', 
                          value: calculateTotalResources().totalMemory > 0 
                            ? 100 - (calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100 
                            : 100 
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                    >
                      {[0, 1].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <span className="text-[10px]">Used</span>
                    </div>
                    <span className="font-medium text-[10px]">
                      {calculateTotalResources().totalMemory > 0 
                        ? ((calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100).toFixed(1) 
                        : '0.0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                      <span className="text-[10px]">Available</span>
                    </div>
                    <span className="font-medium text-[10px]">
                      {calculateTotalResources().totalMemory > 0 
                        ? (100 - (calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100).toFixed(1) 
                        : '100.0'}%
                    </span>
                  </div>
                </div>

                {calculateTotalResources().totalMemory > 0 && 
                 (calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100 > 80 && (
                  <div className="mt-4 bg-slate-900/50 text-slate-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <p className="text-[10px]">High utilization!</p>
                  </div>
                )}
              </div>

              {/* Storage Utilization */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Database className="text-amber-400" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold">Storage</h3>
                      <p className="text-3xl font-bold mt-1">{storageUtilization.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={storageUtilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                    >
                      {storageUtilizationData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <span className="text-[10px]">Used</span>
                    </div>
                    <span className="font-medium text-[10px]">{storageUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                      <span className="text-[10px]">Available</span>
                    </div>
                    <span className="font-medium text-[10px]">{(100 - storageUtilization).toFixed(1)}%</span>
                  </div>
                </div>

                {storageUtilization > 80 && (
                  <div className="mt-4 bg-slate-900/50 text-slate-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <p className="text-[10px]">High utilization!</p>
                  </div>
                )}
              </div>
            </div>

            {(totalResources.usableCpu) / (serverRequirements.total * selectedProcessor.cores * 2) > vmCoreRatio && (
              <div className="mt-4 bg-slate-900/50 text-slate-200 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <p className="text-[9px]">Warning: vCPU to pCPU ratio exceeds recommended limit!</p>
              </div>
            )}

            {totalResources.usableDisk > serverRequirements.storagePerServer && (
              <div className="mt-4 bg-slate-900/50 text-slate-200 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <p className="text-[9px]">Warning: Storage requirements exceed server capacity!</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
            <h3 className="text-[12px] font-semibold mb-4">Selected Processor Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Model</p>
                <p className="text-[10px] font-semibold">{selectedProcessor.name}</p>
                <p className="text-[9px] text-slate-400 mt-2">Generation</p>
                <p className="text-[10px] font-semibold">{selectedProcessor.generation}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Cores per CPU</p>
                <p className="text-[10px] font-semibold">{selectedProcessor.cores}</p>
                <p className="text-[9px] text-slate-400 mt-2">TDP</p>
                <p className="text-[10px] font-semibold">{selectedProcessor.tdp}W</p>
              </div>
              <div className="col-span-2 bg-slate-700 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-slate-400">SPECint Rate 2017 Base (per CPU)</p>
                    <p className="text-[10px] font-semibold">{selectedProcessor.spec_int_base}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400">Total SPECint Rate 2017 Base</p>
                    <p className="text-[10px] font-semibold text-blue-400">{calculateTotalSpecInt()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-4">Storage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400">Armazenamento Bruto Total</h3>
            <p className="text-2xl font-bold text-white">
              {formatStorage(calculateTotalRawStorage())}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg relative group">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              Armazenamento Líquido Utilizável
              <span className="cursor-help">
                <AlertCircle size={14} className="text-slate-500" />
                <div className="absolute hidden group-hover:block bg-slate-700 p-2 rounded text-xs w-48 top-full left-0 mt-1 z-10">
                  O armazenamento líquido considera o overhead do FTT e a taxa de redução de dados.
                  Fórmula: Bruto / (FTT + 1) × Taxa de Redução
                </div>
              </span>
            </h3>
            <p className="text-2xl font-bold text-white">
              {formatStorage(calculateNetStorage(
                calculateTotalRawStorage(),
                serverConfig.ftt,
                serverConfig.dataReductionRatio
              ))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Threshold de Utilização (%)
          </label>
          <input
            type="number"
            value={utilizationThreshold}
            onChange={(e) => setUtilizationThreshold(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Recursos Totais</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-400">CPU Total</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().totalCpu} cores</p>
            <p className="text-sm text-slate-400">CPU Utilizável ({utilizationThreshold}%)</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().usableCpu.toFixed(1)} cores</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Memória Total</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().totalMemory || 0} GB</p>
            <p className="text-sm text-slate-400">Memória Utilizável ({utilizationThreshold}%)</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().usableMemory.toFixed(1)} GB</p>
            <div className="mt-2">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${calculateTotalResources().totalMemory > 0 ? (calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {calculateTotalResources().totalMemory > 0 ? ((calculateTotalResources().usableMemory / calculateTotalResources().totalMemory) * 100).toFixed(1) : '0.0'}% de utilização
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400">Disco Total</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().totalDisk} TB</p>
            <p className="text-sm text-slate-400">Disco Utilizável ({utilizationThreshold}%)</p>
            <p className="text-xl font-medium text-white">{calculateTotalResources().usableDisk.toFixed(1)} TB</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
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

      {result && !isCalculating && (
        <div className="mt-8 bg-slate-700/50 p-6 rounded-lg border border-blue-500/20 animate-fade-in">
          <h3 className="text-xl font-semibold text-white mb-4">Resultados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-600/30 p-4 rounded-lg">
              <p className="text-slate-300">Armazenamento Total</p>
              <p className="text-2xl font-bold text-white">{result.totalStorage} GB</p>
            </div>
            <div className="bg-slate-600/30 p-4 rounded-lg">
              <p className="text-slate-300">Memória Total</p>
              <p className="text-2xl font-bold text-white">{result.totalMemory} GB</p>
            </div>
            <div className="bg-slate-600/30 p-4 rounded-lg">
              <p className="text-slate-300">CPUs Totais</p>
              <p className="text-2xl font-bold text-white">{result.totalCpu}</p>
            </div>
            <div className="bg-slate-600/30 p-4 rounded-lg">
              <p className="text-slate-300">Servidores Recomendados</p>
              <p className="text-2xl font-bold text-white">{result.recommendedServers}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VsanCalculator;