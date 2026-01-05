'use client';

import React, { useState, useEffect } from 'react';
import { 
  XCircleIcon, 
  SearchIcon, 
  BookIcon,
  RocketIcon,
  GameControllerIcon,
  BuildingIcon,
  CoinsIcon,
  TrophyIcon,
  ShieldIcon,
  SwordIcon,
  ChartUpIcon,
  LightbulbIcon,
  StarIcon,
  ClockIcon,
  WarningIcon,
  MoneyIcon,
  TimerIcon,
  BriefcaseIcon,
  DiceIcon,
  CrossIcon,
  CheckIcon,
  InfoIcon
} from './icons/UIIcons';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  children?: { id: string; title: string }[];
}

const tableOfContents: TableOfContentsItem[] = [
  {
    id: 'quick-start',
    title: 'Quick Start',
    icon: <RocketIcon size={16} />,
  },
  {
    id: 'basics',
    title: 'The Basics',
    icon: <GameControllerIcon size={16} />,
  },
  {
    id: 'properties',
    title: 'Properties',
    icon: <BuildingIcon size={16} />,
  },
  {
    id: 'earning',
    title: 'Earning Rewards',
    icon: <CoinsIcon size={16} />,
  },
  {
    id: 'sets',
    title: 'Set Completion Bonus',
    icon: <TrophyIcon size={16} />,
  },
  {
    id: 'shields',
    title: 'Shields',
    icon: <ShieldIcon size={16} />,
  },
  {
    id: 'stealing',
    title: 'Stealing',
    icon: <SwordIcon size={16} />,
  },
  {
    id: 'cooldowns',
    title: 'Cooldowns',
    icon: <ClockIcon size={16} />,
  },
  {
    id: 'selling',
    title: 'Selling',
    icon: <MoneyIcon size={16} />,
  },
  {
    id: 'economics',
    title: 'Token Economics',
    icon: <ChartUpIcon size={16} />,
  },
  {
    id: 'strategy',
    title: 'Strategy Guide',
    icon: <LightbulbIcon size={16} />,
  },
  {
    id: 'roi',
    title: 'ROI Reference',
    icon: <BriefcaseIcon size={16} />,
  },
  {
    id: 'reference',
    title: 'Quick Reference',
    icon: <InfoIcon size={16} />,
  },
];

export default function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('quick-start');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // Small delay to ensure state updates first
    setTimeout(() => {
      // Check if we're on mobile (md:hidden is active)
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // For mobile, look for the mobile-prefixed ID
        const element = document.getElementById(`mobile-${sectionId}`);
        console.log('Mobile scroll attempt:', { sectionId, element, found: !!element });
        
        if (element) {
          // Find the mobile content container - use a more specific selector
          const mobileDrawer = document.querySelector('.md\\:hidden.flex.flex-col');
          const scrollContainer = mobileDrawer?.querySelector('.overflow-y-auto');
          console.log('Scroll container found:', !!scrollContainer);
          
          if (scrollContainer) {
            // Get the element's position relative to the container
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const scrollTop = scrollContainer.scrollTop;
            const relativeTop = elementRect.top - containerRect.top + scrollTop;
            
            console.log('Scrolling to:', relativeTop);
            scrollContainer.scrollTo({
              top: relativeTop - 20,
              behavior: 'smooth'
            });
          }
        }
      } else {
        // Desktop - use the original ID
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  // Filter sections based on search query
  const filteredSections = tableOfContents.filter(section => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return section.title.toLowerCase().includes(query);
  });

  // Function to check if content should be visible based on search
  const shouldShowSection = (sectionId: string) => {
    if (!searchQuery.trim()) return true;
    return filteredSections.some(section => section.id === sectionId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Desktop Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-1/2 z-[60]
        bg-black/95 backdrop-blur-xl border-l border-purple-500/30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        hidden md:flex md:flex-col
      `}>
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookIcon className="text-purple-400" size={24} />
              <h2 className="text-xl font-orbitron font-bold text-white">How to Play</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close help"
            >
              <XCircleIcon size={24} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg
                       text-white placeholder-gray-400
                       focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60
                       transition-colors duration-200"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Table of Contents - Desktop Only */}
          <div className="w-48 flex-shrink-0 border-r border-purple-500/30 overflow-y-auto">
            <div className="p-4 space-y-1">
              {filteredSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left
                            transition-colors duration-200
                            ${activeSection === item.id 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
              {searchQuery.trim() && filteredSections.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-4">
                  No sections found
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Show message if search returns no results */}
            {searchQuery.trim() && filteredSections.length === 0 && (
              <div className="text-center py-12">
                <SearchIcon className="mx-auto text-gray-500 mb-4" size={48} />
                <h3 className="text-gray-400 text-lg mb-2">No results found</h3>
                <p className="text-gray-500 text-sm">Try searching for terms like "shields", "stealing", "properties", or "strategy"</p>
              </div>
            )}
            
            {/* QUICK START */}
            {shouldShowSection('quick-start') && (
              <section id="quick-start" className="space-y-4">
              <div className="flex items-center gap-2">
                <RocketIcon className="text-purple-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Quick Start</h3>
              </div>
              <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                <p className="text-purple-200 font-medium">
                  Connect wallet → Buy properties → Earn daily income → Protect with shields → Steal from others!
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong className="text-white">Connect your wallet</strong> and get some game tokens</li>
                  <li><strong className="text-white">Buy property slots</strong> to start earning passive income</li>
                  <li><strong className="text-white">Collect your rewards</strong> daily (or let them accumulate for bonuses)</li>
                  <li><strong className="text-white">Protect your properties</strong> with shields to prevent theft</li>
                  <li><strong className="text-white">Steal from others</strong> to grow your empire faster</li>
                </ol>
              </div>
            </section>
            )}

            {/* THE BASICS */}
            {shouldShowSection('basics') && (
            <section id="basics" className="space-y-4">
              <div className="flex items-center gap-2">
                <GameControllerIcon className="text-blue-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">The Basics</h3>
              </div>
              <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                <p>
                  Defipoly is a blockchain-based property investment game inspired by the classic Monopoly board game. 
                  Buy virtual properties, earn daily passive income, protect your assets, and compete with other players 
                  in a fully on-chain economy.
                </p>
                <p className="text-blue-300 font-medium">
                  Built on Solana for fast, low-cost transactions.
                </p>
              </div>
            </section>
            )}

            {/* PROPERTIES */}
            {shouldShowSection('properties') && (
            <section id="properties" className="space-y-4">
              <div className="flex items-center gap-2">
                <BuildingIcon className="text-green-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Properties</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  Defipoly features <strong className="text-white">22 properties</strong> organized into <strong className="text-white">8 color sets</strong>, 
                  just like Monopoly:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Set</th>
                        <th className="text-left py-2">Properties</th>
                        <th className="text-left py-2">Price</th>
                        <th className="text-left py-2">Daily Yield</th>
                        <th className="text-left py-2">Shield Cost</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-amber-600 font-medium">Brown</td>
                        <td className="py-2">Mediterranean Ave, Baltic Ave</td>
                        <td className="py-2">1,500</td>
                        <td className="py-2">6.0% (90/day)</td>
                        <td className="py-2">10% (9/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-sky-400 font-medium">Light Blue</td>
                        <td className="py-2">Oriental Ave, Vermont Ave, Connecticut Ave</td>
                        <td className="py-2">3,500</td>
                        <td className="py-2">6.5% (228/day)</td>
                        <td className="py-2">11% (25/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-pink-400 font-medium">Pink</td>
                        <td className="py-2">St. Charles Place, States Ave, Virginia Ave</td>
                        <td className="py-2">7,500</td>
                        <td className="py-2">7.0% (525/day)</td>
                        <td className="py-2">12% (63/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-orange-400 font-medium">Orange</td>
                        <td className="py-2">St. James Place, Tennessee Ave, New York Ave</td>
                        <td className="py-2">15,000</td>
                        <td className="py-2">7.5% (1,125/day)</td>
                        <td className="py-2">13% (146/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-red-400 font-medium">Red</td>
                        <td className="py-2">Kentucky Ave, Indiana Ave, Illinois Ave</td>
                        <td className="py-2">30,000</td>
                        <td className="py-2">8.0% (2,400/day)</td>
                        <td className="py-2">14% (336/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-yellow-400 font-medium">Yellow</td>
                        <td className="py-2">Atlantic Ave, Ventnor Ave, Marvin Gardens</td>
                        <td className="py-2">60,000</td>
                        <td className="py-2">8.5% (5,100/day)</td>
                        <td className="py-2">15% (765/day)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-2 text-emerald-400 font-medium">Green</td>
                        <td className="py-2">Pacific Ave, North Carolina Ave, Pennsylvania Ave</td>
                        <td className="py-2">120,000</td>
                        <td className="py-2">9.0% (10,800/day)</td>
                        <td className="py-2">16% (1,728/day)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-blue-600 font-medium">Dark Blue</td>
                        <td className="py-2">Park Place, Boardwalk</td>
                        <td className="py-2">240,000</td>
                        <td className="py-2">10.0% (24,000/day)</td>
                        <td className="py-2">17% (4,080/day)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-purple-300 mb-2">Slots</h4>
                    <p className="text-xs">
                      Each property has a limited number of slots available. When you buy a property, you're buying one or more slots of that property. 
                      Multiple players can own slots of the same property.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-300 mb-2">Example</h4>
                    <div className="text-xs space-y-1">
                      <p>You own 3 slots of Boardwalk (price: 240,000 tokens, yield: 10%)</p>
                      <p>Daily income per slot = 240,000 × 10% = 24,000 tokens</p>
                      <p className="text-green-400 font-medium">Your total daily income = 24,000 × 3 = 72,000 tokens/day</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* EARNING REWARDS */}
            {shouldShowSection('earning') && (
            <section id="earning" className="space-y-4">
              <div className="flex items-center gap-2">
                <CoinsIcon className="text-yellow-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Earning Rewards</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">Base Income</h4>
                  <p>
                    Your rewards accumulate automatically every second based on your total daily income from all properties. 
                    You don't need to do anything—just own properties and watch your balance grow.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Claiming Rewards</h4>
                  <p>
                    Click <strong className="text-purple-300">Claim</strong> anytime to collect your accumulated rewards. 
                    But here's the trick: <strong className="text-yellow-300">waiting pays off</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Accumulation Bonuses</h4>
                  <p className="mb-3">The longer you wait to claim, the bigger your bonus:</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Accumulated Amount</th>
                          <th className="text-left py-2">Bonus</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">10,000+ tokens</td>
                          <td className="py-1 text-green-400">+1%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">25,000+ tokens</td>
                          <td className="py-1 text-green-400">+2.5%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">50,000+ tokens</td>
                          <td className="py-1 text-green-400">+5%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">100,000+ tokens</td>
                          <td className="py-1 text-green-400">+10%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">250,000+ tokens</td>
                          <td className="py-1 text-green-400">+15%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">500,000+ tokens</td>
                          <td className="py-1 text-green-400">+20%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">1,000,000+ tokens</td>
                          <td className="py-1 text-green-400">+25%</td>
                        </tr>
                        <tr>
                          <td className="py-1">2,500,000+ tokens</td>
                          <td className="py-1 text-green-400 font-bold">+40%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-xs">
                    <strong className="text-green-300">Pro tip:</strong> If you accumulate 100,000 tokens before claiming, 
                    you'll receive 110,000 tokens (100k + 10% bonus). The bonus is calculated progressively—each portion 
                    of your rewards gets the bonus for its tier.
                  </p>
                </div>
              </div>
            </section>
            )}

            {/* SET COMPLETION BONUS */}
            {shouldShowSection('sets') && (
            <section id="sets" className="space-y-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="text-amber-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Set Completion Bonus</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  Own at least <strong className="text-white">one slot of every property in a color set</strong> to unlock a permanent income bonus!
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Set</th>
                        <th className="text-left py-2">Properties Needed</th>
                        <th className="text-left py-2">Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-amber-600 font-medium">Brown</td>
                        <td className="py-1">2</td>
                        <td className="py-1 text-green-400">+30%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+32.86%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-pink-400 font-medium">Pink</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+35.71%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-orange-400 font-medium">Orange</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+38.57%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-red-400 font-medium">Red</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+41.43%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+44.29%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-emerald-400 font-medium">Green</td>
                        <td className="py-1">3</td>
                        <td className="py-1 text-green-400">+47.14%</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                        <td className="py-1">2</td>
                        <td className="py-1 text-green-400 font-bold">+50%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs">
                    <strong className="text-amber-300">Example:</strong> You complete the Dark Blue set (Park Place + Boardwalk). 
                    Your base income from ALL properties now gets a +50% bonus when you claim.
                  </p>
                  <p className="text-xs">
                    <strong className="text-amber-300">Stack 'em up:</strong> Complete multiple sets and the bonuses add together!
                  </p>
                </div>
              </div>
            </section>
            )}

            {/* SHIELDS */}
            {shouldShowSection('shields') && (
            <section id="shields" className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldIcon className="text-cyan-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Shields</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">What Are Shields?</h4>
                  <p>
                    Shields protect your property slots from being stolen by other players. When a shield is active, 
                    those slots are completely safe.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">How Shields Work</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li><strong className="text-cyan-300">Activate a shield</strong> on any property you own</li>
                    <li><strong className="text-cyan-300">Choose duration:</strong> 1 to 48 hours</li>
                    <li><strong className="text-cyan-300">Pay the shield cost</strong> (percentage of that property's daily yield)</li>
                    <li><strong className="text-cyan-300">All your slots</strong> of that property are now protected</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Shield Costs</h4>
                  <p className="mb-3">Shield costs vary by property tier:</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Property Tier</th>
                          <th className="text-left py-2">Shield Cost (per 24h)</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-amber-600 font-medium">Brown</td>
                          <td className="py-1">10% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                          <td className="py-1">11% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-pink-400 font-medium">Pink</td>
                          <td className="py-1">12% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-orange-400 font-medium">Orange</td>
                          <td className="py-1">13% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-red-400 font-medium">Red</td>
                          <td className="py-1">14% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                          <td className="py-1">15% of daily yield</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-emerald-400 font-medium">Green</td>
                          <td className="py-1">16% of daily yield</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                          <td className="py-1">17% of daily yield</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 space-y-2">
                  <div>
                    <h5 className="text-cyan-300 font-semibold text-xs mb-1">Example:</h5>
                    <div className="text-xs space-y-1">
                      <p>Boardwalk daily yield = 24,000 tokens/slot</p>
                      <p>Shield cost for 24 hours = 24,000 × 17% = 4,080 tokens/slot</p>
                      <p>If you own 3 slots: 4,080 × 3 = <span className="text-cyan-300 font-medium">12,240 tokens total</span></p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-cyan-300 font-semibold text-xs mb-1">Shield Cooldown:</h5>
                    <p className="text-xs">
                      After your shield expires, there's a cooldown period (1/4 of the shield duration) before you can shield again. 
                      Example: 24-hour shield → 6-hour cooldown before re-shielding.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* STEALING */}
            {shouldShowSection('stealing') && (
            <section id="stealing" className="space-y-4">
              <div className="flex items-center gap-2">
                <SwordIcon className="text-red-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Stealing</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">The Risk/Reward Mechanic</h4>
                  <p>
                    Stealing adds excitement and strategy to the game. You can attempt to steal a slot from another player—but it's risky!
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">How Stealing Works</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li><strong className="text-red-300">Choose a property</strong> to target</li>
                    <li><strong className="text-red-300">Pay the steal cost</strong> (50% of the property's price)</li>
                    <li><strong className="text-red-300">Random chance:</strong> 33% success rate</li>
                    <li><strong className="text-red-300">If successful:</strong> You gain 1 slot, they lose 1 slot</li>
                    <li><strong className="text-red-300">If failed:</strong> You lose the steal cost, nothing else happens</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Steal Protection</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong className="text-cyan-300">Shielded slots</strong> cannot be stolen</li>
                    <li>After being stolen from, you get <strong className="text-green-300">6 hours of protection</strong> on that property</li>
                    <li>Attackers have a <strong className="text-purple-300">cooldown</strong> before they can steal the same property again</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Strategy Tips</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Target players with unshielded, valuable properties</li>
                    <li>The steal cost is always 50% of the property price—same for cheap and expensive properties</li>
                    <li>Higher-tier properties have better ROI on successful steals</li>
                    <li><span className="text-red-300 font-medium">Remember: 67% of steal attempts fail!</span></li>
                  </ul>
                </div>
              </div>
            </section>
            )}

            {/* COOLDOWNS */}
            {shouldShowSection('cooldowns') && (
            <section id="cooldowns" className="space-y-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="text-purple-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Cooldowns</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">Purchase Cooldown</h4>
                  <p className="mb-3">
                    After buying a property, there's a cooldown before you can buy a <strong className="text-white">different property in the same set</strong>.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Property Tier</th>
                          <th className="text-left py-2">Cooldown</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-amber-600 font-medium">Brown</td>
                          <td className="py-1">6 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                          <td className="py-1">8 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-pink-400 font-medium">Pink</td>
                          <td className="py-1">10 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-orange-400 font-medium">Orange</td>
                          <td className="py-1">12 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-red-400 font-medium">Red</td>
                          <td className="py-1">16 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                          <td className="py-1">20 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1 text-emerald-400 font-medium">Green</td>
                          <td className="py-1">24 hours</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                          <td className="py-1">28 hours</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs">
                    <strong className="text-purple-300">Important:</strong> You can always buy <strong>more of the same property</strong> immediately. 
                    The cooldown only applies to switching properties within a set.
                  </p>
                  <p className="text-xs">
                    <strong className="text-purple-300">Steal Cooldown:</strong> After attempting to steal a property (success or fail), 
                    you must wait half the property's cooldown time before stealing that same property again.
                  </p>
                </div>
              </div>
            </section>
            )}

            {/* SELLING */}
            {shouldShowSection('selling') && (
            <section id="selling" className="space-y-4">
              <div className="flex items-center gap-2">
                <MoneyIcon className="text-yellow-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Selling Properties</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">Cash Out Anytime</h4>
                  <p>You can sell your property slots back to the game at any time.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Sell Value</h4>
                  <p className="mb-3">The sell value depends on <strong className="text-white">how long you've held</strong> the property:</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Days Held</th>
                          <th className="text-left py-2">Sell Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">0 days</td>
                          <td className="py-1 text-red-400">15% of purchase price</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">7 days</td>
                          <td className="py-1 text-yellow-400">22.5% of purchase price</td>
                        </tr>
                        <tr>
                          <td className="py-1">14+ days</td>
                          <td className="py-1 text-green-400">30% of purchase price</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs mt-2 text-gray-400">The value increases linearly from 15% to 30% over 14 days.</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 space-y-2">
                  <div>
                    <h5 className="text-yellow-300 font-semibold text-xs mb-1">Example:</h5>
                    <div className="text-xs space-y-1">
                      <p>Bought Boardwalk slot for 240,000 tokens</p>
                      <p>Held for 14 days</p>
                      <p>Sell value = 240,000 × 30% = <span className="text-yellow-300 font-medium">72,000 tokens</span></p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-yellow-300 font-semibold text-xs mb-1">When to Sell:</h5>
                    <p className="text-xs">
                      Selling is generally not profitable compared to holding for yield. Consider selling only if you need liquidity urgently, 
                      want to rebalance into different properties, or are cutting losses on a frequently stolen property.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* TOKEN ECONOMICS */}
            {shouldShowSection('economics') && (
            <section id="economics" className="space-y-4">
              <div className="flex items-center gap-2">
                <ChartUpIcon className="text-blue-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Token Economics</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2">Where Do Tokens Go?</h4>
                  <p className="mb-3">When you buy properties, activate shields, or attempt steals, your tokens are distributed:</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Destination</th>
                          <th className="text-left py-2">Share</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Reward Pool</td>
                          <td className="py-1 text-green-400 font-bold">95%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Marketing</td>
                          <td className="py-1 text-blue-400">3%</td>
                        </tr>
                        <tr>
                          <td className="py-1">Development</td>
                          <td className="py-1 text-purple-400">2%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs">
                    The <strong className="text-blue-300">Reward Pool</strong> is where all player rewards come from. 
                    <span className="text-green-300 font-medium">The more players spend, the bigger the reward pool grows!</span>
                  </p>
                  <p className="text-xs">
                    Property yields are paid from the reward pool. New purchases constantly refill the pool. 
                    The system is designed to be self-sustaining.
                  </p>
                </div>
              </div>
            </section>
            )}

            {/* STRATEGY GUIDE */}
            {shouldShowSection('strategy') && (
            <section id="strategy" className="space-y-4">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="text-amber-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Strategy Guide</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <StarIcon className="text-green-400" size={16} />
                    For Beginners
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-6">
                    <li><strong className="text-white">Start with Brown properties</strong> — cheap and safe for learning</li>
                    <li><strong className="text-white">Don't steal yet</strong> — focus on understanding yields first</li>
                    <li><strong className="text-white">Shield your most valuable properties</strong> when you can afford it</li>
                    <li><strong className="text-white">Claim rewards regularly</strong> at first to build capital</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <StarIcon className="text-yellow-400" size={16} />
                    Intermediate Strategy
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-6">
                    <li><strong className="text-white">Complete your first set</strong> — the bonus is worth it</li>
                    <li><strong className="text-white">Diversify across tiers</strong> — spread risk</li>
                    <li><strong className="text-white">Time your claims</strong> — wait for accumulation bonuses</li>
                    <li><strong className="text-white">Shield strategically</strong> — protect high-yield properties</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <StarIcon className="text-purple-400" size={16} />
                    Advanced Strategy
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-6">
                    <li><strong className="text-white">Target set completion</strong> — multiple set bonuses stack</li>
                    <li><strong className="text-white">Accumulation maximize</strong> — build up to higher bonus tiers</li>
                    <li><strong className="text-white">Selective stealing</strong> — calculate expected value before attempts</li>
                    <li><strong className="text-white">Off-peak activity</strong> — steal when targets are less likely to notice</li>
                  </ol>
                </div>
              </div>
            </section>
            )}

            {/* ROI REFERENCE */}
            {shouldShowSection('roi') && (
            <section id="roi" className="space-y-4">
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="text-green-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">ROI Reference</h3>
              </div>
              <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Property</th>
                        <th className="text-left py-2">Price</th>
                        <th className="text-left py-2">Daily Yield</th>
                        <th className="text-left py-2">Days to ROI*</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-amber-600 font-medium">Brown</td>
                        <td className="py-1">1,500</td>
                        <td className="py-1">90</td>
                        <td className="py-1">16.7 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                        <td className="py-1">3,500</td>
                        <td className="py-1">227</td>
                        <td className="py-1">15.4 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-pink-400 font-medium">Pink</td>
                        <td className="py-1">7,500</td>
                        <td className="py-1">525</td>
                        <td className="py-1">14.3 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-orange-400 font-medium">Orange</td>
                        <td className="py-1">15,000</td>
                        <td className="py-1">1,125</td>
                        <td className="py-1">13.3 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-red-400 font-medium">Red</td>
                        <td className="py-1">30,000</td>
                        <td className="py-1">2,400</td>
                        <td className="py-1">12.5 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                        <td className="py-1">60,000</td>
                        <td className="py-1">5,100</td>
                        <td className="py-1">11.8 days</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-emerald-400 font-medium">Green</td>
                        <td className="py-1">120,000</td>
                        <td className="py-1">10,800</td>
                        <td className="py-1">11.1 days</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                        <td className="py-1">240,000</td>
                        <td className="py-1">24,000</td>
                        <td className="py-1 text-green-400 font-bold">10.0 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 italic">
                  *Before bonuses. With set + accumulation bonuses, ROI can be significantly faster.
                </p>
              </div>
            </section>
            )}

            {/* QUICK REFERENCE */}
            {shouldShowSection('reference') && (
            <section id="reference" className="space-y-4">
              <div className="flex items-center gap-2">
                <InfoIcon className="text-blue-400" size={20} />
                <h3 className="text-lg font-orbitron font-bold text-white">Quick Reference</h3>
              </div>
              <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white mb-3">Key Numbers</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-purple-500/30 text-purple-300">
                          <th className="text-left py-2">Mechanic</th>
                          <th className="text-left py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 space-y-1">
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Steal success rate</td>
                          <td className="py-1 text-green-400">33%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Steal cost</td>
                          <td className="py-1 text-red-400">50% of property price</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Steal protection duration</td>
                          <td className="py-1">6 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Shield duration range</td>
                          <td className="py-1">1-48 hours</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Shield cooldown</td>
                          <td className="py-1">25% of shield duration</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Minimum sell value</td>
                          <td className="py-1 text-red-400">15%</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Maximum sell value</td>
                          <td className="py-1 text-green-400">30% (at 14 days)</td>
                        </tr>
                        <tr className="border-b border-gray-700/50">
                          <td className="py-1">Set bonuses</td>
                          <td className="py-1 text-green-400">30% - 50%</td>
                        </tr>
                        <tr>
                          <td className="py-1">Max accumulation bonus</td>
                          <td className="py-1 text-green-400 font-bold">40%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Important Disclaimers</h4>
                  <ul className="text-xs space-y-1 text-gray-400">
                    <li>• <strong className="text-white">This is a game.</strong> Play responsibly and only with funds you can afford to lose.</li>
                    <li>• <strong className="text-white">Smart contract risk.</strong> While audited, all blockchain applications carry inherent risks.</li>
                    <li>• <strong className="text-white">No guaranteed returns.</strong> Yields depend on the reward pool and game activity.</li>
                    <li>• <strong className="text-white">PvP mechanics.</strong> Other players can steal your unshielded properties.</li>
                    <li>• <strong className="text-white">Token volatility.</strong> The value of game tokens may fluctuate.</li>
                  </ul>
                </div>

                <div className="text-center py-4">
                  <p className="text-purple-300 font-orbitron font-bold text-lg">Happy investing! 🎲</p>
                  <p className="text-gray-400 text-xs mt-2">
                    <strong className="text-white">Defipoly</strong> — <em>Own the Board. Earn the Rewards.</em>
                  </p>
                </div>
              </div>
            </section>
            )}
            
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`
        fixed inset-x-0 bottom-0 top-[15vh] z-[60]
        bg-black/95 backdrop-blur-xl border-t border-purple-500/30 rounded-t-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        md:hidden flex flex-col
      `}>
        {/* Mobile Header */}
        <div className="flex-shrink-0 p-4 border-b border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookIcon className="text-purple-400" size={20} />
              <h2 className="text-lg font-orbitron font-bold text-white">How to Play</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close help"
            >
              <XCircleIcon size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-9 pr-3 py-1.5 bg-black/50 border border-purple-500/30 rounded-lg
                       text-white placeholder-gray-400 text-sm
                       focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60
                       transition-colors duration-200"
            />
          </div>
          
          {/* Horizontal Tab Navigation */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
              {filteredSections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap
                            transition-all duration-200
                            ${activeSection === item.id 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                              : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Content - Full sections same as desktop */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Show message if search returns no results */}
          {searchQuery.trim() && filteredSections.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-gray-400 text-lg mb-2">No results found</h3>
              <p className="text-gray-500 text-sm">Try searching for terms like "shields", "stealing", "properties", or "strategy"</p>
            </div>
          )}
          
          {/* QUICK START */}
          {shouldShowSection('quick-start') && (
            <section id="mobile-quick-start" className="space-y-4">
            <div className="flex items-center gap-2">
              <RocketIcon className="text-purple-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Quick Start</h3>
            </div>
            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              <p className="text-purple-200 font-medium">
                Connect wallet → Buy properties → Earn daily income → Protect with shields → Steal from others!
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li><strong className="text-white">Connect your wallet</strong> and get some game tokens</li>
                <li><strong className="text-white">Buy property slots</strong> to start earning passive income</li>
                <li><strong className="text-white">Collect your rewards</strong> daily (or let them accumulate for bonuses)</li>
                <li><strong className="text-white">Protect your properties</strong> with shields to prevent theft</li>
                <li><strong className="text-white">Steal from others</strong> to grow your empire faster</li>
              </ol>
            </div>
          </section>
          )}

          {/* THE BASICS */}
          {shouldShowSection('basics') && (
          <section id="mobile-basics" className="space-y-4">
            <div className="flex items-center gap-2">
              <GameControllerIcon className="text-blue-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">The Basics</h3>
            </div>
            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              <p>
                Defipoly is a blockchain-based property investment game inspired by the classic Monopoly board game. 
                Buy virtual properties, earn daily passive income, protect your assets, and compete with other players 
                in a fully on-chain economy.
              </p>
              <p className="text-blue-300 font-medium">
                Built on Solana for fast, low-cost transactions.
              </p>
            </div>
          </section>
          )}

          {/* PROPERTIES */}
          {shouldShowSection('properties') && (
          <section id="mobile-properties" className="space-y-4">
            <div className="flex items-center gap-2">
              <BuildingIcon className="text-green-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Properties</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <p>
                Defipoly features <strong className="text-white">22 properties</strong> organized into <strong className="text-white">8 color sets</strong>, 
                just like Monopoly:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-purple-500/30 text-purple-300">
                      <th className="text-left py-2">Set</th>
                      <th className="text-left py-2">Properties</th>
                      <th className="text-left py-2">Price</th>
                      <th className="text-left py-2">Daily Yield</th>
                      <th className="text-left py-2">Shield Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 space-y-1">
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-amber-600 font-medium">Brown</td>
                      <td className="py-2">Mediterranean Ave, Baltic Ave</td>
                      <td className="py-2">1,500</td>
                      <td className="py-2">6.0% (90/day)</td>
                      <td className="py-2">10% (9/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-sky-400 font-medium">Light Blue</td>
                      <td className="py-2">Oriental Ave, Vermont Ave, Connecticut Ave</td>
                      <td className="py-2">3,500</td>
                      <td className="py-2">6.5% (228/day)</td>
                      <td className="py-2">11% (25/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-pink-400 font-medium">Pink</td>
                      <td className="py-2">St. Charles Place, States Ave, Virginia Ave</td>
                      <td className="py-2">7,500</td>
                      <td className="py-2">7.0% (525/day)</td>
                      <td className="py-2">12% (63/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-orange-400 font-medium">Orange</td>
                      <td className="py-2">St. James Place, Tennessee Ave, New York Ave</td>
                      <td className="py-2">15,000</td>
                      <td className="py-2">7.5% (1,125/day)</td>
                      <td className="py-2">13% (146/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-red-400 font-medium">Red</td>
                      <td className="py-2">Kentucky Ave, Indiana Ave, Illinois Ave</td>
                      <td className="py-2">30,000</td>
                      <td className="py-2">8.0% (2,400/day)</td>
                      <td className="py-2">14% (336/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-yellow-400 font-medium">Yellow</td>
                      <td className="py-2">Atlantic Ave, Ventnor Ave, Marvin Gardens</td>
                      <td className="py-2">60,000</td>
                      <td className="py-2">8.5% (5,100/day)</td>
                      <td className="py-2">15% (765/day)</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 text-emerald-400 font-medium">Green</td>
                      <td className="py-2">Pacific Ave, North Carolina Ave, Pennsylvania Ave</td>
                      <td className="py-2">120,000</td>
                      <td className="py-2">9.0% (10,800/day)</td>
                      <td className="py-2">16% (1,728/day)</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-blue-600 font-medium">Dark Blue</td>
                      <td className="py-2">Park Place, Boardwalk</td>
                      <td className="py-2">240,000</td>
                      <td className="py-2">10.0% (24,000/day)</td>
                      <td className="py-2">17% (4,080/day)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Slots</h4>
                  <p className="text-xs">
                    Each property has a limited number of slots available. When you buy a property, you're buying one or more slots of that property. 
                    Multiple players can own slots of the same property.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Example</h4>
                  <div className="text-xs space-y-1">
                    <p>You own 3 slots of Boardwalk (price: 240,000 tokens, yield: 10%)</p>
                    <p>Daily income per slot = 240,000 × 10% = 24,000 tokens</p>
                    <p className="text-green-400 font-medium">Your total daily income = 24,000 × 3 = 72,000 tokens/day</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* EARNING REWARDS */}
          {shouldShowSection('earning') && (
          <section id="mobile-earning" className="space-y-4">
            <div className="flex items-center gap-2">
              <CoinsIcon className="text-yellow-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Earning Rewards</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">Base Income</h4>
                <p>
                  Your rewards accumulate automatically every second based on your total daily income from all properties. 
                  You don't need to do anything—just own properties and watch your balance grow.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Claiming Rewards</h4>
                <p>
                  Click <strong className="text-purple-300">Claim</strong> anytime to collect your accumulated rewards. 
                  But here's the trick: <strong className="text-yellow-300">waiting pays off</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Accumulation Bonuses</h4>
                <p className="mb-3">The longer you wait to claim, the bigger your bonus:</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Accumulated Amount</th>
                        <th className="text-left py-2">Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">10,000+ tokens</td>
                        <td className="py-1 text-green-400">+1%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">25,000+ tokens</td>
                        <td className="py-1 text-green-400">+2.5%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">50,000+ tokens</td>
                        <td className="py-1 text-green-400">+5%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">100,000+ tokens</td>
                        <td className="py-1 text-green-400">+10%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">250,000+ tokens</td>
                        <td className="py-1 text-green-400">+15%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">500,000+ tokens</td>
                        <td className="py-1 text-green-400">+20%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">1,000,000+ tokens</td>
                        <td className="py-1 text-green-400">+25%</td>
                      </tr>
                      <tr>
                        <td className="py-1">2,500,000+ tokens</td>
                        <td className="py-1 text-green-400 font-bold">+40%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs">
                  <strong className="text-green-300">Pro tip:</strong> If you accumulate 100,000 tokens before claiming, 
                  you'll receive 110,000 tokens (100k + 10% bonus). The bonus is calculated progressively—each portion 
                  of your rewards gets the bonus for its tier.
                </p>
              </div>
            </div>
          </section>
          )}

          {/* SET COMPLETION BONUS */}
          {shouldShowSection('sets') && (
          <section id="mobile-sets" className="space-y-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="text-amber-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Set Completion Bonus</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <p>
                Own at least <strong className="text-white">one slot of every property in a color set</strong> to unlock a permanent income bonus!
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-purple-500/30 text-purple-300">
                      <th className="text-left py-2">Set</th>
                      <th className="text-left py-2">Properties Needed</th>
                      <th className="text-left py-2">Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 space-y-1">
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-amber-600 font-medium">Brown</td>
                      <td className="py-1">2</td>
                      <td className="py-1 text-green-400">+30%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+32.86%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-pink-400 font-medium">Pink</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+35.71%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-orange-400 font-medium">Orange</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+38.57%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-red-400 font-medium">Red</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+41.43%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+44.29%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-emerald-400 font-medium">Green</td>
                      <td className="py-1">3</td>
                      <td className="py-1 text-green-400">+47.14%</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                      <td className="py-1">2</td>
                      <td className="py-1 text-green-400 font-bold">+50%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                <p className="text-xs">
                  <strong className="text-amber-300">Example:</strong> You complete the Dark Blue set (Park Place + Boardwalk). 
                  Your base income from ALL properties now gets a +50% bonus when you claim.
                </p>
                <p className="text-xs">
                  <strong className="text-amber-300">Stack 'em up:</strong> Complete multiple sets and the bonuses add together!
                </p>
              </div>
            </div>
          </section>
          )}

          {/* SHIELDS */}
          {shouldShowSection('shields') && (
          <section id="mobile-shields" className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldIcon className="text-cyan-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Shields</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">What Are Shields?</h4>
                <p>
                  Shields protect your property slots from being stolen by other players. When a shield is active, 
                  those slots are completely safe.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">How Shields Work</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong className="text-cyan-300">Activate a shield</strong> on any property you own</li>
                  <li><strong className="text-cyan-300">Choose duration:</strong> 1 to 48 hours</li>
                  <li><strong className="text-cyan-300">Pay the shield cost</strong> (percentage of that property's daily yield)</li>
                  <li><strong className="text-cyan-300">All your slots</strong> of that property are now protected</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Shield Costs</h4>
                <p className="mb-3">Shield costs vary by property tier:</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Property Tier</th>
                        <th className="text-left py-2">Shield Cost (per 24h)</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-amber-600 font-medium">Brown</td>
                        <td className="py-1">10% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                        <td className="py-1">11% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-pink-400 font-medium">Pink</td>
                        <td className="py-1">12% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-orange-400 font-medium">Orange</td>
                        <td className="py-1">13% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-red-400 font-medium">Red</td>
                        <td className="py-1">14% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                        <td className="py-1">15% of daily yield</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-emerald-400 font-medium">Green</td>
                        <td className="py-1">16% of daily yield</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                        <td className="py-1">17% of daily yield</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 space-y-2">
                <div>
                  <h5 className="text-cyan-300 font-semibold text-xs mb-1">Example:</h5>
                  <div className="text-xs space-y-1">
                    <p>Boardwalk daily yield = 24,000 tokens/slot</p>
                    <p>Shield cost for 24 hours = 24,000 × 17% = 4,080 tokens/slot</p>
                    <p>If you own 3 slots: 4,080 × 3 = <span className="text-cyan-300 font-medium">12,240 tokens total</span></p>
                  </div>
                </div>
                <div>
                  <h5 className="text-cyan-300 font-semibold text-xs mb-1">Shield Cooldown:</h5>
                  <p className="text-xs">
                    After your shield expires, there's a cooldown period (1/4 of the shield duration) before you can shield again. 
                    Example: 24-hour shield → 6-hour cooldown before re-shielding.
                  </p>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* STEALING */}
          {shouldShowSection('stealing') && (
          <section id="mobile-stealing" className="space-y-4">
            <div className="flex items-center gap-2">
              <SwordIcon className="text-red-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Stealing</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">The Risk/Reward Mechanic</h4>
                <p>
                  Stealing adds excitement and strategy to the game. You can attempt to steal a slot from another player—but it's risky!
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">How Stealing Works</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong className="text-red-300">Choose a property</strong> to target</li>
                  <li><strong className="text-red-300">Pay the steal cost</strong> (50% of the property's price)</li>
                  <li><strong className="text-red-300">Random chance:</strong> 33% success rate</li>
                  <li><strong className="text-red-300">If successful:</strong> You gain 1 slot, they lose 1 slot</li>
                  <li><strong className="text-red-300">If failed:</strong> You lose the steal cost, nothing else happens</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Steal Protection</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-cyan-300">Shielded slots</strong> cannot be stolen</li>
                  <li>After being stolen from, you get <strong className="text-green-300">6 hours of protection</strong> on that property</li>
                  <li>Attackers have a <strong className="text-purple-300">cooldown</strong> before they can steal the same property again</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Strategy Tips</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Target players with unshielded, valuable properties</li>
                  <li>The steal cost is always 50% of the property price—same for cheap and expensive properties</li>
                  <li>Higher-tier properties have better ROI on successful steals</li>
                  <li><span className="text-red-300 font-medium">Remember: 67% of steal attempts fail!</span></li>
                </ul>
              </div>
            </div>
          </section>
          )}

          {/* COOLDOWNS */}
          {shouldShowSection('cooldowns') && (
          <section id="mobile-cooldowns" className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="text-purple-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Cooldowns</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">Purchase Cooldown</h4>
                <p className="mb-3">
                  After buying a property, there's a cooldown before you can buy a <strong className="text-white">different property in the same set</strong>.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Property Tier</th>
                        <th className="text-left py-2">Cooldown</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-amber-600 font-medium">Brown</td>
                        <td className="py-1">6 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                        <td className="py-1">8 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-pink-400 font-medium">Pink</td>
                        <td className="py-1">10 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-orange-400 font-medium">Orange</td>
                        <td className="py-1">12 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-red-400 font-medium">Red</td>
                        <td className="py-1">16 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                        <td className="py-1">20 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1 text-emerald-400 font-medium">Green</td>
                        <td className="py-1">24 hours</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                        <td className="py-1">28 hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <p className="text-xs">
                  <strong className="text-purple-300">Important:</strong> You can always buy <strong>more of the same property</strong> immediately. 
                  The cooldown only applies to switching properties within a set.
                </p>
                <p className="text-xs">
                  <strong className="text-purple-300">Steal Cooldown:</strong> After attempting to steal a property (success or fail), 
                  you must wait half the property's cooldown time before stealing that same property again.
                </p>
              </div>
            </div>
          </section>
          )}

          {/* SELLING */}
          {shouldShowSection('selling') && (
          <section id="mobile-selling" className="space-y-4">
            <div className="flex items-center gap-2">
              <MoneyIcon className="text-yellow-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Selling Properties</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">Cash Out Anytime</h4>
                <p>You can sell your property slots back to the game at any time.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Sell Value</h4>
                <p className="mb-3">The sell value depends on <strong className="text-white">how long you've held</strong> the property:</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Days Held</th>
                        <th className="text-left py-2">Sell Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">0 days</td>
                        <td className="py-1 text-red-400">15% of purchase price</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">7 days</td>
                        <td className="py-1 text-yellow-400">22.5% of purchase price</td>
                      </tr>
                      <tr>
                        <td className="py-1">14+ days</td>
                        <td className="py-1 text-green-400">30% of purchase price</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs mt-2 text-gray-400">The value increases linearly from 15% to 30% over 14 days.</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 space-y-2">
                <div>
                  <h5 className="text-yellow-300 font-semibold text-xs mb-1">Example:</h5>
                  <div className="text-xs space-y-1">
                    <p>Bought Boardwalk slot for 240,000 tokens</p>
                    <p>Held for 14 days</p>
                    <p>Sell value = 240,000 × 30% = <span className="text-yellow-300 font-medium">72,000 tokens</span></p>
                  </div>
                </div>
                <div>
                  <h5 className="text-yellow-300 font-semibold text-xs mb-1">When to Sell:</h5>
                  <p className="text-xs">
                    Selling is generally not profitable compared to holding for yield. Consider selling only if you need liquidity urgently, 
                    want to rebalance into different properties, or are cutting losses on a frequently stolen property.
                  </p>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* TOKEN ECONOMICS */}
          {shouldShowSection('economics') && (
          <section id="mobile-economics" className="space-y-4">
            <div className="flex items-center gap-2">
              <ChartUpIcon className="text-blue-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Token Economics</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2">Where Do Tokens Go?</h4>
                <p className="mb-3">When you buy properties, activate shields, or attempt steals, your tokens are distributed:</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Destination</th>
                        <th className="text-left py-2">Share</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Reward Pool</td>
                        <td className="py-1 text-green-400 font-bold">95%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Marketing</td>
                        <td className="py-1 text-blue-400">3%</td>
                      </tr>
                      <tr>
                        <td className="py-1">Development</td>
                        <td className="py-1 text-purple-400">2%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                <p className="text-xs">
                  The <strong className="text-blue-300">Reward Pool</strong> is where all player rewards come from. 
                  <span className="text-green-300 font-medium">The more players spend, the bigger the reward pool grows!</span>
                </p>
                <p className="text-xs">
                  Property yields are paid from the reward pool. New purchases constantly refill the pool. 
                  The system is designed to be self-sustaining.
                </p>
              </div>
            </div>
          </section>
          )}

          {/* STRATEGY GUIDE */}
          {shouldShowSection('strategy') && (
          <section id="mobile-strategy" className="space-y-4">
            <div className="flex items-center gap-2">
              <LightbulbIcon className="text-amber-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Strategy Guide</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <StarIcon className="text-green-400" size={16} />
                  For Beginners
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-6">
                  <li><strong className="text-white">Start with Brown properties</strong> — cheap and safe for learning</li>
                  <li><strong className="text-white">Don't steal yet</strong> — focus on understanding yields first</li>
                  <li><strong className="text-white">Shield your most valuable properties</strong> when you can afford it</li>
                  <li><strong className="text-white">Claim rewards regularly</strong> at first to build capital</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <StarIcon className="text-yellow-400" size={16} />
                  Intermediate Strategy
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-6">
                  <li><strong className="text-white">Complete your first set</strong> — the bonus is worth it</li>
                  <li><strong className="text-white">Diversify across tiers</strong> — spread risk</li>
                  <li><strong className="text-white">Time your claims</strong> — wait for accumulation bonuses</li>
                  <li><strong className="text-white">Shield strategically</strong> — protect high-yield properties</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <StarIcon className="text-purple-400" size={16} />
                  Advanced Strategy
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-6">
                  <li><strong className="text-white">Target set completion</strong> — multiple set bonuses stack</li>
                  <li><strong className="text-white">Accumulation maximize</strong> — build up to higher bonus tiers</li>
                  <li><strong className="text-white">Selective stealing</strong> — calculate expected value before attempts</li>
                  <li><strong className="text-white">Off-peak activity</strong> — steal when targets are less likely to notice</li>
                </ol>
              </div>
            </div>
          </section>
          )}

          {/* ROI REFERENCE */}
          {shouldShowSection('roi') && (
          <section id="mobile-roi" className="space-y-4">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="text-green-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">ROI Reference</h3>
            </div>
            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-purple-500/30 text-purple-300">
                      <th className="text-left py-2">Property</th>
                      <th className="text-left py-2">Price</th>
                      <th className="text-left py-2">Daily Yield</th>
                      <th className="text-left py-2">Days to ROI*</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300 space-y-1">
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-amber-600 font-medium">Brown</td>
                      <td className="py-1">1,500</td>
                      <td className="py-1">90</td>
                      <td className="py-1">16.7 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-sky-400 font-medium">Light Blue</td>
                      <td className="py-1">3,500</td>
                      <td className="py-1">227</td>
                      <td className="py-1">15.4 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-pink-400 font-medium">Pink</td>
                      <td className="py-1">7,500</td>
                      <td className="py-1">525</td>
                      <td className="py-1">14.3 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-orange-400 font-medium">Orange</td>
                      <td className="py-1">15,000</td>
                      <td className="py-1">1,125</td>
                      <td className="py-1">13.3 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-red-400 font-medium">Red</td>
                      <td className="py-1">30,000</td>
                      <td className="py-1">2,400</td>
                      <td className="py-1">12.5 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-yellow-400 font-medium">Yellow</td>
                      <td className="py-1">60,000</td>
                      <td className="py-1">5,100</td>
                      <td className="py-1">11.8 days</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-1 text-emerald-400 font-medium">Green</td>
                      <td className="py-1">120,000</td>
                      <td className="py-1">10,800</td>
                      <td className="py-1">11.1 days</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-blue-600 font-medium">Dark Blue</td>
                      <td className="py-1">240,000</td>
                      <td className="py-1">24,000</td>
                      <td className="py-1 text-green-400 font-bold">10.0 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 italic">
                *Before bonuses. With set + accumulation bonuses, ROI can be significantly faster.
              </p>
            </div>
          </section>
          )}

          {/* QUICK REFERENCE */}
          {shouldShowSection('reference') && (
          <section id="mobile-reference" className="space-y-4">
            <div className="flex items-center gap-2">
              <InfoIcon className="text-blue-400" size={20} />
              <h3 className="text-lg font-orbitron font-bold text-white">Quick Reference</h3>
            </div>
            <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-white mb-3">Key Numbers</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300">
                        <th className="text-left py-2">Mechanic</th>
                        <th className="text-left py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300 space-y-1">
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Steal success rate</td>
                        <td className="py-1 text-green-400">33%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Steal cost</td>
                        <td className="py-1 text-red-400">50% of property price</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Steal protection duration</td>
                        <td className="py-1">6 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Shield duration range</td>
                        <td className="py-1">1-48 hours</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Shield cooldown</td>
                        <td className="py-1">25% of shield duration</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Minimum sell value</td>
                        <td className="py-1 text-red-400">15%</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Maximum sell value</td>
                        <td className="py-1 text-green-400">30% (at 14 days)</td>
                      </tr>
                      <tr className="border-b border-gray-700/50">
                        <td className="py-1">Set bonuses</td>
                        <td className="py-1 text-green-400">30% - 50%</td>
                      </tr>
                      <tr>
                        <td className="py-1">Max accumulation bonus</td>
                        <td className="py-1 text-green-400 font-bold">40%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Important Disclaimers</h4>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• <strong className="text-white">This is a game.</strong> Play responsibly and only with funds you can afford to lose.</li>
                  <li>• <strong className="text-white">Smart contract risk.</strong> While audited, all blockchain applications carry inherent risks.</li>
                  <li>• <strong className="text-white">No guaranteed returns.</strong> Yields depend on the reward pool and game activity.</li>
                  <li>• <strong className="text-white">PvP mechanics.</strong> Other players can steal your unshielded properties.</li>
                  <li>• <strong className="text-white">Token volatility.</strong> The value of game tokens may fluctuate.</li>
                </ul>
              </div>

              <div className="text-center py-4">
                <p className="text-purple-300 font-orbitron font-bold text-lg">Happy investing! 🎲</p>
                <p className="text-gray-400 text-xs mt-2">
                  <strong className="text-white">Defipoly</strong> — <em>Own the Board. Earn the Rewards.</em>
                </p>
              </div>
            </div>
          </section>
          )}
          
        </div>
      </div>
    </>
  );
}