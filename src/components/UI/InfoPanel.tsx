'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import timelineData from '../../../content/timeline.json';

export default function InfoPanel() {
  const scrollProgress = useGameStore((state) => state.scrollProgress);
  const activeCheckpointIndex = useGameStore((state) => state.activeCheckpointIndex);

  // Find the latest passed checkpoint (stable reference for layout and thresholding)
  const passedCp = useMemo(() => {
    const progressInCycle = scrollProgress % 1.0;
    
    // Clear check to allow welcome center text on absolute start screen (progress <= 0.05)
    if (scrollProgress <= 0.05) {
      return null;
    }

    // Special mapping for the 100% milestone which is at progress 1.0
    // We trigger it at progress >= 0.88 up to 1.0
    if (progressInCycle >= 0.88) {
      return timelineData.find((cp) => cp.progress === 1.0) || null;
    }

    const sortedCheckpoints = [...timelineData].sort((a, b) => b.progress - a.progress);
    
    // Match the 0.0 milestone (Ignition Point) only between 0.06 and 0.15
    if (progressInCycle >= 0.06 && progressInCycle < 0.20) {
      return timelineData.find((cp) => cp.progress === 0.0) || null;
    }

    // General match for middle checkpoints (excluding 0.0 and 1.0)
    return sortedCheckpoints.find((cp) => progressInCycle >= cp.progress && cp.progress > 0.0 && cp.progress < 1.0) || null;
  }, [scrollProgress]);

  // Proximity checkpoint check (shows at start of milestone and gradually fades out)
  const activeCheckpoint = useMemo(() => {
    if (!passedCp) return null;
    const progressInCycle = scrollProgress % 1.0;

    if (passedCp.progress === 1.0) {
      // 100% milestone: starts at 0.88, fades out by 1.0 (window = 0.12)
      const dist = progressInCycle - 0.88;
      if (dist >= 0 && dist <= 0.12) {
        return passedCp;
      }
    } else if (passedCp.progress === 0.0) {
      // 0% milestone (Ignition Point): starts at 0.06, fades out by 0.15 (window = 0.09)
      const dist = progressInCycle - 0.06;
      if (dist >= 0 && dist <= 0.09) {
        return passedCp;
      }
    } else {
      // Standard milestones: starts at cp.progress, fades out after 0.14 (window = 0.14)
      const dist = progressInCycle - passedCp.progress;
      if (dist >= 0 && dist <= 0.14) {
        return passedCp;
      }
    }
    return null;
  }, [scrollProgress, passedCp]);

  // Compute dynamic opacity for smooth scroll-based fade out
  const opacity = useMemo(() => {
    if (!activeCheckpoint) return 0;
    const progressInCycle = scrollProgress % 1.0;
    
    if (activeCheckpoint.progress === 1.0) {
      const dist = progressInCycle - 0.88;
      if (dist < 0 || dist > 0.12) return 0;
      return 1 - (dist / 0.12);
    } else if (activeCheckpoint.progress === 0.0) {
      const dist = progressInCycle - 0.06;
      if (dist < 0 || dist > 0.09) return 0;
      return 1 - (dist / 0.09);
    } else {
      const dist = progressInCycle - activeCheckpoint.progress;
      if (dist < 0 || dist > 0.14) return 0;
      return 1 - (dist / 0.14); // dynamic linear fade-out
    }
  }, [scrollProgress, activeCheckpoint]);

  // Determine dynamic card layout (alternates strictly starting from left: idx 0 (0%) = left, idx 1 (20%) = right, etc.)
  const layout = useMemo(() => {
    if (!passedCp) return 'left';
    const idx = timelineData.findIndex((cp) => cp.id === passedCp.id);
    return idx % 2 === 0 ? 'left' : 'right';
  }, [passedCp]);

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
            style={{ opacity }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full max-w-[210px] lg:max-w-sm flex gap-3 lg:gap-6 items-start text-[#023B22] pointer-events-auto transform transition-transform duration-350 ${
              layout === 'right' ? 'lg:-translate-y-24' : ''
            }`}
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
