'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Play, Star, Globe, Search, Download, 
  Terminal, ShieldCheck, ArrowLeft, RefreshCw, AlertTriangle
} from 'lucide-react';

interface FeedbackLog {
  id: string;
  nickname: string;
  country: string;
  rating: number;
  suggestions: string;
  bugReport: string;
  favoriteFeature: string;
  timestamp: string;
}

interface AnalyticsData {
  totalVisitors: number;
  playCount: number;
  avgRating: number;
  totalFeedbackCount: number;
  countryDistribution: { country: string; count: number }[];
  recentFeedback: FeedbackLog[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showBugsOnly, setShowBugsOnly] = useState(false);

  // Fetch telemetry analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to query admin telemetry data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // CSV Generator and downloader
  const exportToCSV = () => {
    if (!data || !data.recentFeedback.length) return;

    const headers = ['ID', 'Nickname', 'Country', 'Rating', 'Suggestions', 'Bug Report', 'Favorite Feature', 'Timestamp'];
    const rows = data.recentFeedback.map((fb) => [
      fb.id,
      fb.nickname,
      fb.country,
      fb.rating,
      fb.suggestions.replace(/"/g, '""'), // escape quotes
      fb.bugReport.replace(/"/g, '""'),
      fb.favoriteFeature.replace(/"/g, '""'),
      fb.timestamp,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `velocity_telemetry_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search
  const filteredFeedback = data
    ? data.recentFeedback.filter((fb) => {
        const matchesSearch = 
          fb.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fb.suggestions.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fb.favoriteFeature.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fb.country.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRating = filterRating === 'all' || fb.rating === filterRating;
        const matchesBugs = !showBugsOnly || !!fb.bugReport.trim();

        return matchesSearch && matchesRating && matchesBugs;
      })
    : [];

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center font-mono scanlines">
        <RefreshCw className="w-10 h-10 text-[#00f0ff] animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest text-[#00f0ff]">Querying Admin Databases...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-mono p-6 md:p-12 scanlines selection:bg-[#00f0ff]/30 selection:text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00f0ff]/20 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-[#00f0ff] animate-pulse" />
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                VELOCITY ADMIN HUB
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                Central Telemetry Command & Analytics Terminal
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchAnalytics}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded border border-white/10 bg-black/60 hover:bg-[#00f0ff]/10 text-xs font-bold uppercase transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>SYNC DATA</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded border border-[#ff0055] bg-[#ff0055]/10 hover:bg-[#ff0055]/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,85,0.2)]"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Visitors */}
          <div className="glassmorphism p-5 rounded border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">TOTAL PILOTS</span>
              <span className="text-2xl font-bold italic text-[#00f0ff]">
                {data?.totalVisitors || 0}
              </span>
            </div>
            <Users className="w-7 h-7 text-[#00f0ff]/50" />
          </div>

          {/* Card 2: Play Count */}
          <div className="glassmorphism p-5 rounded border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">GAME PLAYS</span>
              <span className="text-2xl font-bold italic text-[#ff0055]">
                {data?.playCount || 0}
              </span>
            </div>
            <Play className="w-7 h-7 text-[#ff0055]/50 fill-[#ff0055]/10" />
          </div>

          {/* Card 3: Average Rating */}
          <div className="glassmorphism p-5 rounded border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">AVERAGE RATING</span>
              <span className="text-2xl font-bold italic text-yellow-400">
                {data?.avgRating || 0.0} / 5.0
              </span>
            </div>
            <Star className="w-7 h-7 text-yellow-400/50 fill-yellow-400/10" />
          </div>

          {/* Card 4: Feedback submissions */}
          <div className="glassmorphism p-5 rounded border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">REPORTS FILED</span>
              <span className="text-2xl font-bold italic text-emerald-400">
                {data?.totalFeedbackCount || 0}
              </span>
            </div>
            <ShieldCheck className="w-7 h-7 text-emerald-400/50" />
          </div>

        </div>

        {/* GRAPHS SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Country Distribution custom visual SVG Bar Graph */}
          <div className="glassmorphism p-6 rounded border-white/10 flex flex-col lg:col-span-1 gap-4">
            <div className="flex items-center gap-2 text-sm font-bold border-b border-white/10 pb-2 uppercase tracking-wide">
              <Globe className="w-4 h-4 text-[#00f0ff]" />
              <span>PILOT LOCATIONS</span>
            </div>

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-2 no-scrollbar">
              {data && data.countryDistribution.length > 0 ? (
                data.countryDistribution.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-bold text-white/80">
                      <span>{item.country.toUpperCase()}</span>
                      <span>{item.count}</span>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="w-full bg-white/5 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#00f0ff] to-blue-500 h-full rounded"
                        style={{ 
                          width: `${(item.count / Math.max(...data.countryDistribution.map(d => d.count))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-white/30 text-center py-10">NO LOCATIONS REPORTED</div>
              )}
            </div>
          </div>

          {/* Right panel: Feedback records log search */}
          <div className="glassmorphism p-6 rounded border-white/10 lg:col-span-2 flex flex-col gap-4">
            
            {/* Log controls panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
              <div className="text-sm font-bold uppercase tracking-wide">
                PILOT FEEDBACK REGISTRY
              </div>

              {/* Filters grid */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                {/* Rating filter */}
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                  className="bg-black/50 border border-white/15 px-2 py-1 focus:outline-none rounded text-white"
                >
                  <option value="all">ALL RATINGS</option>
                  <option value="5">5 STARS</option>
                  <option value="4">4 STARS</option>
                  <option value="3">3 STARS</option>
                  <option value="2">2 STARS</option>
                  <option value="1">1 STAR</option>
                </select>

                {/* Bug checklist filter */}
                <label className="flex items-center gap-1.5 border border-white/15 bg-black/50 px-2 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBugsOnly}
                    onChange={(e) => setShowBugsOnly(e.target.checked)}
                    className="accent-[#ff0055]"
                  />
                  <span>BUGS ONLY</span>
                </label>
              </div>
            </div>

            {/* Search Input bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by pilot nickname, tags, features, bugs..."
                className="w-full bg-black/40 border border-white/10 focus:border-[#00f0ff] focus:outline-none rounded py-2.5 pl-10 pr-4 text-xs placeholder-white/20"
              />
            </div>

            {/* Logs list */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-96 pr-2 no-scrollbar">
              {filteredFeedback.length > 0 ? (
                filteredFeedback.map((fb) => (
                  <div key={fb.id} className="p-4 rounded border border-white/5 bg-black/30 hover:border-white/15 transition-all text-xs flex flex-col gap-2">
                    
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/50 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-black uppercase text-xs">{fb.nickname}</span>
                        <span>({fb.country})</span>
                      </div>
                      
                      {/* Rating star counts */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < fb.rating ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-white/20 fill-transparent'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content logs detail */}
                    <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-[#00f0ff] font-bold">FAVOURITE:</span> {fb.favoriteFeature}
                      </div>
                      <div className="text-white/80">
                        <span className="text-emerald-400 font-bold">FEEDBACK:</span> {fb.suggestions}
                      </div>
                      {fb.bugReport.trim() && (
                        <div className="border border-[#ff0055]/30 bg-[#ff0055]/5 p-2 rounded flex items-start gap-2 mt-1">
                          <AlertTriangle className="w-4 h-4 text-[#ff0055] shrink-0 mt-0.5" />
                          <div className="text-[10px] text-white/95">
                            <span className="text-[#ff0055] font-black">BUG:</span> {fb.bugReport}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date stamp */}
                    <div className="text-[9px] text-white/30 text-right mt-1">
                      FILED ON: {new Date(fb.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-white/30 text-center py-10">NO MATCHING ENTRIES IN REGISTER</div>
              )}
            </div>

          </div>

        </div>

        {/* Back Link */}
        <div className="mt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to cockpit</span>
          </a>
        </div>

      </div>
    </div>
  );
}
