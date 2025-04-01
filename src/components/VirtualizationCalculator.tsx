import React, { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive, Gauge, Layers, Activity, Power, MemoryStick, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

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

const MEMORY_DIMM_SIZES = [32, 64, 128, 256];
const MAX_DIMMS_PER_SERVER = 32;

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
  processorsPerServer: number;
  maxDisksPerServer: number;
  disksPerServer: number;
  diskSize: number;
  raidType: 'RAID1' | 'RAID5' | 'RAID6';
  dataReductionRatio: number;
  considerNPlusOne: boolean;
  memoryDimmSize: number;
  memoryDimmsPerServer: number;
  utilizationThreshold: number;
}

const RAID_FACTORS = {
  'RAID1': 0.5,
  'RAID5': 0.75,
  'RAID6': 0.67,
  'RAID10': 0.5
} as const;

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

const formatStorageSize = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb.toFixed(2)} GB`;
};

const VirtualizationCalculator = () => {
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [vms, setVms] = useState<VirtualMachine[]>([
    { name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }
  ]);
  const [coreRatio, setCoreRatio] = useState(4);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor | null>(null);
  const [considerNPlusOne, setConsiderNPlusOne] = useState(true);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    formFactor: '2U',
    processorsPerServer: 2,
    maxDisksPerServer: 24,
    disksPerServer: 12,
    diskSize: 960,
    raidType: 'RAID5',
    dataReductionRatio: 1.0,
    considerNPlusOne: true,
    memoryDimmSize: 64,
    memoryDimmsPerServer: 2,
    utilizationThreshold: 95
  });

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
    return vms.reduce((acc, vm) => ({
      vCPUs: acc.vCPUs + (vm.vCPUs * vm.count),
      memory: acc.memory + (vm.memory * vm.count),
      storage: acc.storage + (vm.storage * vm.count)
    }), { vCPUs: 0, memory: 0, storage: 0 });
  };

  const calculateRequiredServers = () => {
    if (!selectedProcessor) return { total: 0, forCompute: 0, forStorage: 0, forMemory: 0, storagePerServer: 0 };

    const totalResources = calculateTotalResources();
    const UTILIZATION_LIMIT = serverConfig.utilizationThreshold / 100;
    
    // Calculate servers needed for compute
    const requiredCores = Math.ceil(totalResources.vCPUs / coreRatio);
    const coresPerServer = selectedProcessor.cores * serverConfig.processorsPerServer;
    const serversForCompute = Math.ceil(requiredCores / (coresPerServer * UTILIZATION_LIMIT));
    
    // Calculate servers needed for memory
    const memoryPerServer = serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer;
    const serversForMemory = Math.ceil(totalResources.memory / (memoryPerServer * UTILIZATION_LIMIT));
    
    // Calculate servers needed for storage
    const totalStorageGB = totalResources.storage;
    let usableStoragePerDisk = serverConfig.diskSize;

    // Apply RAID factor
    usableStoragePerDisk *= RAID_FACTORS[serverConfig.raidType];

    // Apply data reduction ratio
    usableStoragePerDisk *= serverConfig.dataReductionRatio;

    // Calculate usable storage per server
    const usableStoragePerServer = usableStoragePerDisk * serverConfig.disksPerServer;
    const serversForStorage = Math.ceil(totalStorageGB / (usableStoragePerServer * UTILIZATION_LIMIT));

    // Determine the maximum number of servers needed
    const maxServers = Math.max(serversForCompute, serversForStorage, serversForMemory);

    // Add one more server if N+1 is considered
    const totalServers = serverConfig.considerNPlusOne ? maxServers + 1 : maxServers;

    return {
      total: totalServers,
      forCompute: serversForCompute,
      forStorage: serversForStorage,
      forMemory: serversForMemory,
      storagePerServer: usableStoragePerServer
    };
  };

  const calculateCPUUtilization = () => {
    if (!selectedProcessor) return 0;
    
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const totalAvailableCores = serverReqs.total * selectedProcessor.cores * 2;
    const cpuUtilization = (totalResources.vCPUs / (totalAvailableCores * coreRatio)) * 100;
    
    return Math.min(cpuUtilization, 100);
  };

  const calculateMemoryUtilization = () => {
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const memoryPerServer = serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer;
    const totalAvailableMemory = serverReqs.total * memoryPerServer;
    const memoryUtilization = (totalResources.memory / totalAvailableMemory) * 100;
    
    return Math.min(memoryUtilization, 100);
  };

  const calculateStorageUtilization = () => {
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const storageUtilization = (totalResources.storage / (serverReqs.total * serverReqs.storagePerServer)) * 100;
    
    return Math.min(storageUtilization, 100);
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

  const handleDisksPerServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const maxDisks = serverConfig.formFactor === '1U' ? 10 : 24;
    
    if (value > maxDisks) {
      alert(`Maximum number of disks for ${serverConfig.formFactor} server is ${maxDisks}`);
      setServerConfig({
        ...serverConfig,
        disksPerServer: maxDisks
      });
    } else {
      setServerConfig({
        ...serverConfig,
        disksPerServer: value
      });
    }
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      // Reset VMs to initial state
      setVms([{ name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }]);
      
      // Reset server configuration to default
      setServerConfig({
        formFactor: '2U',
        processorsPerServer: 2,
        maxDisksPerServer: 24,
        disksPerServer: 12,
        diskSize: 960,
        raidType: 'RAID5',
        dataReductionRatio: 1.0,
        considerNPlusOne: true,
        memoryDimmSize: 64,
        memoryDimmsPerServer: 2,
        utilizationThreshold: 95
      });

      // Reset other settings
      setCoreRatio(4);
      setConsiderNPlusOne(true);
      
      // Reset processor selection to first available
      if (processors.length > 0) {
        setSelectedProcessor(processors[0]);
      }
    }
  };

  const totalResources = calculateTotalResources();
  const serverRequirements = calculateRequiredServers();
  const cpuUtilization = calculateCPUUtilization();
  const memoryUtilization = calculateMemoryUtilization();
  const storageUtilization = calculateStorageUtilization();

  const utilizationCards = [
    {
      title: 'CPU Utilization',
      value: cpuUtilization.toFixed(1) + '%',
      icon: <Cpu className="text-blue-400" />,
      data: [
        { name: 'Used', value: cpuUtilization },
        { name: 'Available', value: 100 - cpuUtilization }
      ]
    },
    {
      title: 'Memory Utilization',
      value: memoryUtilization.toFixed(1) + '%',
      icon: <MemoryStick className="text-emerald-400" />,
      data: [
        { name: 'Used', value: memoryUtilization },
        { name: 'Available', value: 100 - memoryUtilization }
      ]
    },
    {
      title: 'Storage Utilization',
      value: storageUtilization.toFixed(1) + '%',
      icon: <HardDrive className="text-amber-400" />,
      data: [
        { name: 'Used', value: storageUtilization },
        { name: 'Available', value: 100 - storageUtilization }
      ]
    }
  ];

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="flex flex-row-reverse gap-8">
      {/* Right Side - VM Configuration */}
      <div className="w-[400px] flex-shrink-0">
        <div className="sticky top-2">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Gerenciamento de VMs</h2>
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
            
            <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
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
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Nome da VM
                      </label>
                      <input
                        type="text"
                        value={vm.name}
                        onChange={(e) => updateVM(index, 'name', e.target.value)}
                        className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                        placeholder="Digite o nome da VM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={vm.count}
                        onChange={(e) => updateVM(index, 'count', e.target.value)}
                        className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Número de vCPUs
                      </label>
                      <input
                        type="number"
                        value={vm.vCPUs}
                        onChange={(e) => updateVM(index, 'vCPUs', e.target.value)}
                        className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Memória (GB)
                      </label>
                      <input
                        type="number"
                        value={vm.memory}
                        onChange={(e) => updateVM(index, 'memory', e.target.value)}
                        className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                        min="1"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Armazenamento (GB)
                      </label>
                      <input
                        type="number"
                        value={vm.storage}
                        onChange={(e) => updateVM(index, 'storage', e.target.value)}
                        className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
              >
                Adicionar Outra Configuração de VM
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Maximum Resource Utilization (%)
                  </label>
                  <input
                    type="number"
                    value={serverConfig.utilizationThreshold}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 1 && value <= 100) {
                        setServerConfig({ ...serverConfig, utilizationThreshold: value });
                      }
                    }}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Core Ratio (vCPU:pCPU)
                  </label>
                  <input
                    type="number"
                    value={coreRatio}
                    onChange={(e) => setCoreRatio(parseInt(e.target.value))}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Processor Model
                  </label>
                  <select
                    value={selectedProcessor.id}
                    onChange={(e) => {
                      const processor = processors.find(p => p.id === e.target.value);
                      if (processor) setSelectedProcessor(processor);
                    }}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {processors.map((processor) => (
                      <option key={processor.id} value={processor.id}>
                        {processor.name} ({processor.cores} cores, {processor.frequency}, {processor.tdp}W)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Memory DIMM Size
                  </label>
                  <select
                    value={serverConfig.memoryDimmSize}
                    onChange={(e) => setServerConfig({ ...serverConfig, memoryDimmSize: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {MEMORY_DIMM_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} GB
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Memory DIMMs per Server
                  </label>
                  <input
                    type="number"
                    value={serverConfig.memoryDimmsPerServer}
                    onChange={(e) => setServerConfig({ ...serverConfig, memoryDimmsPerServer: Math.min(MAX_DIMMS_PER_SERVER, Math.max(1, Number(e.target.value))) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max={MAX_DIMMS_PER_SERVER}
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Total Memory per Server: {serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer} GB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Number of Disks per Server
                  </label>
                  <input
                    type="number"
                    value={serverConfig.disksPerServer}
                    onChange={handleDisksPerServerChange}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max={serverConfig.maxDisksPerServer}
                  />
                  <p className="text-sm text-slate-400 mt-1">
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    RAID Configuration
                  </label>
                  <select
                    value={serverConfig.raidType}
                    onChange={(e) => setServerConfig({ ...serverConfig, raidType: e.target.value as ServerConfig['raidType'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="RAID 1">RAID 1 (50% usable)</option>
                    <option value="RAID 5">RAID 5 (75% usable)</option>
                    <option value="RAID 6">RAID 6 (67% usable)</option>
                    <option value="RAID 10">RAID 10 (50% usable)</option>
                  </select>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-300 mb-2">
                    <AlertCircle size={20} />
                    <span>Threshold de Utilização</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={serverConfig.utilizationThreshold}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 1 && value <= 100) {
                          setServerConfig({ ...serverConfig, utilizationThreshold: value });
                        }
                      }}
                      className="w-24 bg-slate-600 rounded-lg px-3 py-2 text-white"
                      min="1"
                      max="100"
                    />
                    <span className="text-slate-300">%</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Quando qualquer recurso (CPU, Memória ou Armazenamento) atingir este valor, um novo servidor será adicionado.
                  </p>
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
                <label htmlFor="nPlusOne" className="text-sm text-slate-300">
                  Consider N+1 redundancy
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Dashboards */}
      <div className="flex-1">
        <div className="sticky top-2 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Servidores Necessários</div>
              <div className="text-2xl font-bold">
                {serverRequirements.total}{considerNPlusOne && serverRequirements.total > 0 ? ' (+1)' : ''}
              </div>
              <div className="text-sm text-slate-400">
                <p>Computação: {serverRequirements.forCompute}</p>
                <p>Memória: {serverRequirements.forMemory}</p>
                <p>Armazenamento: {serverRequirements.forStorage}</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total de vCPUs</div>
              <div className="text-2xl font-bold">{totalResources.vCPUs}</div>
              <div className="text-sm text-slate-400">
                {(totalResources.vCPUs / (serverRequirements.total * selectedProcessor.cores * 2)).toFixed(2)}:1 proporção
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Memória Total</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.memory)}</div>
              <div className="text-sm text-slate-400">
                {formatStorage(serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer)} por servidor
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Storage</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.storage)}</div>
              <div className="text-sm text-slate-400">
                {formatStorage(serverRequirements.storagePerServer)} per server
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {utilizationCards.map((card, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <div>
                      <h3 className="text-lg font-semibold">{card.title}</h3>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={card.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {card.data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? COLORS[index] : '#1f2937'}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <span>Used</span>
                    </div>
                    <span className="font-medium">{card.data[0].value.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                      <span>Available</span>
                    </div>
                    <span className="font-medium">{card.data[1].value.toFixed(1)}%</span>
                  </div>
                </div>

                {card.data[0].value > serverConfig.utilizationThreshold && (
                  <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} />
                    <p>Exceeds {serverConfig.utilizationThreshold}% threshold</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizationCalculator;