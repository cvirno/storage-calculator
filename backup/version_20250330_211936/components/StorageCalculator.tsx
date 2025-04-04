import React, { useState } from 'react';
import { HardDrive, Database, Download, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StorageConfig {
  desiredCapacity: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  diskSize: number;
  numberOfDisks: number;
  storageType: 'SSD' | 'HDD';
  blockSize: number;
  workloadType: 'random_read' | 'sequential_write' | 'mixed';
  readPercentage: number;
  latency: number;
}

interface PerformanceMetrics {
  iops: {
    total: number;
    read: number;
    write: number;
    perGB: number;
  };
  throughput: {
    read: number;
    write: number;
    total: number;
  };
  latency: {
    read: number;
    write: number;
    average: number;
    maximum: number;
  };
}

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

const DISK_SIZES = [
  240,      // 240 GB
  480,      // 480 GB
  960,      // 960 GB
  1920,     // 1.92 TB
  2000,     // 2 TB
  3840,     // 3.84 TB
  4000,     // 4 TB
  6000,     // 6 TB
  7680,     // 7.68 TB
  8000,     // 8 TB
  10000,    // 10 TB
  12000,    // 12 TB
  14000,    // 14 TB
  15360,    // 15.36 TB
  16000,    // 16 TB
  18000,    // 18 TB
  20000,    // 20 TB
  22000,    // 22 TB
  24000,    // 24 TB
];

const BLOCK_SIZES = [
  4,    // 4 KB
  8,    // 8 KB
  16,   // 16 KB
  32,   // 32 KB
  64,   // 64 KB
  128,  // 128 KB
  256,  // 256 KB
  512,  // 512 KB
  1024, // 1 MB
];

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

const RAID_IOPS_FACTORS = {
  'RAID 1': 1.0,
  'RAID 5': 0.8,
  'RAID 6': 0.7,
  'RAID 10': 1.2
};

const WORKLOAD_FACTORS = {
  random_read: 1.0,
  sequential_write: 1.5,
  mixed: 1.2
};

const STORAGE_TYPE_IOPS = {
  SSD: {
    base: 10000,
    latency: 0.1
  },
  HDD: {
    base: 100,
    latency: 10
  }
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

const calculatePerformanceMetrics = (config: StorageConfig): PerformanceMetrics => {
  const baseIOPS = STORAGE_TYPE_IOPS[config.storageType].base;
  const raidFactor = RAID_IOPS_FACTORS[config.raidType];
  const workloadFactor = WORKLOAD_FACTORS[config.workloadType];
  
  // Calculate total IOPS based on number of disks and RAID configuration
  const totalIOPS = baseIOPS * config.numberOfDisks * raidFactor * workloadFactor;
  
  // Calculate read/write IOPS based on percentage
  const readIOPS = totalIOPS * (config.readPercentage / 100);
  const writeIOPS = totalIOPS * ((100 - config.readPercentage) / 100);
  
  // Calculate throughput in MB/s
  const readThroughput = (readIOPS * config.blockSize) / 1024;
  const writeThroughput = (writeIOPS * config.blockSize) / 1024;
  
  // Calculate latency
  const baseLatency = STORAGE_TYPE_IOPS[config.storageType].latency;
  const raidLatencyFactor = {
    'RAID 1': 1.0,
    'RAID 5': 1.2,
    'RAID 6': 1.4,
    'RAID 10': 1.1
  }[config.raidType];
  
  const readLatency = baseLatency * raidLatencyFactor;
  const writeLatency = baseLatency * raidLatencyFactor * 1.5; // Writes are typically slower
  
  return {
    iops: {
      total: totalIOPS,
      read: readIOPS,
      write: writeIOPS,
      perGB: totalIOPS / (config.diskSize * config.numberOfDisks)
    },
    throughput: {
      read: readThroughput,
      write: writeThroughput,
      total: readThroughput + writeThroughput
    },
    latency: {
      read: readLatency,
      write: writeLatency,
      average: (readLatency + writeLatency) / 2,
      maximum: Math.max(readLatency, writeLatency)
    }
  };
};

const Gauge: React.FC<GaugeProps> = ({ value, max, label, unit, color, size = 200 }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold">
          {value.toLocaleString()} {unit}
        </div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
    </div>
  );
};

const StorageCalculator = () => {
  const [config, setConfig] = useState<StorageConfig>({
    desiredCapacity: 1000,
    raidType: 'RAID 5',
    diskSize: DISK_SIZES[0],
    numberOfDisks: 4,
    storageType: 'SSD',
    blockSize: BLOCK_SIZES[0],
    workloadType: 'random_read',
    readPercentage: 50,
    latency: 0.1
  });

  const performanceMetrics = calculatePerformanceMetrics(config);

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setConfig({
        desiredCapacity: 1000,
        raidType: 'RAID 5',
        diskSize: DISK_SIZES[0],
        numberOfDisks: 4,
        storageType: 'SSD',
        blockSize: BLOCK_SIZES[0],
        workloadType: 'random_read',
        readPercentage: 50,
        latency: 0.1
      });
    }
  };

  const calculateRawCapacity = () => {
    return config.diskSize * config.numberOfDisks;
  };

  const calculateUsableCapacity = () => {
    const rawCapacity = calculateRawCapacity();
    return rawCapacity * RAID_FACTORS[config.raidType];
  };

  const exportReport = async () => {
    const element = document.getElementById('storage-report');
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#0f172a'
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('storage-sizing-report.pdf');
  };

  return (
    <div className="space-y-8" id="storage-report">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Storage Calculator</h2>
        <div className="flex gap-4">
          <button
            onClick={resetAllData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Reset All
          </button>
          <button
            onClick={exportReport}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <HardDrive size={20} />
                <span>Raw Capacity</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(calculateRawCapacity())}</div>
              <div className="text-sm text-slate-400 mt-1">
                Total Storage
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Database size={20} />
                <span>Usable Capacity</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(calculateUsableCapacity())}</div>
              <div className="text-sm text-slate-400 mt-1">
                After RAID ({config.raidType})
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Storage Volumetry</h3>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <Gauge
                  value={calculateRawCapacity()}
                  max={config.diskSize * 24} // Assuming max 24 disks
                  label="Raw Capacity"
                  unit="GB"
                  color="#3b82f6"
                  size={180}
                />
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <Gauge
                  value={calculateUsableCapacity()}
                  max={config.diskSize * 24 * RAID_FACTORS[config.raidType]}
                  label="Usable Capacity"
                  unit="GB"
                  color="#10b981"
                  size={180}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <Gauge
                  value={performanceMetrics.iops.total}
                  max={STORAGE_TYPE_IOPS[config.storageType].base * config.numberOfDisks * 2}
                  label="Total IOPS"
                  unit="IOPS"
                  color="#f59e0b"
                  size={180}
                />
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <Gauge
                  value={performanceMetrics.throughput.total}
                  max={performanceMetrics.iops.total * config.blockSize / 1024 * 2}
                  label="Total Throughput"
                  unit="MB/s"
                  color="#8b5cf6"
                  size={180}
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Activity size={20} />
                  <span>Total IOPS</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(performanceMetrics.iops.total).toLocaleString()}</div>
                <div className="text-sm text-slate-400 mt-1">
                  {Math.round(performanceMetrics.iops.perGB)} IOPS/GB
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Activity size={20} />
                  <span>Read IOPS</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(performanceMetrics.iops.read).toLocaleString()}</div>
                <div className="text-sm text-slate-400 mt-1">
                  {Math.round(performanceMetrics.throughput.read)} MB/s
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Activity size={20} />
                  <span>Write IOPS</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(performanceMetrics.iops.write).toLocaleString()}</div>
                <div className="text-sm text-slate-400 mt-1">
                  {Math.round(performanceMetrics.throughput.write)} MB/s
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Activity size={20} />
                  <span>Latency</span>
                </div>
                <div className="text-2xl font-bold">{performanceMetrics.latency.average.toFixed(2)} ms</div>
                <div className="text-sm text-slate-400 mt-1">
                  Max: {performanceMetrics.latency.maximum.toFixed(2)} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-6">Storage Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Disk Size
              </label>
              <select
                value={config.diskSize}
                onChange={(e) => setConfig({ ...config, diskSize: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
              >
                {DISK_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} GB
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Number of Disks
              </label>
              <input
                type="number"
                value={config.numberOfDisks}
                onChange={(e) => setConfig({ ...config, numberOfDisks: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                RAID Type
              </label>
              <select
                value={config.raidType}
                onChange={(e) => setConfig({ ...config, raidType: e.target.value as StorageConfig['raidType'] })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="RAID 1">RAID 1 (Mirroring)</option>
                <option value="RAID 5">RAID 5 (Striping with Parity)</option>
                <option value="RAID 6">RAID 6 (Double Parity)</option>
                <option value="RAID 10">RAID 10 (Striping + Mirroring)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Storage Type
              </label>
              <select
                value={config.storageType}
                onChange={(e) => setConfig({ ...config, storageType: e.target.value as StorageConfig['storageType'] })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="SSD">SSD</option>
                <option value="HDD">HDD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Block Size (KB)
              </label>
              <select
                value={config.blockSize}
                onChange={(e) => setConfig({ ...config, blockSize: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
              >
                {BLOCK_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} KB
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Workload Type
              </label>
              <select
                value={config.workloadType}
                onChange={(e) => setConfig({ ...config, workloadType: e.target.value as StorageConfig['workloadType'] })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="random_read">Random Read</option>
                <option value="sequential_write">Sequential Write</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Read/Write Distribution
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={config.readPercentage}
                  onChange={(e) => setConfig({ ...config, readPercentage: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="text-sm text-slate-300 min-w-[4rem] text-right">
                  {config.readPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Write: {100 - config.readPercentage}%</span>
                <span>Read: {config.readPercentage}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Latency (ms)
              </label>
              <input
                type="number"
                value={config.latency}
                onChange={(e) => setConfig({ ...config, latency: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
                max="100"
              />
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Performance Guidelines</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>SSD: 10,000+ IOPS, 0.1ms latency</p>
                <p>HDD: 100-200 IOPS, 10ms latency</p>
                <p>RAID 1: Best for read performance</p>
                <p>RAID 5: Good balance, write penalty</p>
                <p>RAID 6: Highest protection, lower performance</p>
                <p>RAID 10: Best performance, 50% capacity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageCalculator;