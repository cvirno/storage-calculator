import React, { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';

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
  diskSize: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
}

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

const formatStorage = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    if (Math.abs(tb - 1.92) < 0.01) return '1.92 TB';
    if (Math.abs(tb - 3.84) < 0.01) return '3.84 TB';
    if (Math.abs(tb - 7.68) < 0.01) return '7.68 TB';
    if (Math.abs(tb - 15.36) < 0.01) return '15.36 TB';
    if (Math.floor(tb) === tb) return `${tb} TB`;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
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
    maxDisksPerServer: 24,
    diskSize: DISK_SIZES[0],
    raidType: 'RAID 5'
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
    if (!selectedProcessor) return { total: 0, forCompute: 0, forStorage: 0, storagePerServer: 0 };

    const totalResources = calculateTotalResources();
    
    const requiredCores = Math.ceil(totalResources.vCPUs / coreRatio);
    const coresPerServer = selectedProcessor.cores * 2;
    let serversForCompute = Math.ceil(requiredCores / coresPerServer);
    
    const totalStorageGB = totalResources.storage;
    const usableStoragePerDisk = serverConfig.diskSize * RAID_FACTORS[serverConfig.raidType];
    const usableStoragePerServer = usableStoragePerDisk * serverConfig.maxDisksPerServer;
    let serversForStorage = Math.ceil(totalStorageGB / usableStoragePerServer);
    
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

  const calculateTotalSpecInt = () => {
    if (!selectedProcessor) return 0;
    const servers = calculateRequiredServers().total;
    return servers * selectedProcessor.spec_int_base * 2;
  };

  const handleFormFactorChange = (formFactor: '1U' | '2U') => {
    setServerConfig({
      ...serverConfig,
      formFactor,
      maxDisksPerServer: formFactor === '1U' ? 10 : 24
    });
  };

  const totalResources = calculateTotalResources();
  const serverRequirements = calculateRequiredServers();

  const resourceData = [
    {
      name: 'vCPUs',
      total: totalResources.vCPUs,
      perVM: vms[0].vCPUs
    },
    {
      name: 'Memory (GB)',
      total: totalResources.memory,
      perVM: vms[0].memory
    },
    {
      name: 'Storage',
      total: totalResources.storage,
      perVM: vms[0].storage,
      unit: totalResources.storage >= 1024 ? 'TB' : 'GB'
    }
  ];

  const utilizationData = [
    { name: 'Used vCPUs', value: totalResources.vCPUs },
    { name: 'Available vCPUs', value: selectedProcessor ? (serverRequirements.total * selectedProcessor.cores * 2 * coreRatio - totalResources.vCPUs) : 0 }
  ];

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6">VM Configuration</h2>
          
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
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      VM Name
                    </label>
                    <input
                      type="text"
                      value={vm.name}
                      onChange={(e) => updateVM(index, 'name', e.target.value)}
                      className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                      placeholder="Enter VM name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Number of VMs
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
                      vCPUs
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
                      Memory (GB)
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
                      Storage (GB)
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
              Add Another VM Configuration
            </button>

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
                    {processor.name} ({processor.cores} cores, {processor.frequency}, {processor.tdp}W, SPECint Rate: {processor.spec_int_base})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
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
                  Disk Size
                </label>
                <select
                  value={serverConfig.diskSize}
                  onChange={(e) => setServerConfig({ ...serverConfig, diskSize: Number(e.target.value) })}
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

        <div className="space-y-8">
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Resource Requirements</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Required Servers</p>
                <p className="text-2xl font-bold">{serverRequirements.total}</p>
                <div className="text-sm text-slate-400 mt-1">
                  <p>Compute: {serverRequirements.forCompute}</p>
                  <p>Storage: {serverRequirements.forStorage}</p>
                  {considerNPlusOne && <p>Includes N+1 redundancy</p>}
                </div>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Total vCPUs</p>
                <p className="text-2xl font-bold">{totalResources.vCPUs}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {(totalResources.vCPUs / (serverRequirements.total * selectedProcessor.cores * 2)).toFixed(2)}:1 ratio
                </p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Total Memory</p>
                <p className="text-2xl font-bold">{formatStorage(totalResources.memory)}</p>
              </div>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Total Storage</p>
                <p className="text-2xl font-bold">{formatStorage(totalResources.storage)}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {formatStorage(serverRequirements.storagePerServer)} per server
                </p>
              </div>
            </div>

            {(totalResources.vCPUs) / (serverRequirements.total * selectedProcessor.cores * 2) > coreRatio && (
              <div className="mt-4 bg-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <p>Warning: vCPU to pCPU ratio exceeds recommended limit!</p>
              </div>
            )}

            {totalResources.storage / serverRequirements.total > serverRequirements.storagePerServer && (
              <div className="mt-4 bg-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <p>Warning: Storage requirements exceed server capacity!</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Selected Processor Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Model</p>
                <p className="font-semibold">{selectedProcessor.name}</p>
                <p className="text-slate-400 mt-2">Generation</p>
                <p className="font-semibold">{selectedProcessor.generation}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400">Cores per CPU</p>
                <p className="font-semibold">{selectedProcessor.cores}</p>
                <p className="text-slate-400 mt-2">TDP</p>
                <p className="font-semibold">{selectedProcessor.tdp}W</p>
              </div>
              <div className="col-span-2 bg-slate-700 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400">SPECint Rate 2017 Base (per CPU)</p>
                    <p className="font-semibold">{selectedProcessor.spec_int_base}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Total SPECint Rate 2017 Base</p>
                    <p className="font-semibold text-blue-400">{calculateTotalSpecInt()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6">Resource Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name, props) => {
                if (props.payload.name === 'Storage') {
                  return formatStorage(value as number);
                }
                return value;
              }} />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6" name="Total" />
              <Bar dataKey="perVM" fill="#10B981" name="Per VM" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6">vCPU Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utilizationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {utilizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VirtualizationCalculator;