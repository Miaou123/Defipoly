'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  tips?: string[];
}

const DEFAULT_TIPS = [
  "PREPARING YOUR EMPIRE",
  "LOADING PROPERTIES", 
  "COUNTING YOUR WEALTH",
  "BUILDING YOUR FUTURE",
  "CONNECTING TO SOLANA"
];

export function LoadingScreen({ tips = DEFAULT_TIPS }: LoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);

  // Cycle through tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Create floating particles
  useEffect(() => {
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'loading-particle';
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #a855f7;
        border-radius: 50%;
        opacity: 0.6;
        left: ${Math.random() * 100}vw;
        animation: particleFloat ${8 + Math.random() * 6}s linear infinite;
        animation-delay: ${Math.random() * 10}s;
        z-index: 0;
      `;
      document.body.appendChild(particle);
      particles.push(particle);
    }
    return () => particles.forEach(p => p.remove());
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0015] relative overflow-hidden">
      {/* Animated grid background */}
      <div 
        className="fixed inset-0 z-0 animate-grid-move"
        style={{
          background: `
            linear-gradient(90deg, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
            linear-gradient(rgba(147, 51, 234, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Glowing orbs */}
      <div className="fixed w-[300px] h-[300px] rounded-full bg-purple-600 blur-[80px] opacity-40 -top-[100px] -left-[100px] animate-float z-0" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-pink-600 blur-[80px] opacity-40 -bottom-[150px] -right-[150px] animate-float-delayed z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <img 
          src="/logo.svg" 
          alt="Defipoly" 
          className="w-32 h-32 object-contain animate-logo-float"
        />
        
        {/* Loading text with wave animation */}
        <div className="flex gap-1 text-2xl font-bold uppercase tracking-widest font-orbitron">
          {'LOADING'.split('').map((letter, i) => (
            <span 
              key={i}
              className="text-purple-500 animate-wave"
              style={{ 
                animationDelay: `${i * 0.1}s`,
                textShadow: '0 0 20px rgba(168, 85, 247, 0.8)'
              }}
            >
              {letter}
            </span>
          ))}
          {[0, 1, 2].map(i => (
            <span 
              key={`dot-${i}`}
              className="text-purple-500 animate-dot-pulse"
              style={{ animationDelay: `${0.7 + i * 0.2}s` }}
            >
              .
            </span>
          ))}
        </div>
        
        {/* Rotating tip */}
        <div className="text-purple-500/60 text-xs tracking-widest animate-fade-in-out font-orbitron">
          {tips[currentTip]}
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes wave {
          0%, 100% { 
            transform: translateY(0);
            color: #a855f7;
          }
          50% { 
            transform: translateY(-10px);
            color: #22d3ee;
            text-shadow: 0 0 30px rgba(34, 211, 238, 1);
          }
        }
        
        @keyframes dot-pulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
        }
        
        @keyframes logo-float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          50% { 
            transform: translateY(-15px) rotate(3deg); 
          }
        }
        
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
        
        .animate-dot-pulse {
          animation: dot-pulse 1.5s ease-in-out infinite;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 4s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: -3s;
        }
        
        .animate-grid-move {
          animation: grid-move 20s linear infinite;
        }
        
        .animate-logo-float {
          animation: logo-float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}