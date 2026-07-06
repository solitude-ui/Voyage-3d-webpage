'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import profileData from '../../../content/profile.json';
import timelineData from '../../../content/timeline.json';
import { Github, Linkedin, Mail, FileText, X, User } from 'lucide-react';
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
    loginSubmitted,
    selectedCar,
    setSelectedCar,
    profile,
  } = useGameStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      useGameStore.setState({ profile: null, loginSubmitted: false });
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
        <h1 
          className="text-2xl md:text-5xl tracking-[0.2em] font-light text-[#023B22] uppercase"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          VOYAGE
        </h1>
        <p className="text-[7.5px] md:text-[9px] uppercase tracking-[0.3em] text-[#023B22]/70 font-mono mt-1">
          Car Traffic Simulator
        </p>
      </div>

      {/* TOP RIGHT PROFILE (PERSISTENT) */}
      <div
        className="absolute top-8 right-4 md:right-8 pointer-events-auto flex items-center gap-3 cursor-pointer"
        onClick={() => setProfileDrawerOpen(true)}
      >
        <div className="text-right hidden md:block">
          <div className="text-xs font-semibold text-[#023B22] tracking-wider uppercase">Adil Niham</div>
          <div className="text-[9px] text-[#023B22]/60 uppercase tracking-widest font-mono">Lead Programmer</div>
        </div>
        <ProfileAvatar size="sm" />
      </div>

      {/* SCORE BOARD: TOP LEFT / MOBILE TOP ROW (Fades out when car starts driving) */}
      <AnimatePresence>
        {isAtStart && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute top-24 left-4 right-4 md:top-8 md:left-8 md:right-auto pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-3 md:p-4 rounded-lg shadow-sm w-[calc(100vw-32px)] md:w-48 flex flex-col gap-3 text-[#023B22]"
          >
            {/* Logged in User Indicator & Logout */}
            {profile && (
              <div className="text-[8px] text-[#023B22]/70 font-mono font-bold tracking-wider border-b border-[#023B22]/10 pb-1.5 mb-0.5 flex justify-between items-center w-full">
                <span>PILOT: {profile.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-700 hover:text-red-950 font-bold uppercase cursor-pointer hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
            <div className="flex flex-row md:flex-col gap-3 justify-around md:justify-start w-full">
              <div className="text-center md:text-left">
                <div className="text-[7.5px] md:text-[8px] text-[#023B22]/55 uppercase tracking-widest font-mono mb-0.5 md:mb-1">Current Score</div>
                <div className="text-lg md:text-xl font-light tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {unityStats.score}
                </div>
              </div>
              <div className="border-l md:border-l-0 md:border-t border-[#023B22]/10 pl-6 md:pl-0 md:pt-3 text-center md:text-left">
                <div className="text-[7.5px] md:text-[8px] text-[#023B22]/55 uppercase tracking-widest font-mono mb-0.5 md:mb-1">Maximum Score</div>
                <div className="text-lg md:text-xl font-light tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
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
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-8 pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-5 rounded-lg shadow-sm w-48 flex flex-col gap-2.5 text-[#023B22]"
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

      {/* CAR SELECTOR: BOTTOM MIDDLE (Fades out when driving - Stacked on mobile) */}
      <AnimatePresence>
        {isAtStart && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute bottom-24 md:bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 pointer-events-auto bg-white/45 backdrop-blur-md border border-[#023B22]/10 p-3 md:p-4 rounded-lg shadow-sm flex items-center justify-between md:justify-start gap-2.5 md:gap-3.5 text-[#023B22] font-mono text-[8.5px] md:text-[10px] uppercase tracking-widest whitespace-nowrap w-[calc(100vw-32px)] md:w-auto"
          >
            <span className="text-[7.5px] md:text-[8.5px] text-[#023B22]/60 font-bold mr-1">VEHICLE:</span>
            {[
              { id: 'challenger', label: 'DODGE CHALLENGER' },
              { id: 'suv', label: 'SUV' },
            ].map((car) => {
              const active = selectedCar === car.id;
              return (
                <button
                  key={car.id}
                  onClick={() => setSelectedCar(car.id as 'suv' | 'challenger')}
                  className={`px-3.5 py-2 md:px-4.5 md:py-2.5 rounded text-[8.5px] md:text-[9.5px] font-bold tracking-widest cursor-pointer transition-all ${
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

      {/* FLOATING PLAY BUTTON (BOTTOM-LEFT, PERSISTENT - FULL WIDTH ON MOBILE) */}
      <div className="absolute bottom-8 left-4 right-4 md:left-8 md:right-auto md:bottom-8 pointer-events-auto w-[calc(100vw-32px)] md:w-auto">
        <button
          onClick={handlePlayClick}
          className="flex items-center justify-center gap-2.5 w-full md:w-auto px-6 py-3.5 rounded bg-white/80 hover:bg-white text-[#023B22] font-semibold text-xs tracking-widest uppercase border border-[#023B22]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
              className="w-full max-w-sm h-full bg-[#E2ECF5]/95 border-l border-white/20 p-8 flex flex-col justify-between text-[#023B22] font-mono shadow-2xl relative"
            >
              <button
                onClick={() => setProfileDrawerOpen(false)}
                className="absolute top-6 right-6 text-[#023B22]/50 hover:text-[#023B22]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-6 mt-12">
                <div className="flex items-center gap-4">
                  <ProfileAvatar size="lg" />
                  <div>
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Adil Niham</h2>
                    <span className="text-[10px] text-[#023B22]/60 uppercase tracking-widest">3D Gameplay Architect</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-sans text-[#023B22]/80 mt-4 border-t border-[#023B22]/10 pt-4">
                  {profileData.bio}
                </p>

                <div className="flex flex-col gap-3 mt-6">
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
                className="flex items-center justify-center gap-2 py-4 w-full bg-[#023B22] hover:bg-[#034d2d] text-white font-bold text-xs tracking-widest uppercase rounded shadow-sm transition-all"
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
