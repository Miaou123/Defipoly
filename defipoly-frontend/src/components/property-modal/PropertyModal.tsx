// ============================================
// FILE: src/components/property-modal/PropertyModal.tsx
// ✅ MOBILE RESPONSIVE VERSION
// ============================================

'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { PROPERTIES, SET_BONUSES } from '@/utils/constants';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { StyledWalletButton } from '../StyledWalletButton';
import { X } from 'lucide-react';
import { PropertyCard } from '../PropertyCard';
import { PropertyActionsBar } from './PropertyActionsBar';
import {
  BuyPropertyExplanationModal,
  SellPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '../HelpModal';
import { useGameState } from '@/contexts/GameStateContext';
import { fetchPropertyState } from '@/services/api';
import { StarIcon } from '../icons/UIIcons';

interface PropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
}

type HelpModalType = 'buy' | 'shield' | 'sell' | 'steal' | null;

export function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  const { connected } = useWallet();
  const { program, tokenBalance: balance } = useDefipoly();
  const wallet = useAnchorWallet();
  
  // Memoize property to prevent unnecessary re-renders
  const property = useMemo(() => 
    propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null,
    [propertyId]
  );
  
  const gameState = useGameState();
  const { getOwnership } = gameState;
  
  // Prevent duplicate API calls
  const fetchingRef = useRef(false);
  const lastFetchedPropertyId = useRef<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState<HelpModalType>(null);
  const [setBonusInfo, setSetBonusInfo] = useState<{
    hasCompleteSet: boolean;
    boostedSlots: number;
    totalSlots: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile swipe state
  const [activeTab, setActiveTab] = useState(0); // 0: buy, 1: shield, 2: sell, 3: steal
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Check for mobile (match main page breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mark that user has opened a property modal
  useEffect(() => {
    if (propertyId !== null) {
      localStorage.setItem('hasOpenedPropertyModal', 'true');
      // Dispatch custom event to notify other components immediately
      window.dispatchEvent(new Event('propertyModalOpened'));
    }
  }, [propertyId]);
  
  // Fetch property state from API (only when needed)
  useEffect(() => {
    if (propertyId === null || !connected || !property) {
      setPropertyData(null);
      setSetBonusInfo(null);
      lastFetchedPropertyId.current = null;
      return;
    }

    // Skip if already fetching or already have data for this property
    if (fetchingRef.current || lastFetchedPropertyId.current === propertyId) {
      return;
    }

    const fetchData = async () => {
      fetchingRef.current = true;
      
      try {
        // Get ownership data (use getOwnership inside effect, not as dependency)
        const ownershipData = wallet ? getOwnership(propertyId) : null;
        const propertyState = await fetchPropertyState(propertyId);

        // Only log once per property fetch
        if (lastFetchedPropertyId.current !== propertyId) {
        }
    
        const availableSlots = propertyState?.available_slots ?? property.maxSlots ?? 0;

        const owned = ownershipData?.slotsOwned || 0;
        const maxSlotsPerProperty = property.maxPerPlayer || 10;
        const shielded = ownershipData?.slotsShielded || 0;
        const shieldExpiry = ownershipData?.shieldExpiry?.toNumber?.() || 0;
        const isShieldActive = shielded > 0 && shieldExpiry > Math.floor(Date.now() / 1000);

        const newPropertyData = {
          owned,
          maxSlotsPerProperty,
          availableSlots,
          shielded: isShieldActive ? shielded : 0,
          shieldExpiry: isShieldActive ? shieldExpiry : 0,
        };

        // Only update state if data actually changed
        setPropertyData((prevData: typeof propertyData) => {
          if (!prevData || 
              prevData.owned !== newPropertyData.owned ||
              prevData.availableSlots !== newPropertyData.availableSlots ||
              prevData.shielded !== newPropertyData.shielded) {
            return newPropertyData;
          }
          return prevData;
        });

        lastFetchedPropertyId.current = propertyId;

      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [propertyId, connected, wallet?.publicKey?.toString(), property]);

  // Separate effect for set bonus calculation (only when ownership data might have changed)
  useEffect(() => {
    if (!property || !propertyData) {
      setSetBonusInfo(null);
      return;
    }

    const calculateSetBonus = () => {
      const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
      const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;
      
      let ownedInSetCount = 0;
      let minSlotsInSet = Infinity;
      let totalSlotsInSet = 0;

      for (const p of propertiesInSet) {
        const ownership = getOwnership(p.id);
        if (ownership && ownership.slotsOwned > 0) {
          ownedInSetCount++;
          // For set bonus, we need the MINIMUM slots across all properties in the set
          minSlotsInSet = Math.min(minSlotsInSet, ownership.slotsOwned);
        }
        totalSlotsInSet += p.maxSlots;
      }

      const hasCompleteSet = ownedInSetCount >= requiredProps;
      const newSetBonusInfo = {
        hasCompleteSet,
        boostedSlots: hasCompleteSet ? minSlotsInSet : 0,
        totalSlots: totalSlotsInSet,
      };

      // Only update if values actually changed
      setSetBonusInfo(prevInfo => {
        if (!prevInfo || 
            prevInfo.hasCompleteSet !== newSetBonusInfo.hasCompleteSet ||
            prevInfo.boostedSlots !== newSetBonusInfo.boostedSlots) {
          return newSetBonusInfo;
        }
        return prevInfo;
      });
    };

    calculateSetBonus();
  }, [property, propertyData?.owned]); // Only re-run when owned slots change

  // Swipe-to-close handlers - MUST be before early return to maintain hook order
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !property) return;
    const touch = e.touches[0];
    if (touch) {
      setStartY(touch.clientY);
      setIsDragging(true);
    }
  }, [isMobile, property]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !startY || !isDragging || !property) return;
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - startY;
      if (deltaY > 0) { // Only allow downward swipe
        setDragOffset(deltaY);
      }
    }
  }, [isMobile, startY, isDragging, property]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isDragging || !property) return;
    
    // Close if dragged down more than 100px
    if (dragOffset > 100) {
      onClose();
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
    setStartY(null);
  }, [isMobile, isDragging, dragOffset, onClose, property]);
  
  // Handle tab scroll sync
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isDragging || !property) return;
    
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const tabWidth = container.clientWidth;
    const newActiveTab = Math.round(scrollLeft / tabWidth);
    
    if (newActiveTab !== activeTab && newActiveTab >= 0 && newActiveTab <= 3) {
      setActiveTab(newActiveTab);
    }
  }, [activeTab, isDragging, property]);
  
  // Scroll to tab programmatically
  const scrollToTab = useCallback((tabIndex: number) => {
    if (!scrollRef.current || !property) return;
    
    const container = scrollRef.current;
    const tabWidth = container.clientWidth;
    container.scrollTo({
      left: tabIndex * tabWidth,
      behavior: 'smooth'
    });
    setActiveTab(tabIndex);
  }, [property]);

  // Early return AFTER all hooks to avoid hook order issues
  if (propertyId === null || !property) return null;

  const baseIncomePerSlot = Math.floor((property.price * property.yieldBps) / 10000);
  const setBonusData = SET_BONUSES[property.setId.toString() as keyof typeof SET_BONUSES];
  const setBonusBps = setBonusData?.bps || 3000;

  const totalSlots = property.maxSlots;
  const personalOwned = propertyData?.owned || 0;
  const availableSlots = propertyData?.availableSlots || 0;
  const othersOwned = totalSlots - availableSlots - personalOwned;

  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;
  
  const tabs = [
    { id: 'buy', label: 'Buy', icon: '🛒' },
    { id: 'shield', label: 'Shield', icon: '🛡️' },
    { id: 'sell', label: 'Sell', icon: '💰' },
    { id: 'steal', label: 'Steal', icon: '⚔️' }
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 lg:p-4" 
        onClick={onClose}
      >
        <div 
          className={`
            bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 
            backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 
            shadow-2xl shadow-purple-500/20 overflow-hidden transition-transform duration-200
            ${isMobile 
              ? 'w-full h-full max-h-[100dvh] flex flex-col' 
              : 'max-w-2xl w-full max-h-[90vh]'
            }
          `}
          style={isMobile ? { transform: `translateY(${dragOffset}px)` } : {}}
          onClick={e => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-3 lg:p-4 flex-shrink-0">
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center mb-2">
                <div className="w-12 h-1.5 bg-purple-400/60 rounded-full"></div>
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg lg:text-2xl font-black text-purple-100 mb-1">{property.name}</h2>
                <div className={`${property.color} h-2 lg:h-2.5 w-16 lg:w-20 rounded-full shadow-lg`}></div>
              </div>
              <button 
                onClick={onClose} 
                className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
              >
                <X size={isMobile ? 24 : 20} />
              </button>
            </div>
            
            {/* Mobile tab bar */}
            {isMobile && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => scrollToTab(index)}
                      className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                        activeTab === index 
                          ? 'bg-purple-600/30 border border-purple-400/50' 
                          : 'border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className={`text-xs font-medium ${
                        activeTab === index ? 'text-purple-200' : 'text-purple-400'
                      }`}>
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5">
                  {tabs.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        activeTab === index 
                          ? 'bg-purple-400 scale-125' 
                          : 'bg-purple-600/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content - Scrollable or Swipeable */}
          {isMobile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Action panels with horizontal scrolling */}
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory"
                style={{ scrollSnapType: 'x mandatory' }}
                onScroll={handleScroll}
              >
                {/* Buy Panel */}
                <div className="min-w-full snap-center flex flex-col p-4 space-y-3 overflow-y-auto">
                  {/* Compact Info Section */}
                  <div className="flex gap-3 mb-4">
                    {/* Property Card - Smaller */}
                    <div className="w-[100px] h-[130px] flex-shrink-0">
                      <PropertyCard 
                        propertyId={propertyId} 
                        onSelect={() => {}} 
                        modalView={true}
                        customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                      />
                    </div>
                    
                    {/* Details - Horizontal Layout */}
                    <div className="flex-1 space-y-2">
                      {/* Income - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 uppercase mb-1">💰 Daily Income</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                          {hasSetBonus && <span className="text-xs text-green-400">+{(setBonusBps / 100).toFixed(0)}%</span>}
                          <span className="text-xs text-purple-300">=</span>
                          <span className={`text-sm font-black ${hasSetBonus ? 'text-green-300' : 'text-yellow-300'}`}>
                            {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Slots - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                          <span className="text-xs font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                        </div>
                        <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex">
                          {othersOwned > 0 && (
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {personalOwned > 0 && (
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {availableSlots > 0 && (
                            <div 
                              className="h-full bg-white/15"
                              style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!connected ? (
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <p className="text-purple-200 mb-1 text-center text-sm">Connect your wallet to interact with this property</p>
                      <StyledWalletButton variant="modal" />
                    </div>
                  ) : (
                    <PropertyActionsBar
                      propertyId={propertyId}
                      property={property}
                      propertyData={propertyData}
                      balance={balance}
                      loading={loading}
                      setLoading={setLoading}
                      onClose={onClose}
                      onOpenHelp={setShowHelpModal}
                      isMobile={true}
                      forceActiveAction="buy"
                    />
                  )}
                </div>

                {/* Shield Panel */}
                <div className="min-w-full snap-center flex flex-col p-4 space-y-3 overflow-y-auto">
                  {/* Compact Info Section */}
                  <div className="flex gap-3 mb-4">
                    {/* Property Card - Smaller */}
                    <div className="w-[100px] h-[130px] flex-shrink-0">
                      <PropertyCard 
                        propertyId={propertyId} 
                        onSelect={() => {}} 
                        modalView={true}
                        customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                      />
                    </div>
                    
                    {/* Details - Horizontal Layout */}
                    <div className="flex-1 space-y-2">
                      {/* Income - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 uppercase mb-1">💰 Daily Income</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                          {hasSetBonus && <span className="text-xs text-green-400">+{(setBonusBps / 100).toFixed(0)}%</span>}
                          <span className="text-xs text-purple-300">=</span>
                          <span className={`text-sm font-black ${hasSetBonus ? 'text-green-300' : 'text-yellow-300'}`}>
                            {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Slots - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                          <span className="text-xs font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                        </div>
                        <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex">
                          {othersOwned > 0 && (
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {personalOwned > 0 && (
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {availableSlots > 0 && (
                            <div 
                              className="h-full bg-white/15"
                              style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!connected ? (
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <p className="text-purple-200 mb-1 text-center text-sm">Connect your wallet to interact with this property</p>
                      <StyledWalletButton variant="modal" />
                    </div>
                  ) : (
                    <PropertyActionsBar
                      propertyId={propertyId}
                      property={property}
                      propertyData={propertyData}
                      balance={balance}
                      loading={loading}
                      setLoading={setLoading}
                      onClose={onClose}
                      onOpenHelp={setShowHelpModal}
                      isMobile={true}
                      forceActiveAction="shield"
                    />
                  )}
                </div>

                {/* Sell Panel */}
                <div className="min-w-full snap-center flex flex-col p-4 space-y-3 overflow-y-auto">
                  {/* Compact Info Section */}
                  <div className="flex gap-3 mb-4">
                    {/* Property Card - Smaller */}
                    <div className="w-[100px] h-[130px] flex-shrink-0">
                      <PropertyCard 
                        propertyId={propertyId} 
                        onSelect={() => {}} 
                        modalView={true}
                        customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                      />
                    </div>
                    
                    {/* Details - Horizontal Layout */}
                    <div className="flex-1 space-y-2">
                      {/* Income - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 uppercase mb-1">💰 Daily Income</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                          {hasSetBonus && <span className="text-xs text-green-400">+{(setBonusBps / 100).toFixed(0)}%</span>}
                          <span className="text-xs text-purple-300">=</span>
                          <span className={`text-sm font-black ${hasSetBonus ? 'text-green-300' : 'text-yellow-300'}`}>
                            {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Slots - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                          <span className="text-xs font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                        </div>
                        <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex">
                          {othersOwned > 0 && (
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {personalOwned > 0 && (
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {availableSlots > 0 && (
                            <div 
                              className="h-full bg-white/15"
                              style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!connected ? (
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <p className="text-purple-200 mb-1 text-center text-sm">Connect your wallet to interact with this property</p>
                      <StyledWalletButton variant="modal" />
                    </div>
                  ) : (
                    <PropertyActionsBar
                      propertyId={propertyId}
                      property={property}
                      propertyData={propertyData}
                      balance={balance}
                      loading={loading}
                      setLoading={setLoading}
                      onClose={onClose}
                      onOpenHelp={setShowHelpModal}
                      isMobile={true}
                      forceActiveAction="sell"
                    />
                  )}
                </div>

                {/* Steal Panel */}
                <div className="min-w-full snap-center flex flex-col p-4 space-y-3 overflow-y-auto">
                  {/* Compact Info Section */}
                  <div className="flex gap-3 mb-4">
                    {/* Property Card - Smaller */}
                    <div className="w-[100px] h-[130px] flex-shrink-0">
                      <PropertyCard 
                        propertyId={propertyId} 
                        onSelect={() => {}} 
                        modalView={true}
                        customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                      />
                    </div>
                    
                    {/* Details - Horizontal Layout */}
                    <div className="flex-1 space-y-2">
                      {/* Income - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="text-[10px] text-purple-400 uppercase mb-1">💰 Daily Income</div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                          {hasSetBonus && <span className="text-xs text-green-400">+{(setBonusBps / 100).toFixed(0)}%</span>}
                          <span className="text-xs text-purple-300">=</span>
                          <span className={`text-sm font-black ${hasSetBonus ? 'text-green-300' : 'text-yellow-300'}`}>
                            {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Slots - Compact */}
                      <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                          <span className="text-xs font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                        </div>
                        <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex">
                          {othersOwned > 0 && (
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {personalOwned > 0 && (
                            <div 
                              className="h-full bg-purple-500"
                              style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                            />
                          )}
                          {availableSlots > 0 && (
                            <div 
                              className="h-full bg-white/15"
                              style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!connected ? (
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <p className="text-purple-200 mb-1 text-center text-sm">Connect your wallet to interact with this property</p>
                      <StyledWalletButton variant="modal" />
                    </div>
                  ) : (
                    <PropertyActionsBar
                      propertyId={propertyId}
                      property={property}
                      propertyData={propertyData}
                      balance={balance}
                      loading={loading}
                      setLoading={setLoading}
                      onClose={onClose}
                      onOpenHelp={setShowHelpModal}
                      isMobile={true}
                      forceActiveAction="steal"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`
              p-3 lg:p-4 space-y-3 overflow-y-auto flex-1
              ${isMobile ? 'pb-safe' : ''}
            `}>
              {/* Property Card + Details */}
              <div className={`
                ${isMobile 
                  ? 'flex flex-col gap-3' 
                  : 'grid grid-cols-[210px_1fr] gap-4'
                }
              `}>
                {/* Property Card */}
                <div className={`
                  ${isMobile 
                    ? 'w-full flex justify-center' 
                    : 'w-[200px] h-[250px]'
                  }
                `}>
                  <div className={isMobile ? 'w-[140px] h-[180px]' : 'w-full h-full'}>
                    <PropertyCard 
                      propertyId={propertyId} 
                      onSelect={() => {}} 
                      modalView={true}
                      customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2">
                  {/* Income Section */}
                  <div className="bg-purple-950/40 rounded-lg p-2 lg:p-3 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] lg:text-xs text-purple-400 uppercase">💰 Daily Income</span>
                    </div>
                    
                    {/* Always show full calculation */}
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 mt-1 w-full">
                      <div className="flex flex-col">
                        <span className="text-[8px] lg:text-[10px] text-purple-400 uppercase">Base</span>
                        <span className="text-base lg:text-xl font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                      </div>
                      <span className="text-purple-400 text-lg px-1">+</span>
                      <div className="flex flex-col">
                        <span className={`text-[8px] lg:text-[10px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                          Boost <span className={hasSetBonus ? 'text-green-300' : 'text-gray-500'}>+{(setBonusBps / 100).toFixed(2)}%</span>
                        </span>
                        <span className={`text-base lg:text-xl font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                          {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-purple-400 text-lg px-1">=</span>
                      <div className={`flex flex-col rounded px-3 py-1 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                        <span className="text-[8px] lg:text-[10px] text-purple-300 uppercase">Total</span>
                        <span className={`text-base lg:text-xl font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                          {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {hasSetBonus && (
                      <div className="mt-2 px-2 py-1 bg-green-500/20 rounded border border-green-500/30 flex items-center justify-between">
                        <span className="text-[9px] lg:text-xs text-green-300 font-semibold flex items-center gap-1">
                          <StarIcon size={10} className="text-green-400" />
                          Complete Set Bonus Active
                        </span>
                        <span className="text-[9px] lg:text-xs text-green-400">+{(setBonusBps / 100).toFixed(2)}% on {setBonusInfo?.boostedSlots || 0} slots</span>
                      </div>
                    )}
                    {!hasSetBonus && (
                      <div className="mt-2 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/30">
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <span className="text-[10px] lg:text-xs flex items-center gap-1">
                            <StarIcon size={8} className="text-green-400" />
                            Complete this set for +{(setBonusBps / 100).toFixed(2)}% bonus
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slots Section */}
                  <div className="bg-purple-950/40 rounded-lg p-2 lg:p-3 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] lg:text-xs text-purple-400 uppercase">📊 Slots</span>
                      <span className="text-xs lg:text-sm font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                    </div>
                    
                    {/* Stacked Bar */}
                    <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden flex">
                      {othersOwned > 0 && (
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                        />
                      )}
                      {personalOwned > 0 && (
                        <div 
                          className="h-full bg-purple-500"
                          style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                        />
                      )}
                      {availableSlots > 0 && (
                        <div 
                          className="h-full bg-white/15"
                          style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                        />
                      )}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex gap-2 lg:gap-3 text-[9px] lg:text-[10px] mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                        <span className="text-purple-300">Others: {othersOwned}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-sm"></div>
                        <span className="text-purple-300">You: {personalOwned}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                        <span className="text-purple-300">Available: {availableSlots}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!connected ? (
                <div className="flex flex-col items-center py-4 lg:py-6 space-y-3">
                  <p className="text-purple-200 mb-1 text-center text-xs lg:text-sm">Connect your wallet to interact with this property</p>
                  <StyledWalletButton variant="modal" />
                </div>
              ) : (
                <PropertyActionsBar
                  propertyId={propertyId}
                  property={property}
                  propertyData={propertyData}
                  balance={balance}
                  loading={loading}
                  setLoading={setLoading}
                  onClose={onClose}
                  onOpenHelp={setShowHelpModal}
                  isMobile={false}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help Modals */}
      {showHelpModal === 'buy' && (
        <BuyPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'sell' && (
        <SellPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'shield' && (
        <ShieldPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'steal' && (
        <StealPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
    </>
  );
}