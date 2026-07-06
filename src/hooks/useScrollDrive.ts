import { useEffect, useRef } from 'react';
import { useGameStore } from './useGameStore';
import Lenis from 'lenis';

export const useScrollDrive = () => {
  const {
    scrollProgress,
    targetProgress,
    setScrollProgress,
    setTargetProgress,
    setScrollSpeed,
    unityPlaying,
  } = useGameStore();

  const lenisRef = useRef<Lenis | null>(null);
  const touchStartY = useRef<number>(0);
  const lastProgressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    const isInputBlocked = () => {
      const state = useGameStore.getState();
      return (
        state.unityPlaying ||
        state.isPaused ||
        state.feedbackOpen ||
        state.profileDrawerOpen
      );
    };

    const handleScroll = (e: any) => {
      if (isInputBlocked()) return;

      const delta = e.deltaY || e.velocity || 0;
      const sensitivity = 0.00015;
      
      // Wrap progress between 0.0 and 1.0 seamlessly
      let nextTarget = useGameStore.getState().targetProgress + delta * sensitivity;
      nextTarget = ((nextTarget % 1) + 1) % 1;
      
      setTargetProgress(nextTarget);
    };

    lenis.on('scroll', handleScroll);

    let animationFrameId: number;
    
    const tick = (time: number) => {
      lenis.raf(time);

      const state = useGameStore.getState();
      const currentProgress = state.scrollProgress;
      const target = state.targetProgress;
      const activeUnity = state.unityPlaying;
      const paused = state.isPaused || state.feedbackOpen || state.profileDrawerOpen;

      if (!activeUnity && !paused) {
        // Smooth circular lerp
        const lerpFactor = 0.06;
        let nextProgress = currentProgress;
        
        let diff = target - currentProgress;
        if (diff > 0.5) diff -= 1.0;
        if (diff < -0.5) diff += 1.0;
        
        nextProgress = currentProgress + diff * lerpFactor;
        nextProgress = ((nextProgress % 1) + 1) % 1;

        if (Math.abs(diff) < 0.00001) {
          nextProgress = target;
        }

        setScrollProgress(nextProgress);

        // Speedometer calculation
        const dt = (time - lastTimeRef.current) / 1000 || 0.016;
        let progressDiff = nextProgress - lastProgressRef.current;
        if (progressDiff > 0.5) progressDiff -= 1.0;
        if (progressDiff < -0.5) progressDiff += 1.0;
        
        const rawSpeed = Math.abs(progressDiff) / dt;
        const visualSpeed = Math.min(320, Math.round(rawSpeed * 380));
        setScrollSpeed(visualSpeed);

        lastProgressRef.current = nextProgress;
      } else {
        setScrollSpeed(0);
      }

      lastTimeRef.current = time;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Standard driving controls:
    // - ArrowUp, ArrowRight, W, D: move forward (increase progress)
    // - ArrowDown, ArrowLeft, S, A: move backward (decrease progress)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputBlocked()) return;

      const step = 0.02;
      let nextTarget = useGameStore.getState().targetProgress;

      if (
        e.key === 'ArrowUp' || 
        e.key === 'ArrowRight' || 
        e.key === 'w' || 
        e.key === 'W' || 
        e.key === 'd' || 
        e.key === 'D' || 
        e.key === ' '
      ) {
        nextTarget = (nextTarget + step) % 1;
      } else if (
        e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || 
        e.key === 's' || 
        e.key === 'S' || 
        e.key === 'a' || 
        e.key === 'A'
      ) {
        nextTarget = (nextTarget - step + 1) % 1;
      } else {
        return;
      }
      
      setTargetProgress(nextTarget);
    };

    // Mobile touch
    const handleTouchStart = (e: TouchEvent) => {
      if (isInputBlocked()) return;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isInputBlocked()) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY.current - currentY;
      touchStartY.current = currentY;

      const sensitivity = 0.0012;
      let nextTarget = useGameStore.getState().targetProgress + deltaY * sensitivity;
      nextTarget = ((nextTarget % 1) + 1) % 1;

      setTargetProgress(nextTarget);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [unityPlaying]);

  return lenisRef.current;
};
