import React from 'react';
import { Database } from 'lucide-react';

interface ReportLayoutProps {
  title: string;
  children: React.ReactNode;
  reportId: string;
}

const ReportLayout = ({ title, children, reportId }: ReportLayoutProps) => {
  return (
    <div id={reportId} className="bg-slate-900 p-8 rounded-xl space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-700 pb-6">
        <Database size={40} className="text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {children}

      <div className="border-t border-slate-700 pt-6 text-center text-slate-400">
        <p>Dimensionamento de Data Center - Desenvolvido por Cesar Virno</p>
        <p className="text-sm">© {new Date().getFullYear()} Todos os direitos reservados</p>
      </div>
    </div>
  );
};

export default ReportLayout;