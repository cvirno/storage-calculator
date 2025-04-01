import React, { useState } from 'react';
import { HardDrive, Database, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StorageConfig {
  desiredCapacity: number;
  growthRate: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  diskSize: number;
  numberOfDisks: number;
  forecastYears: number;
}

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
  const [config, setConfig] = useState<StorageConfig>({
    desiredCapacity: 1000,
    growthRate: 20,
    raidType: 'RAID 5',
    diskSize: DISK_SIZES[0],
    numberOfDisks: 4,
    forecastYears: 3
  });

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setConfig({
        desiredCapacity: 1000,
        growthRate: 20,
        raidType: 'RAID 5',
        diskSize: DISK_SIZES[0],
        numberOfDisks: 4,
        forecastYears: 3
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

  const calculateFutureCapacity = () => {
    return calculateUsableCapacity() * Math.pow(1 + (config.growthRate / 100), config.forecastYears);
  };

  const generateCapacityForecast = () => {
    return Array.from({ length: config.forecastYears + 1 }, (_, i) => ({
      year: i,
      capacity: calculateUsableCapacity() * Math.pow(1 + (config.growthRate / 100), i)
    }));
  };

  const capacityData = [
    { name: 'Raw Capacity', value: calculateRawCapacity() },
    { name: 'Usable Capacity', value: calculateUsableCapacity() },
    { name: 'Future Capacity', value: calculateFutureCapacity() }
  ];

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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <HardDrive size={20} />
                <span>Future Capacity</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(calculateFutureCapacity())}</div>
              <div className="text-sm text-slate-400 mt-1">
                In {config.forecastYears} years
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Capacity Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={capacityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {capacityData.map((entry, index) => (
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
                    formatter={(value) => (
                      <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Growth Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateCapacityForecast()}>
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1024).toFixed(1)}TB`}
                  />
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
                  <Line
                    type="monotone"
                    dataKey="capacity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    {formatStorage(size)}
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
                Annual Growth Rate (%)
              </label>
              <input
                type="number"
                value={config.growthRate}
                onChange={(e) => setConfig({ ...config, growthRate: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Forecast Period (Years)
              </label>
              <input
                type="number"
                value={config.forecastYears}
                onChange={(e) => setConfig({ ...config, forecastYears: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">RAID Configuration Details</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p>RAID 1: 50% usable capacity (mirroring)</p>
              <p>RAID 5: 75% usable capacity (single parity)</p>
              <p>RAID 6: 67% usable capacity (double parity)</p>
              <p>RAID 10: 50% usable capacity (mirror + stripe)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageCalculator;