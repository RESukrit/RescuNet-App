import React, { useEffect, useState, useRef } from 'react';
import { 
  SunMedium, 
  X, 
  Zap, 
  Radio, 
  Volume2, 
  VolumeX, 
  Flashlight, 
  Flame, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export type StrobeMode = 'rapid' | 'sos' | 'torch' | 'red_pulse';

interface EmergencyStrobeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: StrobeMode;
}

export const EmergencyStrobeOverlay: React.FC<EmergencyStrobeOverlayProps> = ({
  isOpen,
  onClose,
  initialMode = 'rapid',
}) => {
  const [mode, setMode] = useState<StrobeMode>(initialMode);
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  const [currentColor, setCurrentColor] = useState<string>('#ffffff');
  const [audioSync, setAudioSync] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);

  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Keep screen awake while strobe is active
  useEffect(() => {
    if (!isOpen) return;

    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        (navigator as any).wakeLock.request('screen').then((lock: any) => {
          wakeLockRef.current = lock;
        }).catch(() => {});
      } catch {}
    }

    return () => {
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
        wakeLockRef.current = null;
      }
    };
  }, [isOpen]);

  // Attempt Hardware Camera Torch Access (if available on device)
  useEffect(() => {
    if (!isOpen) {
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
        } catch {}
        videoTrackRef.current = null;
      }
      setTorchActive(false);
      return;
    }

    // Check for torch capability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'environment' },
        })
        .then((stream) => {
          const track = stream.getVideoTracks()[0];
          if (track) {
            videoTrackRef.current = track;
            const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
              // Enable physical torch
              track.applyConstraints({
                advanced: [{ torch: true } as any],
              }).then(() => {
                setTorchActive(true);
              }).catch(() => {});
            }
          }
        })
        .catch(() => {
          // Camera permission denied or not available - screen strobe continues uninterrupted!
          setTorchSupported(false);
        });
    }

    return () => {
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.stop();
        } catch {}
        videoTrackRef.current = null;
      }
    };
  }, [isOpen]);

  // Sync Hardware Torch with Strobe state if enabled
  const toggleHardwareTorch = (on: boolean) => {
    if (videoTrackRef.current && torchSupported) {
      try {
        videoTrackRef.current.applyConstraints({
          advanced: [{ torch: on } as any],
        }).catch(() => {});
      } catch {}
    }
  };

  // Keyboard shortcut listener (Escape or Space to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Optical Strobe Flash Timing Loop
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let isMounted = true;

    // Helper beep tone generator
    const playShortBeep = () => {
      if (!audioSync) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch {}
    };

    if (mode === 'torch') {
      // Constant 100% full bright white screen
      setIsLightOn(true);
      setCurrentColor('#ffffff');
      toggleHardwareTorch(true);
      return;
    }

    if (mode === 'rapid') {
      // High-visibility ~7Hz optical strobe (80ms on, 80ms off)
      let state = true;
      const interval = setInterval(() => {
        if (!isMounted) return;
        state = !state;
        setIsLightOn(state);
        setCurrentColor('#ffffff');
        toggleHardwareTorch(state);
        if (state) playShortBeep();
      }, 85);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    if (mode === 'red_pulse') {
      // Tactical Emergency Red / White Alternating Beacon
      let step = 0;
      const colors = ['#ef4444', '#000000', '#ffffff', '#000000', '#3b82f6', '#000000'];
      const interval = setInterval(() => {
        if (!isMounted) return;
        step = (step + 1) % colors.length;
        const col = colors[step];
        setCurrentColor(col);
        setIsLightOn(col !== '#000000');
        toggleHardwareTorch(col !== '#000000');
        if (col !== '#000000') playShortBeep();
      }, 120);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    if (mode === 'sos') {
      // International SOS Morse Pattern: ... --- ... (3 short, 3 long, 3 short)
      // timings in ms: [dot: 150, gap: 150, dash: 450, gap: 150, wordGap: 900]
      const pattern: { on: boolean; duration: number }[] = [
        // S (...)
        { on: true, duration: 150 },
        { on: false, duration: 150 },
        { on: true, duration: 150 },
        { on: false, duration: 150 },
        { on: true, duration: 150 },
        { on: false, duration: 400 },
        // O (---)
        { on: true, duration: 450 },
        { on: false, duration: 150 },
        { on: true, duration: 450 },
        { on: false, duration: 150 },
        { on: true, duration: 450 },
        { on: false, duration: 400 },
        // S (...)
        { on: true, duration: 150 },
        { on: false, duration: 150 },
        { on: true, duration: 150 },
        { on: false, duration: 150 },
        { on: true, duration: 150 },
        { on: false, duration: 1200 }, // pause before repeating
      ];

      let stepIndex = 0;
      const runStep = () => {
        if (!isMounted) return;
        const current = pattern[stepIndex];
        setIsLightOn(current.on);
        setCurrentColor('#ffffff');
        toggleHardwareTorch(current.on);
        if (current.on) playShortBeep();

        stepIndex = (stepIndex + 1) % pattern.length;
        timerRef.current = setTimeout(runStep, current.duration);
      };

      runStep();

      return () => {
        isMounted = false;
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isOpen, mode, audioSync]);

  if (!isOpen) return null;

  // Background styling calculation
  const backgroundColor = isLightOn ? currentColor : '#000000';

  return (
    <div
      id="rescunet-strobe-overlay"
      className="fixed inset-0 z-[99999] flex flex-col justify-between p-4 sm:p-6 transition-none select-none cursor-pointer"
      style={{
        backgroundColor: backgroundColor,
        color: isLightOn && currentColor !== '#000000' ? '#000000' : '#ffffff',
      }}
      onClick={(e) => {
        // Clicking outside control bars will close strobe
        if ((e.target as HTMLElement).closest('.strobe-controls')) return;
        onClose();
      }}
    >
      {/* Top Banner */}
      <div className="strobe-controls flex items-center justify-between pointer-events-auto bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white max-w-xl mx-auto w-full shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5 text-amber-400">
              <span>Emergency Rescue Beacon</span>
              {torchActive && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  LED Torch ON
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300">
              Tap screen or press ESC to turn off
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg"
        >
          <X className="w-4 h-4" />
          <span>STOP</span>
        </button>
      </div>

      {/* Center Prompt */}
      <div className="text-center pointer-events-none space-y-2">
        <div 
          className="inline-block px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          🚨 FLASHING RESCUE SIGNAL ACTIVE 🚨
        </div>
        <p 
          className="text-xs font-bold"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
            color: '#ffffff',
          }}
        >
          Hold screen up toward rescuers, aircraft, or search teams
        </p>
      </div>

      {/* Bottom Mode Switcher Controls */}
      <div className="strobe-controls pointer-events-auto bg-black/85 backdrop-blur-lg p-3 rounded-2xl border border-white/20 text-white max-w-xl mx-auto w-full shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
          <span className="font-bold text-slate-200">SIGNAL PATTERN:</span>
          <button
            onClick={() => setAudioSync(!audioSync)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors text-[11px] font-bold ${
              audioSync ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {audioSync ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioSync ? 'Audio Beep ON' : 'Audio Beep OFF'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          <button
            onClick={() => setMode('rapid')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'rapid'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-white shadow-lg'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Fast Strobe</span>
          </button>

          <button
            onClick={() => setMode('sos')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'sos'
                ? 'bg-red-600 text-white ring-2 ring-white shadow-lg'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>SOS Morse</span>
          </button>

          <button
            onClick={() => setMode('torch')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'torch'
                ? 'bg-white text-slate-950 ring-2 ring-amber-400 shadow-lg'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <SunMedium className="w-4 h-4" />
            <span>Max Torch</span>
          </button>

          <button
            onClick={() => setMode('red_pulse')}
            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'red_pulse'
                ? 'bg-blue-600 text-white ring-2 ring-white shadow-lg'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Multi-Beacon</span>
          </button>
        </div>
      </div>
    </div>
  );
};
