import React from 'react';

interface Metric {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

interface MetricsGridProps {
  metrics: Metric[];
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            {metric.icon}
            <span>{metric.label}</span>
          </div>
          <div className="text-2xl font-bold">{metric.value}</div>
          {metric.subtext && (
            <div className="text-sm text-slate-400 mt-1">{metric.subtext}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;