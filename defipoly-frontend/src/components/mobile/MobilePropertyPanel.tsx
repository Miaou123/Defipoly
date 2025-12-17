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

interface MobilePropertyPanelProps {
  selectedProperty: number | null;
  onSelectProperty: (propertyId: number) => void;
}

type SectionType = 'info' | 'buy' | 'shield' | 'sell' | 'steal';

export function MobilePropertyPanel({ selectedProperty, onSelectProperty }: MobilePropertyPanelProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('info');
  const [currentPropertyId, setCurrentPropertyId] = useState(selectedProperty || 1); // Default to Mediterranean Avenue (ID: 1)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
    { id: 'info', label: 'Info' },
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
    // Prevent default to avoid interfering with other swipes
    e.preventDefault();
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
          <button
            key={section.id}
            onClick={() => scrollToSection(index)}
            className={`flex-1 py-2 text-[10px] font-semibold capitalize transition-all ${
              activeSection === section.id 
                ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-600/20' 
                : 'text-purple-500 border-b-2 border-transparent'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
      
      {/* Swipeable content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
        onScroll={handleScroll}
      >
        {/* Info panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 overflow-y-auto">
          {/* Property card and details side by side */}
          <div className="flex gap-3 mb-3">
            {/* Property card */}
            <div className="flex-shrink-0">
              <div className="w-[100px] h-[125px]">
                <PropertyCard 
                  propertyId={currentPropertyId} 
                  onSelect={() => {}} 
                  modalView={true}
                  customPropertyCardBackground={gameState.profile.customPropertyCardBackground}
                />
              </div>
            </div>

            {/* Details column */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Daily income breakdown */}
              <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400 uppercase">💰 Daily Income</span>
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 w-full">
              <div className="flex flex-col">
                <span className="text-[9px] text-purple-400 uppercase">Base</span>
                <span className="text-sm font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
              </div>
              <span className="text-purple-400 text-sm px-1">+</span>
              <div className="flex flex-col">
                <span className={`text-[9px] uppercase ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                  Boost <span className={hasSetBonus ? 'text-green-300' : 'text-gray-500'}>+{(setBonusBps / 100).toFixed(2)}%</span>
                </span>
                <span className={`text-sm font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-500'}`}>
                  {Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}
                </span>
              </div>
              <span className="text-purple-400 text-sm px-1">=</span>
              <div className={`flex flex-col rounded px-2 py-1 items-end ${hasSetBonus ? 'bg-purple-800/40' : 'bg-gray-800/20'}`}>
                <span className="text-[9px] text-purple-300 uppercase">Total</span>
                <span className={`text-sm font-black ${hasSetBonus ? 'text-green-300' : 'text-gray-400'}`}>
                  {hasSetBonus ? Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString() : baseIncomePerSlot.toLocaleString()}
                </span>
              </div>
            </div>
            
            {hasSetBonus && (
              <div className="mt-2 px-2 py-1 bg-green-500/20 rounded border border-green-500/30">
                <span className="text-[10px] text-green-300 font-semibold flex items-center gap-1">
                  <StarIcon size={8} className="text-green-400" />
                  Complete Set Bonus Active +{(setBonusBps / 100).toFixed(2)}% on {setBonusInfo?.boostedSlots || 0} slots
                </span>
              </div>
            )}
            {!hasSetBonus && (
              <div className="mt-2 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/30">
                <span className="text-[10px] text-amber-300 flex items-center gap-1">
                  <StarIcon size={6} className="text-green-400" />
                  Complete this set for +{(setBonusBps / 100).toFixed(2)}% bonus
                </span>
              </div>
            )}
              </div>

              {/* Slots section */}
              <div className="bg-purple-950/40 rounded-lg p-2 border border-purple-500/20 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400 uppercase">📊 Slots</span>
              <span className="text-sm font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
            </div>
            
            {/* Stacked Bar */}
            <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden flex mb-2">
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
            <div className="flex gap-2 text-[9px]">
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
        </div>
        
        {/* Buy panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col overflow-y-auto">
          <BuyPropertySection
            propertyId={currentPropertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={() => {}}
          />
        </div>
        
        {/* Shield panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col overflow-y-auto">
          <ShieldPropertySection
            propertyId={currentPropertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={() => {}}
          />
        </div>
        
        {/* Sell panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col overflow-y-auto">
          <SellPropertySection
            propertyId={currentPropertyId}
            property={property}
            propertyData={propertyData}
            loading={loading}
            setLoading={setLoading}
            onClose={() => {}}
          />
        </div>
        
        {/* Steal panel */}
        <div className="flex-shrink-0 w-full snap-start p-3 flex flex-col overflow-y-auto">
          <StealPropertySection
            propertyId={currentPropertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}