'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

type UnityBridgePayload = {
  type?: string;
  event?: string;
  name?: string;
  score?: unknown;
  currentScore?: unknown;
  gameScore?: unknown;
  value?: unknown;
};

const toFiniteScore = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : null;
};

const parseUnityScore = (data: unknown) => {
  if (typeof data === 'number') {
    return toFiniteScore(data);
  }

  if (typeof data === 'string') {
    if (data === 'unity-loaded' || data === 'exit-unity') return null;

    const numericScore = toFiniteScore(data);
    if (numericScore !== null) return numericScore;

    // Match patterns like "Score: 123", "totalScore=123", "value: 123"
    const scoreMatch = data.match(/(?:score|currentScore|gameScore|totalScore|value|total_score|current_score)\s*[:=]\s*(\d+)/i);
    if (scoreMatch) return toFiniteScore(scoreMatch[1]);

    try {
      return parseUnityScore(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') return null;

  // For object payloads, check all common score keys directly
  const payload = data as any;
  const scoreValue = payload.score ?? payload.currentScore ?? payload.gameScore ?? payload.totalScore ?? payload.value ?? payload.total_score ?? payload.current_score;

  if (scoreValue !== undefined && scoreValue !== null) {
    return toFiniteScore(scoreValue);
  }

  return null;
};

export default function UnityModal() {
  const {
    unityLoading,
    unityPlaying,
    loginSubmitted,
    setUnityLoading,
    setUnityPlaying,
    setUnityStats,
    resetGame,
  } = useGameStore();

  const [loadingPercent, setLoadingPercent] = useState(0);
  const [factsIndex, setFactsIndex] = useState(0);
  const [unityReady, setUnityReady] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('/unity-game/index.html');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect mobile and choose corresponding WebGL build on play start
  useEffect(() => {
    if (unityPlaying && typeof window !== 'undefined') {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIframeSrc(isMobile ? '/unity-game-mobile/index.html' : '/unity-game/index.html');
    }
  }, [unityPlaying]);

  // Listen for load and score messages from inside the WebGL iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("UnityModal Received Message:", event.data);
      // Relaxed source validation to support sandboxed fullscreen contexts where event.source can be null
      /*
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) {
        return;
      }
      */

      if (event.data === 'unity-loaded') {
        setUnityReady(true);
        return;
      }

      if (event.data === 'exit-unity') {
        setUnityPlaying(false);
        setUnityLoading(false);
        setLoadingPercent(0);
        setUnityReady(false);
        resetGame();
        
        // Trigger feedback modal if not submitted yet
        const state = useGameStore.getState();
        if (!state.feedbackSubmitted) {
          state.setFeedbackOpen(true);
        }
        return;
      }

      const score = parseUnityScore(event.data);
      if (score !== null) {
        setUnityStats({ score });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setUnityStats, setUnityPlaying, setUnityLoading, resetGame]);

  // Intercept browser console logs to dynamically extract score details logged by Unity
  useEffect(() => {
    if (!unityPlaying) return;

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;

    const interceptor = (originalFn: Function) => (...args: any[]) => {
      // Call original log so it displays in developer console
      originalFn.apply(console, args);

      // Convert arguments to a single string
      const logString = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');

      // Parse score values (looking for patterns like "score: 195" or "Score = 576")
      const scoreMatch = logString.match(/(?:current score|total score|final score|score)\s*[:=]?\s*(\d+)/i);
      if (scoreMatch) {
        const parsedScore = parseInt(scoreMatch[1], 10);
        if (!isNaN(parsedScore)) {
          setUnityStats({ score: parsedScore });
        }
      }
    };

    console.log = interceptor(originalLog);
    console.info = interceptor(originalInfo);
    console.warn = interceptor(originalWarn);

    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
    };
  }, [unityPlaying, setUnityStats]);

  // Auto-focus the iframe content window so keyboard controls work instantly
  useEffect(() => {
    if (!unityLoading && unityPlaying) {
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.focus();
          iframeRef.current.contentWindow?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [unityLoading, unityPlaying]);

  const loadingFacts = [
    "Initializing digital physics systems...",
    "Allocating canvas frame arrays...",
    "Entering virtual highway compilation...",
  ];

  // Simulator compile progress sequence (crawls to 95% and waits for real WebGL load callback)
  useEffect(() => {
    if (!unityPlaying || !unityLoading || !loginSubmitted) return;
    
    const factInterval = setInterval(() => {
      setFactsIndex((prev) => (prev + 1) % loadingFacts.length);
    }, 1200);

    const progressInterval = setInterval(() => {
      setLoadingPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(factInterval);
          setTimeout(() => {
            setUnityLoading(false);
          }, 300);
          return 100;
        }

        // If Unity WebGL engine is still booting, cap progress at 95%
        if (!unityReady) {
          if (prev < 90) {
            return prev + Math.floor(Math.random() * 8) + 4; // fast start
          } else if (prev < 95) {
            return prev + 1; // slow crawl
          }
          return prev; // hold
        }

        // Once Unity ready message is received, sweep to 100%
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 80);

    return () => {
      clearInterval(progressInterval);
      clearInterval(factInterval);
    };
  }, [unityPlaying, unityLoading, loginSubmitted, unityReady, setUnityLoading]);

  const handleClose = () => {
    setUnityPlaying(false);
    setUnityLoading(false);
    setLoadingPercent(0);
    setUnityReady(false);
    resetGame();
    
    // Trigger feedback modal if not submitted yet
    const state = useGameStore.getState();
    if (!state.feedbackSubmitted) {
      state.setFeedbackOpen(true);
    }
  };

  const handleEndSimulation = () => {
    setUnityPlaying(false);
    setUnityLoading(false);
    setLoadingPercent(0);
    setUnityReady(false);
    resetGame();
    
    // Trigger feedback modal if not submitted yet
    const state = useGameStore.getState();
    if (!state.feedbackSubmitted) {
      state.setFeedbackOpen(true);
    }
  };

  const visible = unityPlaying && loginSubmitted;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 select-none font-mono bg-[#231F20]"
        >
          <div className="w-screen h-screen relative flex items-center justify-center">
            
            {/* Full screen Unity WebGL game canvas inside an iframe */}
            <iframe 
              ref={iframeRef}
              src={iframeSrc} 
              className="w-full h-full border-none block bg-[#231F20]" 
              allow="autoplay; gamepad"
              onLoad={() => {
                setTimeout(() => {
                  if (iframeRef.current) {
                    iframeRef.current.focus();
                    iframeRef.current.contentWindow?.focus();
                  }
                }, 100);
              }}
            />

            {/* Simulated & Real-synchronized themed Loading Overlay */}
            <AnimatePresence>
              {unityLoading && (
                <motion.div 
                  key="loading-view"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-[#CADAE8] flex items-center justify-center z-50 p-4"
                >
                  <div className="w-full max-w-sm bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-8 rounded-lg shadow-sm flex flex-col items-center text-center text-[#023B22]">
                    <RefreshCw className="w-8 h-8 text-[#023B22] animate-spin mb-4" />
                    <h3 className="text-sm font-black tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                      Compiling WebGL Simulation
                    </h3>
                    
                    <div className="w-full bg-white/40 h-2 rounded-full overflow-hidden mt-6 relative border border-[#023B22]/10">
                      <div 
                        className="h-full bg-[#023B22] transition-all duration-100"
                        style={{ width: `${Math.min(100, loadingPercent)}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-bold mt-2 uppercase text-[#023B22]/60">
                      {loadingPercent >= 100 ? 'INITIALIZING COCKPIT...' : `ALLOCATING BUFFER FILES... ${Math.min(100, loadingPercent)}%`}
                    </div>

                    <div className="h-10 flex items-center justify-center max-w-sm mt-6">
                      <p className="text-[9px] uppercase tracking-wider text-[#023B22]/70">
                        {loadingFacts[factsIndex]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimalist Floating END SIMULATION button in bottom-left */}
            {!unityLoading && (
              <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
                <button
                  onClick={handleEndSimulation}
                  className="px-5 py-3 bg-[#023B22] hover:bg-[#034d2d] text-white font-bold text-[10px] tracking-widest uppercase rounded shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  END SIMULATION
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
