import { ShoppingCart, Crosshair } from 'lucide-react';

interface UnownedOverlayProps {
  children: React.ReactNode;
  message?: string;
}

export function UnownedOverlay({ 
  children, 
  message = "Buy or steal a property to access this feature" 
}: UnownedOverlayProps) {
  return (
    <div className="relative">
      {/* Greyed-out content */}
      <div className="opacity-40 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay with message */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
        <div className="text-center px-4 py-3 bg-purple-900/80 rounded-lg border border-purple-500/40 max-w-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-purple-300">OR</span>
            <Crosshair className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-sm font-medium text-white mb-1">Property Not Owned</p>
          <p className="text-xs text-purple-200 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}