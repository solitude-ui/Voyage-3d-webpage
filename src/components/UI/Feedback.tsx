'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../hooks/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Feedback({ 
  active, 
  onSubmittedComplete 
}: { 
  active: boolean; 
  onSubmittedComplete: () => void;
}) {
  const { profile, setFeedbackSubmitted } = useGameStore();

  const [rating, setRating] = useState(5);
  const [favoriteFeature, setFavoriteFeature] = useState(''); // experience
  const [bugReport, setBugReport] = useState(''); // negatives
  const [suggestions, setSuggestions] = useState(''); // improvements
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!favoriteFeature.trim() || !bugReport.trim() || !suggestions.trim()) {
      setErrorMsg('All review parameters are mandatory.');
      setLoading(false);
      return;
    }

    const payload = {
      nickname: profile?.name || 'Anonymous',
      country: 'N/A',
      rating,
      suggestions: suggestions.trim(),
      bugReport: bugReport.trim(),
      favoriteFeature: favoriteFeature.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setFeedbackSubmitted(true);
        
        setTimeout(() => {
          onSubmittedComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setErrorMsg('Transmission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 font-mono select-none"
        >
          <div className="w-full max-w-md bg-[#E2ECF5]/95 border border-[#023B22]/20 p-6 rounded-lg shadow-2xl relative text-[#023B22]">
            
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="border-b border-[#023B22]/10 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                      MANDATORY PILOT REVIEW
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest text-[#023B22]/60 mt-1">
                      File simulation telemetry review to close virtual cockpit connection
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <label className="text-[8px] text-[#023B22]/60 tracking-wider">OVERALL SIMULATOR RATING</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            className={`w-8 h-8 transition-all ${
                              star <= rating 
                                ? 'fill-yellow-500 stroke-yellow-500 drop-shadow-sm' 
                                : 'stroke-[#023B22]/30 fill-transparent'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question 1: Experience */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#023B22] font-bold uppercase tracking-wider">
                      1. HOW IS THE EXPERIENCE?
                    </label>
                    <input
                      type="text"
                      required
                      value={favoriteFeature}
                      onChange={(e) => setFavoriteFeature(e.target.value)}
                      placeholder="Describe your gameplay experience..."
                      className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-2 px-3 placeholder-[#023B22]/20 font-bold"
                    />
                  </div>

                  {/* Question 2: Negatives */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#023B22] font-bold uppercase tracking-wider">
                      2. WHAT ARE THE NEGATIVES?
                    </label>
                    <input
                      type="text"
                      required
                      value={bugReport}
                      onChange={(e) => setBugReport(e.target.value)}
                      placeholder="List any bugs, issues, or negatives..."
                      className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-2 px-3 placeholder-[#023B22]/20 font-bold"
                    />
                  </div>

                  {/* Question 3: Improvements */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[#023B22] font-bold uppercase tracking-wider">
                      3. GIVE IDEA ABOUT IMPROVEMENTS
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      placeholder="Suggestions to improve the game..."
                      className="w-full bg-white/70 border border-[#023B22]/10 focus:border-[#023B22]/45 focus:outline-none rounded py-2 px-3 placeholder-[#023B22]/20 font-bold resize-none font-sans"
                    />
                  </div>

                  {/* Errors */}
                  {errorMsg && (
                    <div className="flex items-center gap-1 text-[9px] text-red-600 font-bold uppercase mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex items-center justify-center gap-2 py-3.5 bg-[#023B22] hover:bg-[#034d2d] text-white font-bold uppercase tracking-widest rounded shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'TRANSMITTING...' : 'SUBMIT REVIEW'}</span>
                  </button>

                </motion.form>
              ) : (
                /* Success screen */
                <motion.div
                  key="success"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-emerald-600 mb-4 animate-pulse" />
                  <h3 className="text-md font-bold uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                    REVIEW SUBMITTED
                  </h3>
                  <p className="text-[10px] text-[#023B22]/60 uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
                    Review logged successfully. Telemetry sequence completed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
