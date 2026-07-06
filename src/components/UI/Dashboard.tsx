'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import profileData from '../../../content/profile.json';
import timelineData from '../../../content/timeline.json';
import { Github, Linkedin, Mail, FileText, X, User, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileAvatar = ({ size }: { size: 'sm' | 'lg' }) => {
  const isLarge = size === 'lg';
  const wrapperClass = isLarge
    ? 'w-16 h-16 rounded-full border-2 border-[#023B22]/30 bg-white/70 flex items-center justify-center text-[#023B22] overflow-hidden'
    : 'w-10 h-10 rounded-full border border-[#023B22]/20 bg-white/60 flex items-center justify-center text-[#023B22] overflow-hidden shadow-sm';
  const iconClass = isLarge ? 'w-8 h-8' : 'w-5 h-5';

  return (
    <div className={wrapperClass}>
      {profileData.avatarUrl ? (
        <img
          src={profileData.avatarUrl}
          alt={`${profileData.name} profile photo`}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={iconClass} />
      )}
    </div>
  );
};

export default function Dashboard() {
  const {
    scrollProgress,
    activeCheckpointIndex,
    setActiveCheckpointIndex,
    setUnityLoading,
    setUnityPlaying,
    unityPlaying,
    loginSubmitted,
    selectedCar,
    setSelectedCar,
    profile,
    profileDrawerOpen,
    setProfileDrawerOpen,
    isPaused,
    setIsPaused,
  } = useGameStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      useGameStore.setState({ profile: null, loginSubmitted: false, feedbackSubmitted: false });
      localStorage.removeItem('voyage_feedback_submitted');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with window changes (e.g. if exited via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  const unityStats = useGameStore((s) => s.unityStats);
  const [highScore, setHighScore] = useState(0);

  // Load high score on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('voyage_highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Update high score if current score exceeds it
  useEffect(() => {
    if (unityStats.score > highScore) {
      setHighScore(unityStats.score);
      localStorage.setItem('voyage_highscore', unityStats.score.toString());
    }
  }, [unityStats.score, highScore]);

  // Sync active checkpoint index
  useEffect(() => {
    const progressInCycle = scrollProgress % 1.0;
    let activeIdx = 0;
    for (let i = 0; i < timelineData.length; i++) {
      if (progressInCycle >= timelineData[i].progress) {
        activeIdx = i;
      }
    }
    if (activeIdx !== activeCheckpointIndex) {
      setActiveCheckpointIndex(activeIdx);
    }
  }, [scrollProgress, activeCheckpointIndex, setActiveCheckpointIndex]);

  const handlePlayClick = () => {
    if (!loginSubmitted) {
      setUnityPlaying(true);
      setUnityLoading(true);
    } else {
      setUnityPlaying(true);
      setUnityLoading(false);
    }
  };

  const isAtStart = scrollProgress <= 0.07;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-30 font-sans">
      
      {/* PERSISTENT HEADER: TOP CENTER "VOYAGE" */}
      <div className="absolute top-3 lg:top-8 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
        <h1 
          className="text-lg lg:text-5xl tracking-[0.2em] font-light text-[#023B22] uppercase"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          VOYAGE
        </h1>
        <p className="text-[6px] lg:text-[9px] uppercase tracking-[0.3em] text-[#023B22]/70 font-mono mt-0.5">
          Car Traffic Simulator
        </p>
      </div>

      {/* TOP RIGHT CONTROLS: FULLSCREEN & PROFILE */}
      <div className="absolute top-3 lg:top-8 right-3 lg:right-8 pointer-events-auto flex items-center gap-2.5">
        {/* Pause / Play Button */}
        {!unityPlaying && (
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full bg-white/40 hover:bg-white text-[#023B22] border border-[#023B22]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            title={isPaused ? "Resume Driving" : "Pause Driving"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <Pause className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/40 hover:bg-white text-[#023B22] border border-[#023B22]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <Maximize2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
        </button>

        {/* Profile Card */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setProfileDrawerOpen(true)}
        >
          <div className="text-right hidden lg:block">
            <div className="text-xs font-semibold text-[#023B22] tracking-wider uppercase">Adil Niham</div>
            <div className="text-[9px] text-[#023B22]/60 uppercase tracking-widest font-mono">Lead Programmer</div>
          </div>
          <ProfileAvatar size="sm" />
        </div>
      </div>

      {/* SCORE BOARD: TOP LEFT / MOBILE TOP ROW (Fades out when car starts driving) */}
      <AnimatePresence>
        {isAtStart && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute top-3 left-3 right-auto lg:top-8 lg:left-8 pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-2 lg:p-4 rounded shadow-sm w-36 lg:w-48 flex flex-col gap-2 lg:gap-3 text-[#023B22]"
          >
            {/* Logged in User Indicator & Logout */}
            {profile && (
              <div className="text-[7px] lg:text-[8px] text-[#023B22]/70 font-mono font-bold tracking-wider border-b border-[#023B22]/10 pb-1 lg:pb-1.5 mb-0.5 flex justify-between items-center w-full">
                <span>PILOT: {profile.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-700 hover:text-red-950 font-bold uppercase cursor-pointer hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
            <div className="flex flex-col gap-1.5 lg:gap-3 w-full">
              <div className="text-left">
                <div className="text-[7px] lg:text-[8px] text-[#023B22]/55 uppercase tracking-widest font-mono mb-0.5 lg:mb-1">Current Score</div>
                <div className="text-sm lg:text-xl font-light tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {unityStats.score}
                </div>
              </div>
              <div className="border-t border-[#023B22]/10 pt-1.5 lg:pt-3 text-left">
                <div className="text-[7px] lg:text-[8px] text-[#023B22]/55 uppercase tracking-widest font-mono mb-0.5 lg:mb-1">Maximum Score</div>
                <div className="text-sm lg:text-xl font-light tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {highScore}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION INSTRUCTIONS: MIDDLE RIGHT (Fades out when car starts driving - Hidden on mobile) */}
      <AnimatePresence>
        {isAtStart && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 25 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-8 pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-5 rounded-lg shadow-sm w-48 flex flex-col gap-2.5 text-[#023B22]"
          >
            <div>
              <div className="text-[8px] text-[#023B22]/55 uppercase tracking-widest font-mono mb-1">Navigation</div>
              <h3 className="text-sm font-bold tracking-wide uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                Drive Simulator
              </h3>
            </div>
            <div className="border-t border-[#023B22]/10 pt-2.5 flex flex-col gap-2 text-[9px] leading-relaxed uppercase tracking-wider font-mono text-[#023B22]/85">
              <p>• Use <span className="font-bold">Scroll / Swipe</span> to accelerate.</p>
              <p>• Use <span className="font-bold">W / S</span> or <span className="font-bold">Arrow Keys</span> to drive.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAR SELECTOR: BOTTOM RIGHT (Fades out when driving) */}
      <AnimatePresence>
        {isAtStart && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute bottom-3 right-3 left-auto lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-1.5 lg:p-4 rounded shadow-sm flex items-center gap-2 text-[#023B22] font-mono text-[7.5px] lg:text-[10px] uppercase tracking-widest whitespace-nowrap w-auto"
          >
            <span className="text-[7px] lg:text-[8.5px] text-[#023B22]/60 font-bold mr-1">VEHICLE:</span>
            {[
              { id: 'challenger', label: 'DODGE CHALLENGER' },
              { id: 'suv', label: 'SUV' },
            ].map((car) => {
              const active = selectedCar === car.id;
              return (
                <button
                  type="button"
                  key={car.id}
                  onClick={() => setSelectedCar(car.id as 'suv' | 'challenger')}
                  className={`px-2.5 py-1.5 lg:px-4.5 lg:py-2.5 rounded text-[7.5px] lg:text-[9.5px] font-bold tracking-widest cursor-pointer transition-all ${
                    active 
                      ? 'bg-[#023B22] text-white shadow-sm font-black' 
                      : 'bg-white/40 hover:bg-white/60 text-[#023B22]/70 hover:text-[#023B22]'
                  }`}
                >
                  {car.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING PLAY BUTTON (BOTTOM-LEFT, PERSISTENT) */}
      <div className="absolute bottom-3 left-3 right-auto lg:left-8 lg:bottom-8 pointer-events-auto w-auto">
        <button
          onClick={handlePlayClick}
          className="flex items-center justify-center gap-2 w-auto px-4 py-2 rounded bg-white/85 hover:bg-white text-[#023B22] font-semibold text-[8px] lg:text-xs tracking-widest uppercase border border-[#023B22]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>START GAME</span>
        </button>
      </div>

      {/* ADIL NIHAM PROFILE POPUP DRAWER */}
      <AnimatePresence>
        {profileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 pointer-events-auto flex justify-end"
          >
            <div className="absolute inset-0 -z-10" onClick={() => setProfileDrawerOpen(false)} />

            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-sm h-full bg-[#E2ECF5]/95 border-l border-white/20 p-5 lg:p-8 flex flex-col justify-between text-[#023B22] font-mono shadow-2xl relative"
            >
              <button
                onClick={() => setProfileDrawerOpen(false)}
                className="absolute top-4 right-4 lg:top-6 lg:right-6 text-[#023B22]/50 hover:text-[#023B22] z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto pr-2 mt-8 mb-4 lg:mt-12 lg:mb-6 flex flex-col gap-5 lg:gap-6 scrollbar-thin">
                <div className="flex items-center gap-4">
                  <ProfileAvatar size="lg" />
                  <div>
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Adil Niham</h2>
                    <span className="text-[10px] text-[#023B22]/60 uppercase tracking-widest">3D Gameplay Architect</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-sans text-[#023B22]/80 border-t border-[#023B22]/10 pt-4">
                  {profileData.bio}
                </p>

                <div className="flex flex-col gap-3">
                  <a
                    href={profileData.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-xs text-[#023B22]/70 hover:text-[#023B22] transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub Profile</span>
                  </a>
                  <a
                    href={profileData.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-xs text-[#023B22]/70 hover:text-[#023B22] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn Profile</span>
                  </a>
                  <a
                    href={`mailto:${profileData.email}`}
                    className="flex items-center gap-3 text-xs text-[#023B22]/70 hover:text-[#023B22] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{profileData.email}</span>
                  </a>
                </div>
              </div>

              <a
                href={profileData.resumeUrl}
                download
                className="flex items-center justify-center gap-2 py-3.5 lg:py-4 w-full bg-[#023B22] hover:bg-[#034d2d] text-white font-bold text-xs tracking-widest uppercase rounded shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>DOWNLOAD RESUME</span>
              </a>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
