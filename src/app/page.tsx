'use client';

import React from 'react';
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

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden select-none bg-[#CADAE8]">
      
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
      <div className="fixed inset-0 z-[100] flex-col items-center justify-center bg-[#CADAE8] text-[#023B22] p-6 text-center md:hidden portrait:flex landscape:hidden select-none font-mono">
        <div className="w-12 h-12 mb-6 border-4 border-[#023B22] border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xs font-black tracking-widest uppercase mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Rotate Your Device
        </h2>
        <p className="text-[9px] uppercase tracking-wider text-[#023B22]/70 max-w-xs leading-relaxed">
          Voyage is designed and optimized for landscape viewing. Please rotate your device to begin.
        </p>
      </div>

    </div>
  );
}
