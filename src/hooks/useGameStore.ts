import { create } from 'zustand';

export type GraphicsQuality = 'low' | 'medium' | 'high';

interface UserProfile {
  name: string;
  email: string;
}

interface GameStats {
  distance: number;
  topSpeed: number;
  time: number;
  score: number;
}

interface GameState {
  // Pilot Details (Compulsory, one-time)
  profile: UserProfile | null;
  loginSubmitted: boolean;
  selectedCar: 'suv' | 'challenger' | 'block';
  
  // Game Play State
  scrollProgress: number; // 0 to 1
  targetProgress: number;
  scrollSpeed: number;
  activeCheckpointIndex: number;
  fadeActive: boolean; // Loop warp overlay toggle
  
  // Settings & Status
  musicPlaying: boolean;
  graphicsQuality: GraphicsQuality;
  fps: number;
  
  // Unity WebGL Emulator
  unityLoading: boolean;
  unityProgress: number;
  unityPlaying: boolean;
  unityStats: GameStats;
  
  // Feedback (Compulsory, one-time)
  feedbackSubmitted: boolean;
  feedbackOpen: boolean;
  
  profileDrawerOpen: boolean;
  setProfileDrawerOpen: (open: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;

  // Actions
  setProfile: (profile: UserProfile) => void;
  setLoginSubmitted: (submitted: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setTargetProgress: (progress: number) => void;
  setScrollSpeed: (speed: number) => void;
  setActiveCheckpointIndex: (index: number) => void;
  setFadeActive: (active: boolean) => void;
  setMusicPlaying: (playing: boolean) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setFps: (fps: number) => void;
  setUnityLoading: (loading: boolean) => void;
  setUnityProgress: (progress: number) => void;
  setUnityPlaying: (playing: boolean) => void;
  setUnityStats: (stats: Partial<GameStats>) => void;
  setFeedbackSubmitted: (submitted: boolean) => void;
  setFeedbackOpen: (open: boolean) => void;
  setSelectedCar: (car: 'suv' | 'challenger' | 'block') => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  profile: null,
  loginSubmitted: false,
  selectedCar: 'challenger',
  
  scrollProgress: 0,
  targetProgress: 0,
  scrollSpeed: 0,
  activeCheckpointIndex: 0,
  fadeActive: false,
  
  musicPlaying: false,
  graphicsQuality: 'high',
  fps: 60,
  
  unityLoading: false,
  unityProgress: 0,
  unityPlaying: false,
  unityStats: {
    distance: 0,
    topSpeed: 0,
    time: 0,
    score: 0,
  },
  
  feedbackSubmitted: false,
  feedbackOpen: false,
  profileDrawerOpen: false,
  setProfileDrawerOpen: (profileDrawerOpen) => set({ profileDrawerOpen }),
  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused }),

  setProfile: (profile) => {
    localStorage.setItem('voyage_profile', JSON.stringify(profile));
    set({ profile, loginSubmitted: true });
  },
  setSelectedCar: (selectedCar) => set({ selectedCar }),
  setLoginSubmitted: (loginSubmitted) => set({ loginSubmitted }),
  
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setTargetProgress: (targetProgress) => set({ targetProgress }),
  setScrollSpeed: (scrollSpeed) => set({ scrollSpeed }),
  setActiveCheckpointIndex: (activeCheckpointIndex) => set({ activeCheckpointIndex }),
  setFadeActive: (fadeActive) => set({ fadeActive }),
  
  setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setFps: (fps) => set({ fps }),
  
  setUnityLoading: (unityLoading) => set({ unityLoading }),
  setUnityProgress: (unityProgress) => set({ unityProgress }),
  setUnityPlaying: (unityPlaying) => set({ unityPlaying }),
  setUnityStats: (stats) => set((state) => ({
    unityStats: { ...state.unityStats, ...stats }
  })),
  setFeedbackSubmitted: (feedbackSubmitted) => {
    localStorage.setItem('voyage_feedback_submitted', feedbackSubmitted ? 'true' : 'false');
    set({ feedbackSubmitted });
  },
  setFeedbackOpen: (feedbackOpen) => set({ feedbackOpen }),
  
  resetGame: () => set({
    scrollProgress: 0,
    targetProgress: 0,
    scrollSpeed: 0,
    activeCheckpointIndex: 0,
    unityPlaying: false,
    unityLoading: false,
    unityProgress: 0,
  }),
}));
