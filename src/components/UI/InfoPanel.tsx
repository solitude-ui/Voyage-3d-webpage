'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import timelineData from '../../../content/timeline.json';

export default function InfoPanel() {
  const scrollProgress = useGameStore((state) => state.scrollProgress);
  const activeCheckpointIndex = useGameStore((state) => state.activeCheckpointIndex);

  // Proximity checkpoint check
  const activeCheckpoint = useMemo(() => {
    const progressInCycle = scrollProgress % 1.0;
    
    // Clear center welcome instructions from start screen (progress <= 0.05) to avoid blocking visibility
    if (scrollProgress <= 0.05 || progressInCycle <= 0.05) {
      return null;
    }
    
    // Checkpoint facts popup range
    return timelineData.find((cp) => {
      if (cp.progress === 0) return false;
      const dist = Math.abs(progressInCycle - cp.progress);
      return dist <= 0.11;
    });
  }, [scrollProgress]);

  // Determine dynamic card layout (alternating left and right)
  const layout = useMemo(() => {
    const layoutType = activeCheckpointIndex % 2;
    if (layoutType === 1) return 'left';
    return 'right';
  }, [activeCheckpointIndex]);

  // Align flex items based on layout
  const justifyClass = useMemo(() => {
    if (layout === 'left') return 'justify-center md:justify-start px-6 md:px-24';
    return 'justify-center md:justify-end px-6 md:px-24';
  }, [layout]);

  // Framer Motion animation values based on layout
  const animationProps = useMemo(() => {
    // On mobile, fade and slide up (y) instead of side sliding (x) to prevent clipping
    return {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    };
  }, [layout]);

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none z-20 flex items-start pt-36 md:items-center md:pt-0 select-none font-sans ${justifyClass}`}>
      <AnimatePresence mode="wait">
        {activeCheckpoint && (
          <motion.div
            key={activeCheckpoint.id + '-' + layout}
            {...animationProps}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-sm flex gap-6 items-start text-[#023B22] pointer-events-auto"
          >
            {/* Left side timeline indicator */}
            <div className="flex flex-col items-center h-48">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-[#023B22] bg-white" />
              <div className="w-0.5 bg-[#023B22]/20 flex-1 my-1" />
              <div className="text-[9px] font-mono tracking-widest text-[#023B22]/50 rotate-90 origin-left translate-y-3">
                {Math.round(activeCheckpoint.progress * 100)}%
              </div>
            </div>

            {/* Main Text details */}
            <div className="flex flex-col gap-3 max-w-xs pr-4">
              <h2 
                className="text-2xl md:text-3xl font-light tracking-wide capitalize"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {activeCheckpoint.title}
              </h2>
              
              <p className="text-xs md:text-sm leading-relaxed font-light text-[#023B22]/85">
                {activeCheckpoint.description}
              </p>

              {activeCheckpoint.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeCheckpoint.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-[#023B22]/15 bg-white/50 rounded font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
