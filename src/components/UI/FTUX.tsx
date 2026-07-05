'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, User, Mail, ShieldAlert } from 'lucide-react';

export default function FTUX() {
  const { 
    unityPlaying, 
    loginSubmitted, 
    setProfile, 
    setUnityLoading 
  } = useGameStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Hydrate login state on mount
  useEffect(() => {
    const saved = localStorage.getItem('voyage_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
      } catch (e) {}
    }
  }, [setProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email are compulsory parameters.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Save profile and lock login state
    setProfile({
      name: name.trim(),
      email: email.trim(),
    });

    // WebGL game starts loading in the background!
    setUnityLoading(true);
  };

  // Only show login drawer if play mode is started but they haven't logged in yet
  const showLogin = unityPlaying && !loginSubmitted;

  return (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 font-mono select-none"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-md bg-[#E2ECF5]/95 border border-white/30 p-8 rounded-lg shadow-2xl relative text-[#023B22]"
          >
            {/* Title */}
            <div className="flex items-center gap-2 border-b border-[#023B22]/10 pb-4 mb-6">
              <Terminal className="w-5 h-5 text-[#023B22] animate-pulse" />
              <h2 className="text-sm font-black tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                LOGIN FOR TELEMETRY
              </h2>
            </div>

            <p className="text-[11px] text-[#023B22]/70 mb-6 leading-relaxed uppercase tracking-wider">
              Establish pilot credentials. Entering your details will synchronize the simulator compile sequence in the background.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-[#023B22] font-bold tracking-widest uppercase">PILOT NAME</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#023B22]/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter pilot name..."
                    className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-3 pl-10 pr-4 text-[#023B22] placeholder-[#023B22]/30 font-bold"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-[#023B22] font-bold tracking-widest uppercase">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#023B22]/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-3 pl-10 pr-4 text-[#023B22] placeholder-[#023B22]/30 font-bold"
                  />
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold uppercase mt-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-[#023B22] hover:bg-[#034d2d] text-white font-bold uppercase tracking-widest rounded shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <span>Synchronize & Compile</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
