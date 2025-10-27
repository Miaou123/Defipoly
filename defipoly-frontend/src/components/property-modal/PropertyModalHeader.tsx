'use client';

import { X } from 'lucide-react';

interface PropertyModalHeaderProps {
  propertyName: string;
  propertyColor: string;
  onClose: () => void;
}

export function PropertyModalHeader({ propertyName, propertyColor, onClose }: PropertyModalHeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-purple-100 mb-1.5">{propertyName}</h2>
          <div className={`${propertyColor} h-2.5 w-20 rounded-full shadow-lg`}></div>
        </div>
        <button 
          onClick={onClose} 
          className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-1.5"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}