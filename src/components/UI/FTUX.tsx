'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, User, Lock, ShieldAlert, X } from 'lucide-react';

export default function FTUX() {
  const { 
    unityPlaying, 
    setUnityPlaying,
    loginSubmitted, 
    setProfile, 
    setUnityLoading,
    setFeedbackSubmitted
  } = useGameStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check active server-side secure session cookie on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile({
            name: data.user.username,
            email: `${data.user.username}@voyage.com`, // Maintain profile shape compatibility
          });
          setFeedbackSubmitted(data.user.feedbackSubmitted);
        }
      })
      .catch((e) => console.error('Session check failed:', e));
  }, [setProfile, setFeedbackSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setErrorMsg('Username and password are required.');
      setIsLoading(false);
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Authentication failed.');
        setIsLoading(false);
        return;
      }

      // Sync game store profile
      setProfile({
        name: data.user.username,
        email: `${data.user.username}@voyage.com`,
      });
      setFeedbackSubmitted(data.user.feedbackSubmitted);

      // Start WebGL game loading sequence
      setUnityLoading(true);
    } catch (err) {
      setErrorMsg('Network error. Failed to reach auth gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only show auth drawer if play mode is clicked but user session is not loaded/active
  const showLogin = unityPlaying && !loginSubmitted;

  return (
    <AnimatePresence>
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-2 xs:p-4 font-mono"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-md bg-[#E2ECF5]/95 border border-white/30 p-4 xs:p-5 md:p-8 rounded-lg shadow-2xl relative text-[#023B22] max-h-[95vh] lg:max-h-[90vh] overflow-y-auto scrollbar-thin pr-3 pb-8"
          >
            {/* Exit/Back Button */}
            <button
              onClick={() => {
                setUnityPlaying(false);
                setUnityLoading(false);
              }}
              className="absolute top-4 right-4 text-[#023B22]/50 hover:text-[#023B22] cursor-pointer"
              type="button"
              title="Back to Portfolio"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Title */}
            <div className="flex items-center gap-1.5 border-b border-[#023B22]/10 pb-2 mb-3 lg:pb-4 lg:mb-6">
              <Terminal className="w-4 h-4 lg:w-5 lg:h-5 text-[#023B22] animate-pulse" />
              <h2 className="text-xs lg:text-sm font-black tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                {isRegisterMode ? 'CREATE PILOT ACCOUNT' : 'LOGIN FOR TELEMETRY'}
              </h2>
            </div>

            <p className="text-[8px] lg:text-[11px] text-[#023B22]/70 mb-3 lg:mb-6 leading-relaxed uppercase tracking-wider">
              {isRegisterMode 
                ? 'Register your custom credentials. Credentials will be securely stored in the database.'
                : 'Authenticate your pilot credentials. This will synchronize the simulator compile sequence in the background.'
              }
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 lg:gap-4 text-xs">
              
              {/* Username Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] lg:text-[9px] text-[#023B22] font-bold tracking-widest uppercase">USERNAME</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#023B22]/40" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-1.5 lg:py-2.5 pl-8 lg:pl-10 pr-3 lg:pr-4 text-[9px] lg:text-xs text-[#023B22] placeholder-[#023B22]/30 font-bold"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] lg:text-[9px] text-[#023B22] font-bold tracking-widest uppercase">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#023B22]/40" />
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-1.5 lg:py-2.5 pl-8 lg:pl-10 pr-3 lg:pr-4 text-[9px] lg:text-xs text-[#023B22] placeholder-[#023B22]/30 font-bold"
                  />
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="flex items-center gap-1 text-[9px] lg:text-[10px] text-red-600 font-bold uppercase mt-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 lg:py-3.5 bg-[#023B22] hover:bg-[#034d2d] text-white font-bold uppercase tracking-widest text-[9px] lg:text-xs rounded shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Processing...' : isRegisterMode ? 'Register Account' : 'Authenticate & Compile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Register Mode */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMsg('');
                }}
                className="text-[8px] lg:text-[9px] text-center text-[#023B22]/60 hover:text-[#023B22] uppercase tracking-wider font-bold mt-1 hover:underline cursor-pointer"
              >
                {isRegisterMode ? 'Already have credentials? Login' : 'First time? Create pilot account'}
              </button>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
