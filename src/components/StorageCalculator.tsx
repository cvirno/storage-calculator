import React, { useState, useEffect } from 'react';
import { HardDrive, Database, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StorageConfig {
  desiredCapacity: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  diskSize: number;
  numberOfDisks: number;
  storageType: 'SSD' | 'HDD';
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

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

const formatStorage = (gb: number): string => {
  if (!gb || isNaN(gb)) return '0 GB';
  
  if (gb >= 1000) {
    const tb = gb / 1000;
    if (Math.abs(tb - 1.92) < 0.01) return '1.92 TB';
    if (Math.abs(tb - 3.84) < 0.01) return '3.84 TB';
    if (Math.abs(tb - 7.68) < 0.01) return '7.68 TB';
    if (Math.abs(tb - 15.36) < 0.01) return '15.36 TB';
    if (Math.floor(tb) === tb) return `${tb} TB`;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
};

const calculateRawCapacity = (diskSize: number, numberOfDisks: number): number => {
  if (!diskSize || !numberOfDisks) return 0;
  return diskSize * numberOfDisks;
};

const calculateUsableCapacity = (diskSize: number, numberOfDisks: number, raidType: string): number => {
  const rawCapacity = calculateRawCapacity(diskSize, numberOfDisks);
  if (!rawCapacity) return 0;
  
  switch (raidType) {
    case 'RAID 1':
      return rawCapacity * 0.5;
    case 'RAID 5':
      if (numberOfDisks < 3) return 0;
      return (numberOfDisks - 1) * diskSize;
    case 'RAID 6':
      if (numberOfDisks < 4) return 0;
      return (numberOfDisks - 2) * diskSize;
    case 'RAID 10':
      if (numberOfDisks < 4 || numberOfDisks % 2 !== 0) return 0;
      return rawCapacity * 0.5;
    default:
      return 0;
  }
};

const Gauge: React.FC<GaugeProps> = ({ value, max, label, unit, color, size = 200 }) => {
  const safeValue = Number(value) || 0;
  const safeMax = Number(max) || 1;
  const percentage = Math.min(100, (safeValue / safeMax) * 100);
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
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
            strokeLinecap="round"
            strokeLinejoin="round"
        />
      </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">
            {safeValue.toLocaleString()}
          </div>
          <div className="text-sm text-slate-400">
            {unit}
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-400">
        {label}
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
    storageType: 'SSD'
  });

  const [rawCapacity, setRawCapacity] = useState(0);
  const [usableCapacity, setUsableCapacity] = useState(0);

  useEffect(() => {
    const raw = calculateRawCapacity(config.diskSize, config.numberOfDisks);
    const usable = calculateUsableCapacity(config.diskSize, config.numberOfDisks, config.raidType);
    
    setRawCapacity(raw);
    setUsableCapacity(usable);
  }, [config]);

  const handleConfigChange = (key: keyof StorageConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setConfig({
        desiredCapacity: 1000,
        raidType: 'RAID 5',
        diskSize: DISK_SIZES[0],
        numberOfDisks: 4,
        storageType: 'SSD'
      });
    }
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Storage Calculator</h1>
          <button
            onClick={resetAllData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section - Dynamic */}
        <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
          <div className="space-y-4">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Storage Type</label>
              <select
                value={config.storageType}
                  onChange={(e) => handleConfigChange('storageType', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="SSD">SSD</option>
                <option value="HDD">HDD</option>
              </select>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">RAID Type</label>
              <select
                  value={config.raidType}
                  onChange={(e) => handleConfigChange('raidType', e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="RAID 1">RAID 1</option>
                  <option value="RAID 5">RAID 5</option>
                  <option value="RAID 6">RAID 6</option>
                  <option value="RAID 10">RAID 10</option>
              </select>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Disk Size</label>
              <select
                  value={config.diskSize}
                  onChange={(e) => handleConfigChange('diskSize', Number(e.target.value))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  {DISK_SIZES.map(size => (
                    <option key={size} value={size}>{formatStorage(size)}</option>
                  ))}
              </select>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Number of Disks</label>
                <input
                  type="number"
                  min={config.raidType === 'RAID 5' ? 3 : config.raidType === 'RAID 6' ? 4 : config.raidType === 'RAID 10' ? 4 : 2}
                  value={config.numberOfDisks}
                  onChange={(e) => handleConfigChange('numberOfDisks', Number(e.target.value))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
              </div>
            </div>

        {/* Results Section - Static */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storage Metrics */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Volumetria de Armazenamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Gauge
                  value={rawCapacity}
                  max={Math.max(rawCapacity, config.diskSize * 24)}
                  label="Armazenamento Total"
                  unit={rawCapacity >= 1000 ? "TB" : "GB"}
                  color="#3b82f6"
                  size={180}
                />
                <div className="mt-4 text-sm text-slate-400">
                  <div className="font-medium">Capacidade Bruta: {formatStorage(rawCapacity)}</div>
                  <div>Discos: {config.numberOfDisks} x {formatStorage(config.diskSize)}</div>
                  <div>Total: {formatStorage(config.numberOfDisks * config.diskSize)}</div>
            </div>
              </div>
              <div>
                <Gauge
                  value={usableCapacity}
                  max={Math.max(usableCapacity, config.diskSize * 24 * RAID_FACTORS[config.raidType])}
                  label="Armazenamento Utilizável"
                  unit={usableCapacity >= 1000 ? "TB" : "GB"}
                  color="#10b981"
                  size={180}
                />
                <div className="mt-4 text-sm text-slate-400">
                  <div className="font-medium">Capacidade Líquida: {formatStorage(usableCapacity)}</div>
                  <div>RAID: {config.raidType}</div>
                  <div>Fator de Eficiência: {
                    config.raidType === 'RAID 5' ? `${((config.numberOfDisks - 1) / config.numberOfDisks * 100).toFixed(1)}%` :
                    config.raidType === 'RAID 6' ? `${((config.numberOfDisks - 2) / config.numberOfDisks * 100).toFixed(1)}%` :
                    `${RAID_FACTORS[config.raidType] * 100}%`
                  }</div>
                  <div className="mt-2">
                    <div className="font-medium">Cálculo Líquido:</div>
                    {config.raidType === 'RAID 5' && (
                      <div>{(config.numberOfDisks - 1)} discos x {formatStorage(config.diskSize)} = {formatStorage(usableCapacity)}</div>
                    )}
                    {config.raidType === 'RAID 6' && (
                      <div>{(config.numberOfDisks - 2)} discos x {formatStorage(config.diskSize)} = {formatStorage(usableCapacity)}</div>
                    )}
                    {config.raidType === 'RAID 1' && (
                      <div>{config.numberOfDisks} discos / 2 = {formatStorage(usableCapacity)}</div>
                    )}
                    {config.raidType === 'RAID 10' && (
                      <div>{config.numberOfDisks} discos / 2 = {formatStorage(usableCapacity)}</div>
                    )}
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageCalculator;