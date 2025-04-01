import React, { useState, useEffect } from 'react';
import { HardDrive, Database, Clock, TrendingUp, BarChart as BarChartIcon, Save, HardDriveDownload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface BackupMetrics {
  dailyBackupSize: number;
  totalBackupSize: number;
  yearlyGrowth: number[];
  storageByRetention: { name: string; value: number; }[];
  backupTimeline: { day: number; size: number; }[];
  storageDetails: {
    raw: number;
    compressed: number;
    withRetention: number;
    projected: number;
  };
}

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

const BackupCalculator = () => {
  const [originalData, setOriginalData] = useState<number>(100); // TB
  const [backupFrequency, setBackupFrequency] = useState<number>(1);
  const [retentionPeriod, setRetentionPeriod] = useState<number>(30);
  const [compressionRatio, setCompressionRatio] = useState<number>(0.5);
  const [changeRate, setChangeRate] = useState<number>(10);
  const [annualGrowth, setAnnualGrowth] = useState<number>(20);
  const [years, setYears] = useState<number>(3);
  const [metrics, setMetrics] = useState<BackupMetrics>({
    dailyBackupSize: 0,
    totalBackupSize: 0,
    yearlyGrowth: [],
    storageByRetention: [],
    backupTimeline: [],
    storageDetails: {
      raw: 0,
      compressed: 0,
      withRetention: 0,
      projected: 0
    }
  });

  const calculateMetrics = () => {
    // Calculate daily backup size with change rate
    const dailyChangedData = (originalData * (changeRate / 100));
    const dailyBackupSize = dailyChangedData * compressionRatio * backupFrequency;

    // Calculate total backup size with retention
    const totalBackupSize = dailyBackupSize * retentionPeriod;

    // Calculate yearly growth with compound interest
    const yearlyGrowth = Array.from({ length: years }, (_, i) => {
      const growth = originalData * Math.pow(1 + (annualGrowth / 100), i + 1);
      return Number(growth.toFixed(2));
    });

    // Calculate storage by retention periods with compression
    const storageByRetention = [
      { name: 'Diário', value: dailyBackupSize },
      { name: 'Semanal', value: dailyBackupSize * 7 },
      { name: 'Mensal', value: dailyBackupSize * 30 },
      { name: 'Anual', value: dailyBackupSize * 365 }
    ];

    // Generate backup timeline with cumulative growth
    const backupTimeline = Array.from({ length: retentionPeriod }, (_, i) => ({
      day: i + 1,
      size: dailyBackupSize * (i + 1),
      cumulative: dailyBackupSize * (i + 1),
      growth: dailyBackupSize * (i + 1) * (1 + (annualGrowth / 100))
    }));

    // Calculate detailed storage metrics with improved accuracy
    const rawBackupSize = originalData * (changeRate / 100) * backupFrequency;
    const compressedSize = rawBackupSize * compressionRatio;
    const withRetention = compressedSize * retentionPeriod;
    const projectedSize = withRetention * Math.pow(1 + (annualGrowth / 100), years);

    setMetrics({
      dailyBackupSize,
      totalBackupSize,
      yearlyGrowth,
      storageByRetention,
      backupTimeline,
      storageDetails: {
        raw: rawBackupSize,
        compressed: compressedSize,
        withRetention,
        projected: projectedSize
      }
    });
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      // Reset all input values to defaults
      setOriginalData(100);
      setBackupFrequency(1);
      setRetentionPeriod(30);
      setCompressionRatio(0.5);
      setChangeRate(10);
      setAnnualGrowth(20);
      setYears(3);
    }
  };

  useEffect(() => {
    calculateMetrics();
  }, [originalData, backupFrequency, retentionPeriod, compressionRatio, changeRate, annualGrowth, years]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Database size={20} />
                <span>Tamanho do Backup Diário</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(metrics.dailyBackupSize)}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <HardDrive size={20} />
                <span>Armazenamento Total</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(metrics.totalBackupSize)}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Clock size={20} />
                <span>Dias de Retenção</span>
              </div>
              <div className="text-2xl font-bold">{retentionPeriod}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingUp size={20} />
                <span>Crescimento Anual</span>
              </div>
              <div className="text-2xl font-bold">{annualGrowth}%</div>
            </div>
          </div>

          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Análise de Crescimento do Armazenamento</h2>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.backupTimeline}>
                    <defs>
                      <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8' }}
                    />
                    <YAxis 
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#E2E8F0'
                      }}
                      formatter={(value: number) => formatStorage(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="size"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="growth"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.storageByRetention}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8' }}
                    />
                    <YAxis 
                      stroke="#94A3B8"
                      tick={{ fill: '#94A3B8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#E2E8F0'
                      }}
                      formatter={(value: number) => formatStorage(value)}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#colorBar)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">Distribuição de Armazenamento</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="colorRaw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompressed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: 'Raw', value: metrics.storageDetails.raw },
                        { name: 'Compressed', value: metrics.storageDetails.compressed },
                        { name: 'With Retention', value: metrics.storageDetails.withRetention }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="url(#colorRaw)" />
                      <Cell fill="url(#colorCompressed)" />
                      <Cell fill="url(#colorRetention)" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#E2E8F0'
                      }}
                      formatter={(value: number) => formatStorage(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm text-slate-400">Armazenamento Bruto</p>
                    <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.raw)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-sm text-slate-400">Armazenamento Comprimido</p>
                    <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.compressed)}</p>
                    <p className="text-xs text-slate-500">
                      {((1 - compressionRatio) * 100).toFixed(0)}% redução
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <div>
                    <p className="text-sm text-slate-400">Armazenamento com Retenção</p>
                    <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.withRetention)}</p>
                    <p className="text-xs text-slate-500">
                      {retentionPeriod} dias de retenção
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">Parâmetros de Backup</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Frequência de Backup (por dia)
                </label>
                <input
                  type="number"
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(Number(e.target.value))}
                  min="1"
                  max="24"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Período de Retenção (dias)
                </label>
                <input
                  type="number"
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Taxa de Compressão
                </label>
                <input
                  type="number"
                  value={compressionRatio}
                  onChange={(e) => setCompressionRatio(Number(e.target.value))}
                  min="0.1"
                  max="1"
                  step="0.1"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Taxa de Alteração (%)
                </label>
                <input
                  type="number"
                  value={changeRate}
                  onChange={(e) => setChangeRate(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Crescimento Anual (%)
                </label>
                <input
                  type="number"
                  value={annualGrowth}
                  onChange={(e) => setAnnualGrowth(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Anos de Projeção
                </label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full bg-slate-800/50 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">Linha do Tempo do Backup</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.backupTimeline}>
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => `Dia ${value}`}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(value) => formatStorage(value)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0].value !== undefined) {
                    return (
                      <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700">
                        <p className="text-sm text-slate-400">
                          Dia {payload[0].payload.day}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {formatStorage(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="size" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">Detalhes do Armazenamento</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Armazenamento Bruto</h3>
            <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.raw)}</p>
            <p className="text-sm text-slate-400">Sem compressão</p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Armazenamento Comprimido</h3>
            <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.compressed)}</p>
            <p className="text-sm text-slate-400">Com taxa de compressão</p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Armazenamento com Retenção</h3>
            <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.withRetention)}</p>
            <p className="text-sm text-slate-400">Com período de retenção</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupCalculator;