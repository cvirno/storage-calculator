import React from 'react';
import { Server as ServerIcon, HardDrive, Network, Cpu, Layers, Power } from 'lucide-react';

interface RackVisualizationProps {
  servers: Array<{
    id: string;
    name: string;
    rackUnits: number;
    processors?: number;
    coresPerProcessor?: number;
  }>;
  view: 'front' | 'rear';
}

const RackVisualization: React.FC<RackVisualizationProps> = ({ servers, view }) => {
  const TOTAL_UNITS = 42;
  const UNIT_HEIGHT = 30;
  const OUTLETS_PER_SERVER = 4; // 2 power supplies × 2 outlets each

  // Calculate total processors and cores
  const totalProcessors = servers.reduce((acc, server) => acc + (server.processors || 0), 0);
  const totalCores = servers.reduce((acc, server) => acc + ((server.processors || 0) * (server.coresPerProcessor || 0)), 0);
  const totalPowerOutlets = servers.length * OUTLETS_PER_SERVER;

  const rackUnits = Array.from({ length: TOTAL_UNITS }, (_, i) => i + 1);
  
  const occupiedUnits: Record<number, {
    server: {
      id: string;
      name: string;
      rackUnits: number;
    };
    position: 'top' | 'bottom' | 'full';
  }> = {};

  let currentU = 1;
  servers.forEach(server => {
    if (currentU + server.rackUnits - 1 <= TOTAL_UNITS) {
      if (server.rackUnits === 2) {
        occupiedUnits[currentU] = {
          server,
          position: 'bottom'
        };
        occupiedUnits[currentU + 1] = {
          server,
          position: 'top'
        };
      } else {
        occupiedUnits[currentU] = {
          server,
          position: 'full'
        };
      }
      currentU += server.rackUnits;
    }
  });

  const usedUnits = servers.reduce((acc, server) => acc + server.rackUnits, 0);
  const availableUnits = TOTAL_UNITS - usedUnits;
  const usagePercentage = (usedUnits / TOTAL_UNITS) * 100;

  const Server1U: React.FC<{ view: 'front' | 'rear' }> = ({ view }) => (
    <div className="w-full h-full bg-blue-900/30 relative border border-blue-700/50">
      {view === 'front' ? (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
          </div>
          
          <div className="absolute inset-0 grid grid-cols-4 gap-[2px] p-1 ml-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                <HardDrive size={10} className="text-blue-700" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex">
          <div className="w-1/3 border-r border-blue-700/50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-[2px] p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                <Network size={10} className="text-blue-700" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Server2UHalf: React.FC<{ view: 'front' | 'rear'; position: 'top' | 'bottom' }> = ({ view, position }) => (
    <div className="w-full h-full bg-purple-900/30 relative border-x border-purple-700/50">
      {view === 'front' ? (
        <>
          {position === 'bottom' && (
            <>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
              </div>
              
              <div className="absolute inset-0 grid grid-cols-4 gap-[2px] p-1 ml-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                    <HardDrive size={12} className="text-purple-700" />
                  </div>
                ))}
              </div>
            </>
          )}
          {position === 'top' && (
            <div className="absolute inset-0 grid grid-cols-4 gap-[2px] p-1 ml-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                  <HardDrive size={12} className="text-purple-700" />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {position === 'bottom' && (
            <div className="absolute inset-0 flex">
              <div className="w-1/3 border-r border-purple-700/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-[2px] p-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                    <Network size={12} className="text-purple-700" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {position === 'top' && (
            <div className="absolute inset-0 flex">
              <div className="w-1/3 border-r border-purple-700/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-[2px] p-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 rounded-sm flex items-center justify-center">
                    <Network size={12} className="text-purple-700" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ServerIcon size={16} />
            <span className="text-sm">Total de Servidores</span>
          </div>
          <div className="text-2xl font-bold">{servers.length}</div>
          <div className="text-sm text-slate-400 mt-1">Unidades: {usedUnits}U</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Cpu size={16} />
            <span className="text-sm">CPUs Físicas</span>
          </div>
          <div className="text-2xl font-bold">{totalProcessors}</div>
          <div className="text-sm text-slate-400 mt-1">Núcleos Físicos: {totalCores}</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Layers size={16} />
            <span className="text-sm">Total Cores</span>
          </div>
          <div className="text-2xl font-bold">{totalCores}</div>
          <div className="text-sm text-slate-400 mt-1">Physical Cores</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Power size={16} />
            <span className="text-sm">Power Outlets</span>
          </div>
          <div className="text-2xl font-bold">{totalPowerOutlets}</div>
          <div className="text-sm text-slate-400 mt-1">Total Required</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ServerIcon size={16} />
            <span className="text-sm">Available Space</span>
          </div>
          <div className="text-2xl font-bold">{availableUnits}U</div>
          <div className="text-sm text-slate-400 mt-1">{((availableUnits / TOTAL_UNITS) * 100).toFixed(1)}% free</div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ServerIcon size={16} />
            <span className="text-sm">Total Capacity</span>
          </div>
          <div className="text-2xl font-bold">{TOTAL_UNITS}U</div>
          <div className="text-sm text-slate-400 mt-1">Standard rack height</div>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-400">{view === 'front' ? 'Front View' : 'Rear View'}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-900/30 border border-blue-700/50"></div>
                <span className="text-xs text-slate-400">Servidor 1U</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-purple-900/30 border border-purple-700/50"></div>
                <span className="text-xs text-slate-400">Servidor 2U</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-400">{usagePercentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="border border-slate-700 rounded-lg w-[480px] mx-auto">
          {rackUnits.reverse().map(u => {
            const unit = occupiedUnits[u];
            
            return (
              <div
                key={u}
                className={`border-b border-slate-700/50 flex items-stretch ${
                  unit ? 'bg-slate-800/50' : 'bg-slate-800/20'
                }`}
                style={{ height: `${UNIT_HEIGHT}px` }}
              >
                <div className="w-8 flex items-center justify-center border-r border-slate-700/50 text-[10px] text-slate-400">
                  {u}
                </div>
                
                <div className="flex-1 relative">
                  {unit && (
                    <>
                      {unit.server.rackUnits === 2 ? (
                        <Server2UHalf view={view} position={unit.position as 'top' | 'bottom'} />
                      ) : (
                        <Server1U view={view} />
                      )}
                      
                      {(unit.position === 'bottom' || unit.position === 'full') && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center px-4 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <ServerIcon size={12} className={unit.server.rackUnits === 2 ? "text-purple-400" : "text-blue-400"} />
                            <span className="text-[10px] font-medium text-slate-300 truncate">
                              {unit.server.name} ({unit.server.rackUnits}U)
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RackVisualization;