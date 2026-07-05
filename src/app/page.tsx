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

export default function Home() {
  // Mount smooth scrolling physics calculations
  useScrollDrive();

  const fadeActive = useGameStore((state) => state.fadeActive);
  const unityPlaying = useGameStore((state) => state.unityPlaying);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#CADAE8]">
      
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

    </div>
  );
}
