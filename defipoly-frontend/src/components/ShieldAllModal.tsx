// ============================================
// FILE: defipoly-frontend/src/components/ShieldAllModal.tsx
// Modal for shielding multiple selected properties (FIXED)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, X, AlertCircle, CheckCircle, Loader, Trophy, Clock } from 'lucide-react';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useNotification } from '../contexts/NotificationContext';
import { PROPERTIES, TOKEN_TICKER } from '@/utils/constants';

interface OwnedProperty {
  propertyId: number;
  propertyInfo: typeof PROPERTIES[0];
  slotsOwned: number;
  shieldCost: number;
}

interface ShieldAllModalProps {
  ownedProperties: OwnedProperty[];
  balance: number;
  onClose: () => void;
}

type ShieldStatus = 'pending' | 'processing' | 'success' | 'error';

interface PropertyShieldStatus {
  propertyId: number;
  propertyName: string;
  selected: boolean;
  status: ShieldStatus;
  error?: string | undefined;
}

export function ShieldAllModal({ ownedProperties, balance, onClose }: ShieldAllModalProps) {
  const { activateShield } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  
  const [shielding, setShielding] = useState(false);
  const [propertyStatuses, setPropertyStatuses] = useState<PropertyShieldStatus[]>(
    ownedProperties.map(p => ({
      propertyId: p.propertyId,
      propertyName: p.propertyInfo.name,
      selected: true, // All selected by default
      status: 'pending' as ShieldStatus
    }))
  );
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Check for mobile (match main page breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const propertyCount = ownedProperties.length;
  
  // Calculate based on selected properties only
  const selectedProperties = ownedProperties.filter(p => 
    propertyStatuses.find(ps => ps.propertyId === p.propertyId)?.selected
  );
  const selectedCount = selectedProperties.length;
  const totalCost = selectedProperties.reduce((sum, p) => sum + p.shieldCost, 0);
  const canAfford = balance >= totalCost;

  const toggleProperty = (propertyId: number) => {
    if (shielding) return; // Can't change selection while shielding
    
    setPropertyStatuses(prev =>
      prev.map(p =>
        p.propertyId === propertyId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const toggleSelectAll = () => {
    if (shielding) return;
    
    const allSelected = propertyStatuses.every(p => p.selected);
    setPropertyStatuses(prev =>
      prev.map(p => ({ ...p, selected: !allSelected }))
    );
  };

  const updatePropertyStatus = (propertyId: number, status: ShieldStatus, error?: string) => {
    setPropertyStatuses(prev =>
      prev.map(p =>
        p.propertyId === propertyId ? { ...p, status, error } : p
      )
    );
  };

  const handleShield = async () => {
    if (!canAfford || shielding || selectedCount === 0) return;
    
    setShielding(true);
  
    // Mark all as processing
    selectedProperties.forEach(property => {
      updatePropertyStatus(property.propertyId, 'processing');
    });
  
    try {
      // Prepare data for batched transaction
      const propertiesToShield = selectedProperties.map(property => ({
        propertyId: property.propertyId,
        slotsToShield: property.slotsOwned
      }));
  
      const BATCH_SIZE = 5;
      const totalBatches = Math.ceil(propertiesToShield.length / BATCH_SIZE);
      
      // Show batch info if multiple batches needed
      if (totalBatches > 1) {
        console.log(`Processing ${selectedCount} properties in ${totalBatches} batches...`);
      }
  
      // Execute individual shield activations
      const successes = [];
      for (const property of propertiesToShield) {
        try {
          const signature = await activateShield(property.propertyId, property.slotsToShield);
          successes.push(signature);
        } catch (error) {
          console.error(`Failed to shield property ${property.propertyId}:`, error);
          updatePropertyStatus(property.propertyId, 'error', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      if (successes.length > 0) {
        // Mark all as success
        selectedProperties.forEach(property => {
          updatePropertyStatus(property.propertyId, 'success');
        });
  
        const message = `Successfully shielded ${successes.length} out of ${selectedCount} properties!`;
  
        showSuccess(
          'Properties Shielded!',
          message,
          successes[0] !== 'already-processed' ? successes[0] : undefined
        );
      
        setTimeout(() => onClose(), 2000);
      }
    } catch (error: any) {
      console.error('Error shielding properties:', error);
      
      // Mark all as error
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      selectedProperties.forEach(property => {
        updatePropertyStatus(property.propertyId, 'error', errorMessage);
      });
  
      showError(
        'Shield Failed',
        'Failed to shield properties. Please try again.'
      );
    } finally {
      setShielding(false);
    }
  };

  const getStatusIcon = (propStatus: PropertyShieldStatus) => {
    if (!propStatus.selected) return null;
    
    switch (propStatus.status) {
      case 'pending':
        return null; // No icon for pending
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const completedCount = propertyStatuses.filter(p => p.selected && p.status === 'success').length;
  const progressPercent = selectedCount > 0 ? (completedCount / selectedCount) * 100 : 0;
  const allSelected = propertyStatuses.every(p => p.selected);
  
  // Swipe-to-close handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    if (touch) {
      setStartY(touch.clientY);
      setIsDragging(true);
    }
  }, [isMobile]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !startY || !isDragging) return;
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - startY;
      if (deltaY > 0) { // Only allow downward swipe
        setDragOffset(deltaY);
      }
    }
  }, [isMobile, startY, isDragging]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isDragging) return;
    
    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      onClose();
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setStartY(null);
  }, [isMobile, isDragging, dragOffset, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-2 lg:p-4"
      onClick={shielding ? undefined : onClose}
    >
      <div 
        className={`
          bg-black overflow-hidden transition-transform duration-200
          ${isMobile 
            ? 'w-full h-[90vh] max-h-[90vh] flex flex-col' 
            : 'max-w-lg w-full max-h-[90vh]'
          }
        `}
        style={isMobile ? { transform: `translateY(${dragOffset}px)` } : {}}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="relative bg-black p-3 lg:p-4 flex-shrink-0">
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center mb-2">
              <div className="w-12 h-1.5 bg-purple-400/60 rounded-full"></div>
            </div>
          )}
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Shield className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-300`} />
              <div>
                <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black text-purple-100`}>Shield Properties</h2>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-300/80 mt-1`}>Select properties to protect</p>
              </div>
            </div>
            {!shielding && (
              <button 
                onClick={onClose}
                className="text-purple-300 hover:text-white transition-colors p-2"
              >
                <X size={isMobile ? 24 : 20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`
          ${isMobile ? 'flex-1 p-4 overflow-y-auto pb-safe' : 'p-6 max-h-[60vh] overflow-y-auto'}
        `}>
          {/* All Properties Already Shielded or in Cooldown */}
          {propertyCount === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <div className="text-lg font-bold text-purple-100 mb-2">All Properties Protected!</div>
              <div className="text-sm text-purple-300 mb-3">
                All your properties are either actively shielded or in cooldown period.
              </div>
              <div className="bg-purple-900/20 p-3 mb-4 text-xs text-purple-300">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">Cooldown Info:</span>
                </div>
                <div>After a 48-hour shield expires, there's a 12-hour cooldown before you can reactivate.</div>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-purple-800/60 hover:bg-purple-700/60 font-bold text-purple-100 transition-all"
              >
                Close
              </button>
            </div>
          )}

          {propertyCount > 0 && (
            <>
              {/* Summary Card */}
          <div className="bg-purple-950/20 p-3 lg:p-4 mb-4">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-300 font-semibold`}>Selected Properties:</span>
              <span className={`${isMobile ? 'text-base' : 'text-lg'} text-purple-100 font-black`}>{selectedCount} / {propertyCount}</span>
            </div>
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-300 font-semibold`}>Total Cost:</span>
              <span className={`${isMobile ? 'text-base' : 'text-lg'} text-yellow-300 font-black`}>{totalCost.toLocaleString()} ${TOKEN_TICKER}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-300 font-semibold`}>Your Balance:</span>
              <span className={`${isMobile ? 'text-base' : 'text-lg'} font-black ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {balance.toLocaleString()} ${TOKEN_TICKER}
              </span>
            </div>
          </div>

          {/* Select All Button */}
          <button
            onClick={toggleSelectAll}
            disabled={shielding}
            className={`w-full py-2 font-bold text-sm mb-3 transition-all ${
              shielding
                ? 'bg-purple-800/30 text-purple-500 cursor-not-allowed'
                : 'bg-purple-800/60 hover:bg-purple-700/60 text-purple-100'
            }`}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          {/* Insufficient Balance Warning */}
          {!canAfford && selectedCount > 0 && (
            <div className="bg-red-900/20 p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <div className="font-bold mb-1">Insufficient Balance</div>
                <div>You need {(totalCost - balance).toLocaleString()} more ${TOKEN_TICKER} to shield selected properties.</div>
              </div>
            </div>
          )}

          {/* No Selection Warning */}
          {selectedCount === 0 && (
            <div className="bg-amber-900/20 p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <div className="font-bold mb-1">No Properties Selected</div>
                <div>Please select at least one property to shield.</div>
              </div>
            </div>
          )}

          {/* Progress Bar (when shielding) */}
          {shielding && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-purple-300 mb-2">
                <span>Shielding Properties...</span>
                <span>{completedCount} / {selectedCount}</span>
              </div>
              <div className="w-full bg-purple-900/40 h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Properties List */}
          <div className="space-y-2">
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-300 font-semibold uppercase tracking-wide mb-2`}>
              Properties Available to Shield:
            </div>
            {propertyStatuses.map((propStatus) => {
              const property = ownedProperties.find(p => p.propertyId === propStatus.propertyId);
              if (!property) return null;

              const isSelected = propStatus.selected;

              return (
                <div 
                  key={propStatus.propertyId}
                  onClick={() => toggleProperty(propStatus.propertyId)}
                  className={`${isMobile ? 'p-2.5' : 'p-3'} transition-all cursor-pointer ${
                    shielding ? 'cursor-not-allowed' : ''
                  } ${
                    !isSelected ? 'bg-purple-950/20 opacity-50' :
                    propStatus.status === 'success' ? 'bg-green-950/20' :
                    propStatus.status === 'error' ? 'bg-red-950/20' :
                    propStatus.status === 'processing' ? 'bg-blue-950/20' :
                    'bg-purple-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                      {/* Status Icon (only when processing/success/error) */}
                      {getStatusIcon(propStatus)}
                      
                      <div className="flex-1 min-w-0">
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-purple-100 truncate`}>
                          {propStatus.propertyName}
                        </div>
                        <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-400`}>
                          {property.slotsOwned} slot{property.slotsOwned > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-yellow-300`}>
                        {property.shieldCost.toLocaleString()}
                      </div>
                      <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-400`}>DEFI</div>
                    </div>
                  </div>
                  
                  {propStatus.status === 'error' && propStatus.error && (
                    <div className={`mt-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-red-300 flex items-start gap-1`}>
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{propStatus.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className={`mt-4 bg-purple-900/20 ${isMobile ? 'p-2.5' : 'p-3'}`}>
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-300`}>
              <div className={`font-bold ${isMobile ? 'mb-1.5' : 'mb-2'} flex items-center gap-2`}>
                <Shield className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                Shield Information
              </div>
              <div className={`${isMobile ? 'space-y-1' : 'space-y-1.5'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-300">•</span>
                  <span><strong>Duration:</strong> 48 hours of protection from theft</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-300">•</span>
                  <span><strong>Cooldown:</strong> 12-hour cooldown after shield expires</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-300">•</span>
                  <span><strong>Coverage:</strong> All selected slots will be protected</span>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Footer Actions - only show when there are properties */}
        {propertyCount > 0 && (
          <div className={`${isMobile ? 'p-4' : 'p-6'} bg-black flex gap-3 flex-shrink-0`}>
          <button
            onClick={onClose}
            disabled={shielding}
            className={`flex-1 ${isMobile ? 'py-2.5' : 'py-3'} font-bold ${isMobile ? 'text-sm' : 'text-base'} transition-all ${
              shielding 
                ? 'bg-purple-800/30 text-purple-500 cursor-not-allowed'
                : 'bg-purple-800/60 hover:bg-purple-700/60 text-purple-100'
            }`}
          >
            {shielding ? 'Shielding...' : 'Cancel'}
          </button>
          <button
            onClick={handleShield}
            disabled={!canAfford || shielding || selectedCount === 0}
            className={`flex-1 ${isMobile ? 'py-2.5 px-3' : 'py-3 px-4'} font-bold ${isMobile ? 'text-xs' : 'text-sm'} transition-all flex items-center justify-center gap-2 ${
              !canAfford || shielding || selectedCount === 0
                ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white'
            }`}
          >
            {shielding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Shielding...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className={isMobile ? 'text-xs' : 'text-sm'}>Shield ({totalCost.toLocaleString()} DEFI)</span>
              </>
            )}
          </button>
        </div>
        )}

        {/* Success Overlay - only show when properties exist */}
        {propertyCount > 0 && !shielding && completedCount === selectedCount && selectedCount > 0 && (
          <div className="absolute inset-0 bg-green-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <div className="text-2xl font-black text-white mb-2">
                {selectedCount === 1 ? 'Property Shielded!' : 'Properties Shielded!'}
              </div>
              <div className="text-green-300 mb-1">Your properties are now protected</div>
              <div className="text-sm text-green-400/80">48h protection • 12h cooldown after</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}