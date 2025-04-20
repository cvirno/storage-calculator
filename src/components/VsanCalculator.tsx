import { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, MemoryStick as Memory, Database, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { mockProcessors } from '../lib/mockData';

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
    const serverReqs = calculateRequiredServers();
    return serverReqs.total * selectedProcessor.spec_int_base * processorsPerServer;
  };

  const calculateTotalPower = () => {
    if (!selectedProcessor) return 0;
    const serverReqs = calculateRequiredServers();
    return serverReqs.total * selectedProcessor.tdp * processorsPerServer;
  };

  const handleFormFactorChange = (formFactor: '1U' | '2U') => {
    setServerConfig(prev => ({
      ...prev,
      formFactor,
      maxDisksPerServer: formFactor === '1U' ? 12 : 24,
      disksPerServer: formFactor === '1U' ? 6 : 12
    }));
  };

  const calculateTotalRawStorage = () => {
    const serverReqs = calculateRequiredServers();
    return serverReqs.total * serverConfig.diskSize * serverConfig.disksPerServer;
  };

  const resetAllData = () => {
    setVms([{ name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }]);
    setVmCoreRatio(4);
    setProcessorsPerServer(2);
    setConsiderNPlusOne(true);
    setServerConfig({
      formFactor: '2U',
      maxDisksPerServer: 24,
      disksPerServer: 12,
      diskSize: DISK_SIZES[0],
      ftt: 1,
      raidType: 'RAID5',
      dataReductionRatio: 1.0
    });
  };

  const serverReqs = calculateRequiredServers();
  const totalResources = calculateTotalResources();
  const cpuUtilization = calculateCPUUtilization();
  const memoryUtilization = calculateMemoryUtilization();
  const storageUtilization = calculateStorageUtilization();
  const totalSpecInt = calculateTotalSpecInt();
  const totalPower = calculateTotalPower();
  const totalRawStorage = calculateTotalRawStorage();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">vSAN Calculator</h2>
        <p className="text-gray-600">
          Calculate the required resources for your vSAN environment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Server Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Form Factor</label>
              <div className="mt-1 flex space-x-4">
                <button
                  onClick={() => handleFormFactorChange('1U')}
                  className={`px-4 py-2 rounded ${
                    serverConfig.formFactor === '1U'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  1U
                </button>
                <button
                  onClick={() => handleFormFactorChange('2U')}
                  className={`px-4 py-2 rounded ${
                    serverConfig.formFactor === '2U'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  2U
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Processor</label>
              <select
                value={selectedProcessor?.id || ''}
                onChange={(e) => {
                  const processor = processors.find(p => p.id === e.target.value);
                  setSelectedProcessor(processor || null);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {processors.map(processor => (
                  <option key={processor.id} value={processor.id}>
                    {processor.name} ({processor.cores} cores, {processor.frequency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Processors per Server</label>
              <input
                type="number"
                value={processorsPerServer}
                onChange={(e) => setProcessorsPerServer(Number(e.target.value))}
                min="1"
                max="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">VM Core Ratio</label>
              <input
                type="number"
                value={vmCoreRatio}
                onChange={(e) => setVmCoreRatio(Number(e.target.value))}
                min="1"
                max="8"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Disk Size</label>
              <select
                value={serverConfig.diskSize}
                onChange={(e) => setServerConfig(prev => ({ ...prev, diskSize: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {DISK_SIZES.map(size => (
                  <option key={size} value={size}>
                    {formatStorageSize(size)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Disks per Server</label>
              <input
                type="number"
                value={serverConfig.disksPerServer}
                onChange={(e) => setServerConfig(prev => ({ ...prev, disksPerServer: Number(e.target.value) }))}
                min="1"
                max={serverConfig.maxDisksPerServer}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">FTT Level</label>
              <select
                value={serverConfig.ftt}
                onChange={(e) => setServerConfig(prev => ({ ...prev, ftt: Number(e.target.value) as 1 | 2 }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={1}>FTT=1 (RAID 1)</option>
                <option value={2}>FTT=2 (RAID 1)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Data Reduction Ratio</label>
              <select
                value={serverConfig.dataReductionRatio}
                onChange={(e) => setServerConfig(prev => ({ ...prev, dataReductionRatio: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {DATA_REDUCTION_RATIOS.map(ratio => (
                  <option key={ratio} value={ratio}>
                    {ratio.toFixed(1)}x
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={considerNPlusOne}
                onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Consider N+1 for High Availability
              </label>
            </div>
          </div>
        </div>

        {/* Virtual Machines */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Virtual Machines</h3>
            <button
              onClick={addVM}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add VM
            </button>
          </div>

          <div className="space-y-4">
            {vms.map((vm, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    value={vm.name}
                    onChange={(e) => updateVM(index, 'name', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="VM Name"
                  />
                  <button
                    onClick={() => removeVM(index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">vCPUs</label>
                    <input
                      type="number"
                      value={vm.vCPUs}
                      onChange={(e) => updateVM(index, 'vCPUs', e.target.value)}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Memory (GB)</label>
                    <input
                      type="number"
                      value={vm.memory}
                      onChange={(e) => updateVM(index, 'memory', e.target.value)}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Storage (GB)</label>
                    <input
                      type="number"
                      value={vm.storage}
                      onChange={(e) => updateVM(index, 'storage', e.target.value)}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Count</label>
                    <input
                      type="number"
                      value={vm.count}
                      onChange={(e) => updateVM(index, 'count', e.target.value)}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Results</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Required Servers</h4>
            <p className="text-3xl font-bold text-blue-600">{serverReqs.total}</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>For Compute: {serverReqs.forCompute}</p>
              <p>For Storage: {serverReqs.forStorage}</p>
              <p>For Memory: {serverReqs.forMemory}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Resource Utilization</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm">
                  <span>CPU</span>
                  <span>{cpuUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${cpuUtilization}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Memory</span>
                  <span>{memoryUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${memoryUtilization}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Storage</span>
                  <span>{storageUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${storageUtilization}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Total Resources</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Total vCPUs:</span> {totalResources.vCPUs}
              </p>
              <p className="text-sm">
                <span className="font-medium">Total Memory:</span> {formatStorage(totalResources.memory)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Total Storage:</span> {formatStorage(totalResources.storage)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Raw Storage:</span> {formatRawStorage(totalRawStorage)}
              </p>
              <p className="text-sm">
                <span className="font-medium">SPECint:</span> {totalSpecInt.toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Power:</span> {totalPower.toLocaleString()}W
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={resetAllData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default VsanCalculator;