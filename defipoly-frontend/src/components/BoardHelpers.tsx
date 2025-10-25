'use client';

interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function CornerSquare({ icon, label, bgColor }: CornerSquareProps) {
  return (
    <div className={`${bgColor} border border-gray-700/30 flex flex-col items-center justify-center p-2 h-full relative overflow-hidden`}>
      {bgColor.includes('red') && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 animate-pulse"></div>
      )}
      <div className="relative text-3xl mb-1">{icon}</div>
      <div className={`relative text-[7px] font-black text-center uppercase ${bgColor.includes('orange') ? 'text-white' : 'text-gray-800'} leading-tight`}>
        {label.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

interface FillerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function FillerSquare({ icon, label, bgColor }: FillerSquareProps) {
  return (
    <div className={`${bgColor} border border-gray-700/30 flex flex-col items-center justify-center p-2 h-full`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[7px] font-black text-center uppercase text-gray-800 leading-tight">
        {label}
      </div>
    </div>
  );
}