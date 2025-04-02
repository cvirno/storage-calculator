import React, { useState } from 'react';
import { Info } from 'phosphor-react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-blue-800/90 border-b-transparent',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-blue-800/90 border-t-transparent',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-blue-800/90 border-r-transparent',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-blue-800/90 border-l-transparent'
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
      >
        <Info size={16} weight="fill" />
      </button>
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-blue-800/90 text-white text-sm py-2 px-3 rounded-lg shadow-lg backdrop-blur-sm border border-blue-500/30 max-w-xs">
            {text}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}; 