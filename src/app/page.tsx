'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useScrollDrive } from '../hooks/useScrollDrive';
import { useGameStore } from '../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic import of Three.js Canvas with SSR disabled
const ThreeCanvas = dynamic(() => import('../components/ThreeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#CADAE8] flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-[#023B22]/60">
      <div className="w-10 h-10 rounded-full border-2 border-t-[#023B22] border-white/20 animate-spin mb-4" />
      <span>Loading Voyage Simulator...</span>
    </div>
  ),
});

// UI HUD overlays
import Dashboard from '../components/UI/Dashboard';
import InfoPanel from '../components/UI/InfoPanel';
import FTUX from '../components/UI/FTUX';
import UnityModal from '../components/UI/UnityModal';
import Feedback from '../components/UI/Feedback';

export default function Home() {
  // Mount smooth scrolling physics calculations
  useScrollDrive();

  const [showWelcome, setShowWelcome] = useState(true);
  const fadeActive = useGameStore((state) => state.fadeActive);
  const unityPlaying = useGameStore((state) => state.unityPlaying);
  const feedbackOpen = useGameStore((state) => state.feedbackOpen);
  const setFeedbackOpen = useGameStore((state) => state.setFeedbackOpen);

  const requestFullScreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).mozRequestFullScreen) {
        await (docEl as any).mozRequestFullScreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request blocked or failed:", err);
    }
  };

  const lockLandscape = async () => {
    try {
      const anyScreen = screen as any;
      if (anyScreen.orientation && anyScreen.orientation.lock) {
        await anyScreen.orientation.lock("landscape");
      } else if (anyScreen.lockOrientation) {
        await anyScreen.lockOrientation("landscape");
      }
    } catch (err) {
      console.warn("Orientation lock not supported or failed:", err);
    }
  };

  // Auto-fullscreen on mobile rotation to landscape (using gesture triggers)
  useEffect(() => {
    const handleOrientationCheck = async () => {
      if (typeof window === 'undefined') return;
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (!isMobile) return;

      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        // Try to trigger fullscreen immediately
        await requestFullScreen();
        await lockLandscape();
        
        // Fallback: Bind one-time gesture listeners to upgrade to fullscreen on next tap/touch
        const activateFullscreen = async () => {
          await requestFullScreen();
          await lockLandscape();
          window.removeEventListener('touchstart', activateFullscreen);
          window.removeEventListener('click', activateFullscreen);
        };
        window.addEventListener('touchstart', activateFullscreen, { passive: true });
        window.addEventListener('click', activateFullscreen, { passive: true });
      }
    };

    window.addEventListener('resize', handleOrientationCheck);
    window.addEventListener('orientationchange', handleOrientationCheck);
    
    // Initial delay checks to allow viewport height recalculations
    const initialTimer = setTimeout(handleOrientationCheck, 500);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleOrientationCheck);
      window.removeEventListener('orientationchange', handleOrientationCheck);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-[#CADAE8]">
      
      {/* 1. Three.js 3D WebGL Canvas Layer (Base, z-0) */}
      {!unityPlaying && <ThreeCanvas />}

      {/* 2. Interactive DOM HUD Layer (z-10 on top of canvas) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Dashboard />
        <InfoPanel />
      </div>

      {/* 3. Authentication & Gameplay Modals (z-40/z-50) */}
      <FTUX />
      <UnityModal />
      {feedbackOpen && (
        <Feedback active={feedbackOpen} onSubmittedComplete={() => setFeedbackOpen(false)} />
      )}

      {/* Welcome Splash Overlay Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 z-40 bg-[#CADAE8]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-[#023B22] pointer-events-auto"
          >
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl lg:text-8xl tracking-[0.25em] font-light text-[#023B22] uppercase text-center"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              VOYAGE
            </motion.h1>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-[8px] lg:text-sm uppercase tracking-[0.3em] text-[#023B22]/70 font-mono mt-2 lg:mt-3 text-center"
            >
              Car Traffic Simulator
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-[7px] lg:text-xs uppercase tracking-widest text-[#023B22]/55 font-mono mt-4 lg:mt-6 max-w-sm text-center leading-relaxed"
            >
              An Interactive 3D Dev Journey & WebGL Demo
            </motion.p>
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              onClick={async () => {
                await requestFullScreen();
                await lockLandscape();
                setShowWelcome(false);
              }}
              className="flex items-center justify-center w-auto px-6 py-3 lg:px-8 lg:py-4 rounded bg-[#023B22] hover:bg-[#034d2d] text-white font-bold text-[9px] lg:text-xs tracking-widest uppercase border border-[#023B22]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer mt-8 lg:mt-12"
            >
              GET STARTED
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Cinematic Warp Loop Transition Screen */}
      <AnimatePresence>
        {fadeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 bg-[#CADAE8] flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#023B22]/65 pointer-events-auto"
          >
            <span>REPOSITIONING SIMULATION...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Portrait Orientation Lock Overlay on Mobile Devices */}
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#CADAE8] text-[#023B22] p-6 text-center md:hidden portrait:flex landscape:hidden select-none font-mono">
        <style>{`
          @keyframes rotate-phone {
            0%, 20% { transform: rotate(0deg); }
            50%, 70% { transform: rotate(-90deg); }
            100% { transform: rotate(-90deg); }
          }
          .animate-phone-rotate {
            animation: rotate-phone 3.5s ease-in-out infinite;
          }
        `}</style>
        
        {/* Animated Phone Rotate Icon */}
        <div className="w-12 h-20 border-4 border-[#023B22] rounded-lg relative flex items-center justify-center animate-phone-rotate mb-6 shadow-sm bg-white/10">
          <div className="w-2.5 h-1 bg-[#023B22] rounded-full absolute top-1.5" />
          <div className="w-3 h-3 border-2 border-[#023B22] rounded-full absolute bottom-1.5" />
          <div className="text-[9px] font-black tracking-tighter">3D</div>
        </div>

        <h2 className="text-xs font-black tracking-widest uppercase mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Rotate Your Device
        </h2>
        <p className="text-[9px] uppercase tracking-wider text-[#023B22]/70 max-w-xs leading-relaxed mb-4">
          Voyage is designed and optimized for landscape viewing.
        </p>
        
        {/* Auto Rotate Instruction Box */}
        <div className="border border-[#023B22]/20 bg-white/45 backdrop-blur-md p-3 rounded text-[7.5px] uppercase font-bold tracking-widest text-[#023B22]/80 leading-relaxed max-w-xs shadow-xs">
          ⚠️ Please ensure <span className="text-[#023B22] underline">Auto-Rotate</span> is enabled in your device settings
        </div>
      </div>

    </div>
  );
}
