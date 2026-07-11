'use client';

import React, { useEffect } from 'react';
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

  const fadeActive = useGameStore((state) => state.fadeActive);
  const unityPlaying = useGameStore((state) => state.unityPlaying);
  const feedbackOpen = useGameStore((state) => state.feedbackOpen);
  const setFeedbackOpen = useGameStore((state) => state.setFeedbackOpen);

  // Auto-fullscreen on mobile rotation to landscape
  useEffect(() => {
    const handleOrientationCheck = async () => {
      if (typeof window === 'undefined') return;
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (!isMobile) return;

      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        // Try to trigger fullscreen automatically
        try {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          // Fallback: Bind one-time gesture listeners to upgrade to fullscreen on next tap
          const activateFullscreen = async () => {
            try {
              if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
              }
            } catch (err) {}
            window.removeEventListener('touchstart', activateFullscreen);
            window.removeEventListener('click', activateFullscreen);
          };
          window.addEventListener('touchstart', activateFullscreen);
          window.addEventListener('click', activateFullscreen);
        }
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
