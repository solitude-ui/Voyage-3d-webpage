'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import achievementsData from '../../../content/achievements.json';

type UnitySessionResult = {
  score: number;
  completed: boolean;
  resultId: string;
};

type UnitySessionPayload = UnitySessionResult & {
  lessonId?: string;
};

declare global {
  interface Window {
    reportUnitySessionResult?: (payload: string) => void;
  }
}

const CURRENT_LESSON_ID = 'game-unlocked';
const CURRENT_LESSON_TITLE =
  achievementsData.find((achievement) => achievement.id === CURRENT_LESSON_ID)?.title ?? 'Unity Simulation';
const COMPLETED_LESSONS_STORAGE_KEY = 'voyage_completed_lessons';
const HIGH_SCORE_STORAGE_KEY = 'voyage_highscore';
const LAST_LESSON_SCORE_STORAGE_KEY = 'voyage_last_lesson_score';
const LOADING_FACTS = [
  "Initializing digital physics systems...",
  "Allocating canvas frame arrays...",
  "Entering virtual highway compilation...",
];

const toFiniteScore = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : null;
};

const buildUnityUrl = (baseUrl: string, lessonId: string) => {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('lessonId', lessonId);
  return `${url.pathname}${url.search}`;
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
  const payload = data as Record<string, unknown>;
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
  const [iframeSrc, setIframeSrc] = useState('/unity-game/index.html?lessonId=game-unlocked');
  const [latestResult, setLatestResult] = useState<UnitySessionResult | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const processedResultIdsRef = useRef<Set<string>>(new Set());
  const currentLessonId = CURRENT_LESSON_ID;
  const lessonTitle = CURRENT_LESSON_TITLE;

  const updateScore = useCallback((score: number, lessonTitle: string) => {
    setUnityStats({ score });
    localStorage.setItem(LAST_LESSON_SCORE_STORAGE_KEY, JSON.stringify({ lessonTitle, score }));

    const savedHighScore = Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) ?? 0);
    if (score > savedHighScore) {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, score.toString());
    }
  }, [setUnityStats]);

  const markLessonComplete = useCallback((lessonId: string, lessonTitle: string) => {
    const completedLessons = new Set<string>(
      JSON.parse(localStorage.getItem(COMPLETED_LESSONS_STORAGE_KEY) ?? '[]')
    );

    completedLessons.add(lessonId);
    localStorage.setItem(COMPLETED_LESSONS_STORAGE_KEY, JSON.stringify(Array.from(completedLessons)));
    localStorage.setItem(`${COMPLETED_LESSONS_STORAGE_KEY}_latest`, JSON.stringify({ lessonId, lessonTitle }));
  }, []);

  // Detect mobile and choose corresponding WebGL build on play start
  useEffect(() => {
    if (unityPlaying && typeof window !== 'undefined') {
      const timer = window.setTimeout(() => {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
        const unityPath = isMobile ? '/unity-game-mobile/index.html' : '/unity-game/index.html';
        setIframeSrc(buildUnityUrl(unityPath, currentLessonId));
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [unityPlaying, currentLessonId]);

  useEffect(() => {
    processedResultIdsRef.current.clear();
  }, [currentLessonId]);

  // Reset latestResult on new game session start
  useEffect(() => {
    if (unityPlaying) {
      const timer = window.setTimeout(() => setLatestResult(null), 0);
      return () => window.clearTimeout(timer);
    }
  }, [unityPlaying]);

  // Listen for load and score messages from inside the WebGL iframe
  useEffect(() => {
    const processSessionResult = (payload: string) => {
      let result: UnitySessionPayload;

      try {
        result = JSON.parse(payload);
      } catch {
        return;
      }

      if (result.lessonId !== currentLessonId) return;
      if (typeof result.resultId !== 'string' || !result.resultId) return;
      if (processedResultIdsRef.current.has(result.resultId)) return;

      const safeScore = toFiniteScore(result.score);
      if (safeScore === null) return;

      const safeResult: UnitySessionResult = {
        score: safeScore,
        completed: Boolean(result.completed),
        resultId: result.resultId,
      };

      processedResultIdsRef.current.add(safeResult.resultId);
      setLatestResult(safeResult);
      updateScore(safeScore, lessonTitle);

      if (safeResult.completed) {
        markLessonComplete(currentLessonId, lessonTitle);
      }
    };

    window.reportUnitySessionResult = processSessionResult;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

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

      if (
        event.data &&
        typeof event.data === 'object' &&
        (
          (event.data.source === 'unity-simulation' && event.data.type === 'session-result') ||
          event.data.type === 'unity-result'
        ) &&
        typeof event.data.payload === 'string'
      ) {
        processSessionResult(event.data.payload);
        return;
      }

      const score = parseUnityScore(event.data);
      if (score !== null) {
        setUnityStats({ score });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (window.reportUnitySessionResult === processSessionResult) {
        delete window.reportUnitySessionResult;
      }
    };
  }, [currentLessonId, lessonTitle, updateScore, markLessonComplete, setUnityStats, setUnityPlaying, setUnityLoading, resetGame]);

  // Intercept browser console logs to dynamically extract score details logged by Unity
  useEffect(() => {
    if (!unityPlaying) return;

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;

    type ConsoleMethod = (...args: unknown[]) => void;

    const interceptor = (originalFn: ConsoleMethod) => (...args: unknown[]) => {
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

  // Simulator compile progress sequence (crawls to 95% and waits for real WebGL load callback)
  useEffect(() => {
    if (!unityPlaying || !unityLoading || !loginSubmitted) return;
    
    const factInterval = setInterval(() => {
      setFactsIndex((prev) => (prev + 1) % LOADING_FACTS.length);
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
                        {LOADING_FACTS[factsIndex]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimalist Floating END SIMULATION button (Desktop only, styled to match mobile layout) */}
            {!unityLoading && (
              <div 
                className="absolute z-40 pointer-events-auto hidden lg:block"
                style={{
                  top: '300px',
                  left: '24px'
                }}
              >
                <button
                  onClick={handleEndSimulation}
                  className="w-[320px] h-[52px] flex items-center justify-center bg-[rgba(30,115,75,0.8)] hover:bg-[rgba(30,115,75,0.95)] text-white font-bold text-[15px] tracking-wider uppercase rounded-none border-none shadow-none transition-all active:scale-95 cursor-pointer font-sans"
                >
                  END SIMULATION
                </button>
              </div>
            )}

            {latestResult && latestResult.completed && !unityLoading && (
              <div className="absolute top-4 right-4 z-40 pointer-events-none bg-[#023B22]/90 backdrop-blur-md text-white border border-[#35c476]/30 shadow-[0_8px_32px_rgba(0,0,0,0.37)] rounded px-5 py-4 font-sans text-right min-w-[140px]">
                <div className="text-[10px] uppercase tracking-widest text-[#35c476] font-bold">{lessonTitle}</div>
                <div className="text-2xl font-black mt-1 text-white tracking-tight">{latestResult.score}</div>
                <div className="text-[9px] uppercase tracking-widest text-white/60 mt-1 font-semibold">
                  Simulation Completed
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
