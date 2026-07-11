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
    if (layout === 'left') return 'justify-start px-4 lg:px-24';
    return 'justify-end px-4 lg:px-24';
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
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-20 flex items-start pt-12 lg:items-center lg:pt-0 select-none font-sans ${justifyClass}`}>
      <AnimatePresence mode="wait">
        {activeCheckpoint && (
          <motion.div
            key={activeCheckpoint.id + '-' + layout}
            {...animationProps}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[210px] lg:max-w-sm flex gap-3 lg:gap-6 items-start text-[#023B22] pointer-events-auto"
          >
            {/* Left side timeline indicator */}
            <div className="flex flex-col items-center h-24 lg:h-48">
              <div className="w-1 h-1 lg:w-2.5 lg:h-2.5 rounded-full border border-[#023B22] bg-white" />
              <div className="w-0.5 bg-[#023B22]/20 flex-1 my-1" />
              <div className="text-[7px] lg:text-[9px] font-mono tracking-widest text-[#023B22]/50 rotate-90 origin-left translate-y-3">
                {Math.round(activeCheckpoint.progress * 100)}%
              </div>
            </div>

            {/* Main Text details */}
            <div className="flex flex-col gap-1 lg:gap-3 max-w-xs pr-2">
              <h2 
                className="text-xs lg:text-3xl font-light tracking-wide capitalize"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {activeCheckpoint.title}
              </h2>
              
              <p className="text-[9px] lg:text-sm leading-relaxed font-light text-[#023B22]/85">
                {activeCheckpoint.description}
              </p>

              {activeCheckpoint.tags && (
                <div className="flex flex-wrap gap-1 lg:gap-1.5 mt-1 lg:mt-2">
                  {activeCheckpoint.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[7.5px] lg:text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-[#023B22]/15 bg-white/50 rounded font-mono"
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
