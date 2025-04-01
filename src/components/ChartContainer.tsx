import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default ChartContainer;