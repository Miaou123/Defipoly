'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PROPERTIES, SET_BONUSES } from '@/utils/constants';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '@/contexts/GameStateContext';
import { fetchPropertyState } from '@/services/api';
import { PropertyCard } from '../PropertyCard';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons/UIIcons';
import {
  BuyPropertySection,
  ShieldPropertySection,
  SellPropertySection,
  StealPropertySection
} from '../property-modal/actions';
import { MobileHelpModal } from './MobileHelpModal';
import { HelpCircle } from 'lucide-react';

interface MobilePropertyPanelProps {
  selectedProperty: number | null;
  onSelectProperty: (propertyId: number) => void;
}

type SectionType = 'buy' | 'shield' | 'sell' | 'steal';

export function MobilePropertyPanel({ selectedProperty, onSelectProperty }: MobilePropertyPanelProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('buy');
  const [currentPropertyId, setCurrentPropertyId] = useState(selectedProperty || 1); // Default to Mediterranean Avenue (ID: 1)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState<'buy' | 'shield' | 'sell' | 'steal' | null>(null);
  
  // Header swipe state
  const [headerSwipeStart, setHeaderSwipeStart] = useState<{ x: number; time: number } | null>(null);
  const [isHeaderSwiping, setIsHeaderSwiping] = useState(false);
  
  // Update current property when selectedProperty changes
  useEffect(() => {
    if (selectedProperty !== null) {
      setCurrentPropertyId(selectedProperty);
    }
  }, [selectedProperty]);
  
  // Memoize property to prevent unnecessary re-renders
  const property = useMemo(() => 
    PROPERTIES.find(p => p.id === currentPropertyId),
    [currentPropertyId]
  );
  
  const { connected } = useWallet();
  const { program, tokenBalance: balance } = useDefipoly();
  const wallet = useAnchorWallet();
  const gameState = useGameState();
  const { getOwnership } = gameState;
  
  // Property state
  const fetchingRef = useRef(false);
  const lastFetchedPropertyId = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [setBonusInfo, setSetBonusInfo] = useState<{
    hasCompleteSet: boolean;
    boostedSlots: number;
    totalSlots: number;
  } | null>(null);

  // Fetch property state from API (same logic as PropertyModal)
  useEffect(() => {
    if (!connected || !property) {
      setPropertyData(null);
      setSetBonusInfo(null);
      lastFetchedPropertyId.current = null;
      return;
    }

    // Skip if already fetching or already have data for this property
    if (fetchingRef.current || lastFetchedPropertyId.current === currentPropertyId) {
      return;
    }

    const fetchData = async () => {
      fetchingRef.current = true;
      
      try {
        // Get ownership data
        const ownershipData = wallet ? getOwnership(currentPropertyId) : null;
        const propertyState = await fetchPropertyState(currentPropertyId);
    
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

        lastFetchedPropertyId.current = currentPropertyId;

      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [currentPropertyId, connected, wallet?.publicKey?.toString(), property]);

  // Set bonus calculation
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
  }, [property, propertyData?.owned]);

  const sections: { id: SectionType; label: string }[] = [
    { id: 'buy', label: 'Buy' },
    { id: 'shield', label: 'Shield' },
    { id: 'sell', label: 'Sell' },
    { id: 'steal', label: 'Steal' },
  ];

  // Scroll to section when tab clicked
  const scrollToSection = (index: number) => {
    const section = sections[index];
    if (scrollContainerRef.current && section) {
      const panelWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({ left: panelWidth * index, behavior: 'smooth' });
      setActiveSection(section.id);
    }
  };

  // Update active tab on scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const panelWidth = scrollContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / panelWidth);
      const section = sections[newIndex];
      if (section) {
        setActiveSection(section.id);
      }
    }
  }, [sections]);

  // Property navigation
  const navigateToProperty = (direction: 'prev' | 'next') => {
    const currentIndex = PROPERTIES.findIndex(p => p.id === currentPropertyId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? PROPERTIES.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === PROPERTIES.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newProperty = PROPERTIES[newIndex];
    if (newProperty) {
      setCurrentPropertyId(newProperty.id);
      onSelectProperty(newProperty.id);
    }
  };

  // Header swipe handlers
  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setHeaderSwipeStart({ x: touch.clientX, time: Date.now() });
      setIsHeaderSwiping(true);
    }
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!headerSwipeStart || !isHeaderSwiping) return;
    // CSS touchAction: 'pan-y' handles preventing horizontal scroll instead of preventDefault
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (!headerSwipeStart || !isHeaderSwiping) return;
    
    const touch = e.changedTouches[0];
    if (touch) {
      const deltaX = touch.clientX - headerSwipeStart.x;
      const deltaTime = Date.now() - headerSwipeStart.time;
      
      // Only trigger if it's a quick swipe (< 300ms) with enough distance (> 50px)
      if (deltaTime < 300 && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - go to previous property
          navigateToProperty('prev');
        } else {
          // Swipe left - go to next property
          navigateToProperty('next');
        }
      }
    }
    
    setHeaderSwipeStart(null);
    setIsHeaderSwiping(false);
  };

  if (!property) return null;

  const baseIncomePerSlot = Math.floor((property.price * property.yieldBps) / 10000);
  const setBonusData = SET_BONUSES[property.setId.toString() as keyof typeof SET_BONUSES];
  const setBonusBps = setBonusData?.bps || 3000;

  const totalSlots = property.maxSlots;
  const personalOwned = propertyData?.owned || 0;
  const availableSlots = propertyData?.availableSlots || 0;
  const othersOwned = totalSlots - availableSlots - personalOwned;

  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;

  return (
    <div className="h-full flex flex-col">
      {/* Swipeable Property Header */}
      <div className="border-b border-purple-500/20 flex-shrink-0">
        {/* Main property name - swipeable area */}
        <div 
          className="flex items-center justify-between p-3 relative bg-gradient-to-r from-purple-900/30 to-purple-800/20 cursor-pointer touch-feedback"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
        >
          {/* Left chevron indicator */}
          <div className="text-purple-400/60">
            <ChevronLeftIcon size={16} />
          </div>
          
          {/* Center: Property info */}
          <div className="flex-1 flex flex-col items-center">
            <div className={`w-12 h-1.5 rounded-full ${property.color} mb-1`}></div>
            <h3 className="text-sm font-bold text-white text-center">{property.name}</h3>
          </div>
          
          {/* Right chevron indicator */}
          <div className="text-purple-400/60">
            <ChevronRightIcon size={16} />
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-purple-500/20 flex-shrink-0">
        {sections.map((section, index) => (
          <div key={section.id} className="flex-1 relative">
            <button
              onClick={() => scrollToSection(index)}
              className={`w-full py-2 text-[10px] font-semibold capitalize transition-all ${
                activeSection === section.id 
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-600/20' 
                  : 'text-purple-500 border-b-2 border-transparent'
              }`}
            >
              {section.label}
            </button>
            {/* Help button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHelp(section.id);
              }}
              className="absolute top-1 right-1 text-purple-400/60 hover:text-purple-300 transition-colors"
            >
              <HelpCircle size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Swipeable content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
        onScroll={handleScroll}
      >
        {/* Buy panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col h-full">
          {/* Property Info Section */}
          <div className="flex gap-3 mb-3">
            {/* Property card - increased size */}
            <div className="flex-shrink-0">
              <div className="w-[130px] h-[165px]">
                <PropertyCard 
                  propertyId={currentPropertyId} 
                  onSelect={() => {}} 
                  modalView={true}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                  disableHover={true}
                />
              </div>
            </div>

            {/* Details column - more compact */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Daily income breakdown - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">💰 Income</span>
                </div>
                
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0.5 w-full">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-purple-400 uppercase">Base</span>
                    <span className="text-xs font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">+</span>
                  <div className="flex flex-col">
                    <span className={`text-[8px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">=</span>
                  <div className={`flex flex-col rounded px-1 py-0.5 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                    <span className="text-[8px] text-purple-300 uppercase">Total</span>
                    <span className={`text-xs font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                      {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 rounded border border-green-500/30">
                    <span className="text-[8px] text-green-300 font-semibold flex items-center gap-0.5">
                      <StarIcon size={6} className="text-green-400" />
                      Set Bonus +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {!hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                    <span className="text-[8px] text-amber-300 flex items-center gap-0.5">
                      <StarIcon size={5} className="text-green-400" />
                      Complete set for +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Slots section - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                  <span className="text-xs font-bold text-purple-100">{personalOwned}/{totalSlots}</span>
                </div>
                
                {/* Stacked Bar */}
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex mb-1">
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
                
                {/* Legend - compact */}
                <div className="flex gap-1.5 text-[8px]">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-green-500 rounded-sm"></div>
                    <span className="text-purple-300">Others: {othersOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-purple-500 rounded-sm"></div>
                    <span className="text-purple-300">You: {personalOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-white/30 rounded-sm"></div>
                    <span className="text-purple-300">Free: {availableSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0" style={{ fontSize: 'clamp(0.6rem, 2.5vh, 0.875rem)' }}>
              <BuyPropertySection
                propertyId={currentPropertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={() => {}}
                isMobile={true}
              />
            </div>
          </div>
        </div>
        
        {/* Shield panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col h-full">
          {/* Property Info Section */}
          <div className="flex gap-3 mb-3">
            {/* Property card - increased size */}
            <div className="flex-shrink-0">
              <div className="w-[130px] h-[165px]">
                <PropertyCard 
                  propertyId={currentPropertyId} 
                  onSelect={() => {}} 
                  modalView={true}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                  disableHover={true}
                />
              </div>
            </div>

            {/* Details column - more compact */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Daily income breakdown - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">💰 Income</span>
                </div>
                
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0.5 w-full">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-purple-400 uppercase">Base</span>
                    <span className="text-xs font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">+</span>
                  <div className="flex flex-col">
                    <span className={`text-[8px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">=</span>
                  <div className={`flex flex-col rounded px-1 py-0.5 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                    <span className="text-[8px] text-purple-300 uppercase">Total</span>
                    <span className={`text-xs font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                      {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 rounded border border-green-500/30">
                    <span className="text-[8px] text-green-300 font-semibold flex items-center gap-0.5">
                      <StarIcon size={6} className="text-green-400" />
                      Set Bonus +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {!hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                    <span className="text-[8px] text-amber-300 flex items-center gap-0.5">
                      <StarIcon size={5} className="text-green-400" />
                      Complete set for +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Slots section - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                  <span className="text-xs font-bold text-purple-100">{personalOwned}/{totalSlots}</span>
                </div>
                
                {/* Stacked Bar */}
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex mb-1">
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
                
                {/* Legend - compact */}
                <div className="flex gap-1.5 text-[8px]">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-green-500 rounded-sm"></div>
                    <span className="text-purple-300">Others: {othersOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-purple-500 rounded-sm"></div>
                    <span className="text-purple-300">You: {personalOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-white/30 rounded-sm"></div>
                    <span className="text-purple-300">Free: {availableSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0" style={{ fontSize: 'clamp(0.6rem, 2.5vh, 0.875rem)' }}>
              <ShieldPropertySection
                propertyId={currentPropertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={() => {}}
                isMobile={true}
              />
            </div>
          </div>
        </div>
        
        {/* Sell panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col h-full">
          {/* Property Info Section */}
          <div className="flex gap-3 mb-3">
            {/* Property card - increased size */}
            <div className="flex-shrink-0">
              <div className="w-[130px] h-[165px]">
                <PropertyCard 
                  propertyId={currentPropertyId} 
                  onSelect={() => {}} 
                  modalView={true}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                  disableHover={true}
                />
              </div>
            </div>

            {/* Details column - more compact */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Daily income breakdown - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">💰 Income</span>
                </div>
                
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0.5 w-full">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-purple-400 uppercase">Base</span>
                    <span className="text-xs font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">+</span>
                  <div className="flex flex-col">
                    <span className={`text-[8px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">=</span>
                  <div className={`flex flex-col rounded px-1 py-0.5 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                    <span className="text-[8px] text-purple-300 uppercase">Total</span>
                    <span className={`text-xs font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                      {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 rounded border border-green-500/30">
                    <span className="text-[8px] text-green-300 font-semibold flex items-center gap-0.5">
                      <StarIcon size={6} className="text-green-400" />
                      Set Bonus +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {!hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                    <span className="text-[8px] text-amber-300 flex items-center gap-0.5">
                      <StarIcon size={5} className="text-green-400" />
                      Complete set for +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Slots section - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                  <span className="text-xs font-bold text-purple-100">{personalOwned}/{totalSlots}</span>
                </div>
                
                {/* Stacked Bar */}
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex mb-1">
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
                
                {/* Legend - compact */}
                <div className="flex gap-1.5 text-[8px]">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-green-500 rounded-sm"></div>
                    <span className="text-purple-300">Others: {othersOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-purple-500 rounded-sm"></div>
                    <span className="text-purple-300">You: {personalOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-white/30 rounded-sm"></div>
                    <span className="text-purple-300">Free: {availableSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0" style={{ fontSize: 'clamp(0.6rem, 2.5vh, 0.875rem)' }}>
              <SellPropertySection
                propertyId={currentPropertyId}
                property={property}
                propertyData={propertyData}
                loading={loading}
                setLoading={setLoading}
                onClose={() => {}}
                isMobile={true}
              />
            </div>
          </div>
        </div>
        
        {/* Steal panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col h-full">
          {/* Property Info Section */}
          <div className="flex gap-3 mb-3">
            {/* Property card - increased size */}
            <div className="flex-shrink-0">
              <div className="w-[130px] h-[165px]">
                <PropertyCard 
                  propertyId={currentPropertyId} 
                  onSelect={() => {}} 
                  modalView={true}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                  disableHover={true}
                />
              </div>
            </div>

            {/* Details column - more compact */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Daily income breakdown - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">💰 Income</span>
                </div>
                
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0.5 w-full">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-purple-400 uppercase">Base</span>
                    <span className="text-xs font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">+</span>
                  <div className="flex flex-col">
                    <span className={`text-[8px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                      {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-purple-400 text-xs px-0.5">=</span>
                  <div className={`flex flex-col rounded px-1 py-0.5 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                    <span className="text-[8px] text-purple-300 uppercase">Total</span>
                    <span className={`text-xs font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                      {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-green-500/20 rounded border border-green-500/30">
                    <span className="text-[8px] text-green-300 font-semibold flex items-center gap-0.5">
                      <StarIcon size={6} className="text-green-400" />
                      Set Bonus +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {!hasSetBonus && (
                  <div className="mt-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                    <span className="text-[8px] text-amber-300 flex items-center gap-0.5">
                      <StarIcon size={5} className="text-green-400" />
                      Complete set for +{(setBonusBps / 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Slots section - compact */}
              <div className="bg-purple-950/40 rounded-lg p-1.5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-purple-400 uppercase">📊 Slots</span>
                  <span className="text-xs font-bold text-purple-100">{personalOwned}/{totalSlots}</span>
                </div>
                
                {/* Stacked Bar */}
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden flex mb-1">
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
                
                {/* Legend - compact */}
                <div className="flex gap-1.5 text-[8px]">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-green-500 rounded-sm"></div>
                    <span className="text-purple-300">Others: {othersOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-purple-500 rounded-sm"></div>
                    <span className="text-purple-300">You: {personalOwned}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-white/30 rounded-sm"></div>
                    <span className="text-purple-300">Free: {availableSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0" style={{ fontSize: 'clamp(0.6rem, 2.5vh, 0.875rem)' }}>
              <StealPropertySection
                propertyId={currentPropertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={() => {}}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Modal */}
      {showHelp && (
        <MobileHelpModal 
          isOpen={showHelp !== null} 
          onClose={() => setShowHelp(null)} 
          type={showHelp} 
        />
      )}
    </div>
  );
}