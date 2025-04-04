import { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, MemoryStick as Memory, Database, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

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
    const UTILIZATION_LIMIT = 0.95; // 95% utilization limit
    
    // Calculate servers needed for compute
    const requiredCores = Math.ceil(totalResources.vCPUs / vmCoreRatio);
    const coresPerServer = selectedProcessor.cores * processorsPerServer;
    const serversForCompute = Math.ceil(requiredCores / (coresPerServer * UTILIZATION_LIMIT));
    
    // Calculate servers needed for memory
    const memoryPerServer = 768; // Assuming 768GB per server
    const serversForMemory = Math.ceil(totalResources.memory / (memoryPerServer * UTILIZATION_LIMIT));
    
    // Calculate servers needed for storage
    const totalStorageGB = totalResources.storage;
    let usableStoragePerDisk = serverConfig.diskSize;

    // Apply vSAN FTT RAID factor
    usableStoragePerDisk *= FTT_RAID_FACTORS[serverConfig.ftt][serverConfig.raidType];

    // Apply data reduction ratio
    usableStoragePerDisk *= serverConfig.dataReductionRatio;

    const usableStoragePerServer = usableStoragePerDisk * serverConfig.disksPerServer;
    const serversForStorage = Math.ceil(totalStorageGB / (usableStoragePerServer * UTILIZATION_LIMIT));
    
    // Get the maximum number of servers needed based on all resources
    let servers = Math.max(serversForCompute, serversForStorage, serversForMemory);
    
    if (considerNPlusOne) {
      servers += 1;
    }

    return {
      total: servers,
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
    const cpuUtilization = (totalResources.vCPUs / (totalAvailableCores * vmCoreRatio)) * 100;
    
    return Math.min(cpuUtilization, 100);
  };

  const calculateMemoryUtilization = () => {
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    const memoryPerServer = 768; // Assuming 768GB per server
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

  const totalResources = calculateTotalResources();
  const serverRequirements = calculateRequiredServers();
  const cpuUtilization = calculateCPUUtilization();
  const memoryUtilization = calculateMemoryUtilization();
  const storageUtilization = calculateStorageUtilization();

  const cpuUtilizationData = [
    { name: 'Used', value: cpuUtilization },
    { name: 'Available', value: 100 - cpuUtilization }
  ];

  const memoryUtilizationData = [
    { name: 'Used', value: memoryUtilization },
    { name: 'Available', value: 100 - memoryUtilization }
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

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6">VM Configuration</h2>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">VM Configuration</h2>
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
                vSAN Configuration
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[8px] font-medium text-slate-400 mb-1">
                    Failures to Tolerate (FTT)
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
                    RAID Type
                  </label>
                  <select
                    value={serverConfig.raidType}
                    onChange={(e) => setServerConfig({ ...serverConfig, raidType: e.target.value as ServerConfig['raidType'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-[10px]"
                  >
                    <option value="RAID1">RAID-1 (Mirroring)</option>
                    <option value="RAID5">RAID-5 (Erasure Coding)</option>
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
            <h2 className="text-xl font-semibold mb-6">Resource Requirements</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Required Servers</p>
                <p className="text-2xl font-bold">{serverRequirements.total}</p>
                <div className="text-[9px] text-slate-400 mt-1">
                  <p>Compute: {serverRequirements.forCompute}</p>
                  <p>Storage: {serverRequirements.forStorage}</p>
                  <p>Memory: {serverRequirements.forMemory}</p>
                  {considerNPlusOne && <p>Includes N+1 redundancy</p>}
                </div>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Total vCPUs</p>
                <p className="text-2xl font-bold">{totalResources.vCPUs}</p>
                <p className="text-[9px] text-slate-400 mt-1">
                  {(totalResources.vCPUs / (serverRequirements.total * selectedProcessor.cores * 2)).toFixed(2)}:1 ratio
                </p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Total Memory</p>
                <p className="text-2xl font-bold">{formatStorage(totalResources.memory)}</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-[9px] text-slate-400">Total Storage</p>
                <p className="text-2xl font-bold">{formatStorage(totalResources.storage)}</p>
                <p className="text-[9px] text-slate-400 mt-1">
                  {formatStorage(serverRequirements.storagePerServer)} per server
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
                  <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <p className="text-[10px]">High utilization!</p>
                  </div>
                )}
              </div>

              {/* Memory Utilization */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Memory className="text-emerald-400" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold">Memory</h3>
                      <p className="text-3xl font-bold mt-1">{memoryUtilization.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={memoryUtilizationData}
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
                      {memoryUtilizationData.map((_entry, index) => (
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
                    <span className="font-medium text-[10px]">{memoryUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                      <span className="text-[10px]">Available</span>
                    
                    </div>
                    <span className="font-medium text-[10px]">{(100 - memoryUtilization).toFixed(1)}%</span>
                  </div>
                </div>

                {memoryUtilization > 80 && (
                  <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2">
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
                  <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <p className="text-[10px]">High utilization!</p>
                  </div>
                )}
              </div>
            </div>

            {(totalResources.vCPUs) / (serverRequirements.total * selectedProcessor.cores * 2) > vmCoreRatio && (
              <div className="mt-4 bg-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <p className="text-[9px]">Warning: vCPU to pCPU ratio exceeds recommended limit!</p>
              </div>
            )}

            {totalResources.storage / serverRequirements.total > serverRequirements.storagePerServer && (
              <div className="mt-4 bg-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
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
            <h3 className="text-sm font-medium text-slate-400">Total Raw Storage</h3>
            <p className="text-2xl font-bold text-white">
              {formatStorage(calculateTotalRawStorage())}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg relative group">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              Net Usable Storage
              <span className="cursor-help">
                <AlertCircle size={14} className="text-slate-500" />
                <div className="absolute hidden group-hover:block bg-slate-700 p-2 rounded text-xs w-48 top-full left-0 mt-1 z-10">
                  Net storage considers FTT overhead and data reduction ratio.
                  Formula: Raw / (FTT + 1) × Data Reduction
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
    </div>
  );
};

export default VsanCalculator;