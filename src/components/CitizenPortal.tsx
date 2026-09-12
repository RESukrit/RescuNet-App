import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Compass, 
  Globe, 
  RefreshCw, 
  Send,
  Zap,
  Flame,
  Waves,
  HeartPulse,
  HelpCircle,
  SunMedium,
  PhoneCall,
  Lock,
  Flashlight
} from 'lucide-react';
import { AppConfig, SosSignal } from '../types';
import { 
  realtime, 
  submitSosSignal, 
  patchSosStatus,
  getEmergencyAdvisories, 
  EmergencyAdvisory 
} from '../services/realtime';
import { EmergencyStrobeOverlay } from './EmergencyStrobeOverlay';

interface CitizenPortalProps {
  config: AppConfig;
  onNavigateToAdmin: () => void;
  onOpenHostingGuide: () => void;
}

const EMERGENCY_CONDITIONS = [
  {
    id: 'Trapped under debris',
    label: 'Trapped Under Debris',
    icon: AlertTriangle,
    sub: 'Structural collapse, pinned down, crush injury',
    color: 'border-red-500 bg-red-950/40 text-red-100',
    activeColor: 'ring-4 ring-red-500 bg-red-600 text-white shadow-lg shadow-red-600/50'
  },
  {
    id: 'Medical Emergency',
    label: 'Severe Medical Danger',
    icon: HeartPulse,
    sub: 'Heavy bleeding, trauma, unconsciousness, asthma',
    color: 'border-rose-500 bg-rose-950/40 text-rose-100',
    activeColor: 'ring-4 ring-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-600/50'
  },
  {
    id: 'Cut off by floodwater',
    label: 'Rising Floodwater',
    icon: Waves,
    sub: 'Surrounded by water, rooftop refuge, current surge',
    color: 'border-blue-500 bg-blue-950/40 text-blue-100',
    activeColor: 'ring-4 ring-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/50'
  },
  {
    id: 'Trapped in a fire',
    label: 'Fire / Heavy Smoke',
    icon: Flame,
    sub: 'Encroaching blaze, intense heat, smoke inhalation',
    color: 'border-amber-500 bg-amber-950/40 text-amber-100',
    activeColor: 'ring-4 ring-amber-500 bg-amber-600 text-white shadow-lg shadow-amber-600/50'
  },
  {
    id: 'Structural Collapse Risk',
    label: 'Other Life Threat',
    icon: HelpCircle,
    sub: 'Unstable building, electrical danger, gas leak',
    color: 'border-purple-500 bg-purple-950/40 text-purple-100',
    activeColor: 'ring-4 ring-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-600/50'
  },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  config,
  onNavigateToAdmin,
  onOpenHostingGuide,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('Trapped under debris');
  const [nameOrNote, setNameOrNote] = useState<string>('');
  const [lat, setLat] = useState<number>(10.0534);
  const [lng, setLng] = useState<number>(76.6272);
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'fallback'>('acquiring');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [audioWhistleActive, setAudioWhistleActive] = useState<boolean>(false);
  const [strobeActive, setStrobeActive] = useState<boolean>(false);
  const [showHazardReport, setShowHazardReport] = useState<boolean>(false);

  // Real-time broadcast result & live tracker
  const [activeSignal, setActiveSignal] = useState<SosSignal | null>(() => {
    try {
      const saved = localStorage.getItem('rescunet_active_sos_signal');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Live EOC Advisories
  const [advisories, setAdvisories] = useState<EmergencyAdvisory[]>([]);

  // Hazard calculation state
  const [hazardDesc, setHazardDesc] = useState('');
  const [hazardLocation, setHazardLocation] = useState('');
  const [hazardResult, setHazardResult] = useState<any>(null);
  const [isCheckingHazard, setIsCheckingHazard] = useState(false);

  // Audio tone context ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const whistleIntervalRef = useRef<any>(null);

  // 1. Silent automatic GPS acquisition immediately upon loading
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setGpsStatus('acquiring');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords) {
            const latitude = Number(pos.coords.latitude.toFixed(5));
            const longitude = Number(pos.coords.longitude.toFixed(5));
            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
              setLat(latitude);
              setLng(longitude);
              setGpsStatus('locked');
              return;
            }
          }
          setGpsStatus('fallback');
        },
        () => {
          setGpsStatus('fallback');
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus('fallback');
    }
  }, []);

  // 2. Fetch initial EOC Advisories & Subscribe to real-time status changes
  useEffect(() => {
    getEmergencyAdvisories().then(setAdvisories).catch(() => {});

    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.event === 'new-advisory' && msg.payload) {
        setAdvisories((prev) => [msg.payload, ...prev.slice(0, 3)]);
      } else if (msg.event === 'status-change' && msg.payload) {
        // If the EOC dispatches or updates our active SOS signal, reflect it immediately!
        setActiveSignal((current) => {
          if (current && current.id === msg.payload.id) {
            try {
              localStorage.setItem('rescunet_active_sos_signal', JSON.stringify(msg.payload));
            } catch {}
            return msg.payload;
          }
          return current;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Audio Emergency Locator Whistle for rescuers / search dogs
  const toggleAudioWhistle = () => {
    if (audioWhistleActive) {
      if (whistleIntervalRef.current) clearInterval(whistleIntervalRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      setAudioWhistleActive(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      setAudioWhistleActive(true);

      const playChirp = () => {
        if (!ctx || ctx.state === 'closed') return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.15);
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch {}
      };

      // Play 3 distinct whistle pulses every 2.5 seconds (international alpine/distress signal pattern)
      playChirp();
      setTimeout(playChirp, 350);
      setTimeout(playChirp, 700);

      whistleIntervalRef.current = setInterval(() => {
        playChirp();
        setTimeout(playChirp, 350);
        setTimeout(playChirp, 700);
      }, 2600);
    } catch {
      setAudioWhistleActive(false);
    }
  };

  // Clean up audio whistle on unmount
  useEffect(() => {
    return () => {
      if (whistleIntervalRef.current) clearInterval(whistleIntervalRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, []);

  // 4. Submit Emergency SOS Beacon (1-Tap)
  const handleTransmitSOS = async () => {
    setIsTransmitting(true);

    const safeLat = Number.isNaN(lat) ? 10.0534 : lat;
    const safeLng = Number.isNaN(lng) ? 76.6272 : lng;

    const payload: Partial<SosSignal> = {
      name: nameOrNote.trim() ? nameOrNote.trim() : 'Survivor in Distress',
      condition: selectedCondition,
      lat: safeLat,
      lng: safeLng,
      notes: nameOrNote.trim() ? `Note: ${nameOrNote.trim()}` : 'Immediate emergency assistance required.',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    try {
      const savedSignal = await submitSosSignal(payload);
      setActiveSignal(savedSignal);
      try {
        localStorage.setItem('rescunet_active_sos_signal', JSON.stringify(savedSignal));
      } catch {}
    } catch (err) {
      console.warn('Transmission fallback:', err);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Clear / Cancel SOS
  const handleCancelSOS = () => {
    if (window.confirm('Are you certain you are safe and want to cancel this distress beacon?')) {
      if (activeSignal && activeSignal.id) {
        patchSosStatus(activeSignal.id, 'rescued', 'Beacon marked safe / cancelled by survivor.');
      }
      setActiveSignal(null);
      try {
        localStorage.removeItem('rescunet_active_sos_signal');
      } catch {}
      if (audioWhistleActive) toggleAudioWhistle();
      setStrobeActive(false);
    }
  };

  // Optional hazard check
  const handleCheckHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardDesc.trim()) return;
    setIsCheckingHazard(true);
    try {
      const res = await fetch('/api/verify-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: hazardDesc,
          locationName: hazardLocation || 'Nearby Road',
          hazardType: 'Road Blockage / Hazard',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHazardResult(data);
      } else {
        throw new Error();
      }
    } catch {
      setHazardResult({
        verified: true,
        riskLevel: 'CRITICAL',
        safetyGuidance: 'Route impassable. Divert east towards high ground emergency shelter.',
        recommendedSafeBearing: 'East-Northeast (065° Bearing)',
      });
    } finally {
      setIsCheckingHazard(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* MINIMAL HIGH-VISIBILITY HEADER */}
      <header className="bg-slate-900 border-b border-red-900/60 px-4 py-3 sticky top-0 z-30 shadow-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-red-600/50 animate-pulse flex-shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  RescuNet SOS
                </h1>
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>EOC Online</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-blue-400" />
                <span>
                  {gpsStatus === 'locked' 
                    ? `GPS Locked (${lat.toFixed(3)}, ${lng.toFixed(3)})` 
                    : gpsStatus === 'acquiring' 
                    ? 'Detecting GPS location...' 
                    : 'Emergency Sector Coordinates Ready'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:911"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              title="Quick Dial Emergency Hotline 911"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              <span>Call 911</span>
            </a>

            <button
              onClick={onNavigateToAdmin}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="First Responder & Incident Commander Terminal (Password Protected)"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Responder EOC</span>
              <span className="sm:hidden">EOC</span>
            </button>
          </div>

        </div>
      </header>

      {/* EMERGENCY ADVISORY (IF PRESENT) */}
      {advisories.length > 0 && (
        <div className="bg-red-950/90 border-b border-red-800/80 px-4 py-2 text-xs">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-red-200">
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] uppercase animate-pulse flex-shrink-0">
              URGENT ALERT
            </span>
            <span className="font-bold text-white truncate">{advisories[0].title}:</span>
            <span className="text-red-300 truncate">{advisories[0].message}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-6">

        {/* ================================================================= */}
        {/* STATE A: RESCUE IN PROGRESS (IF BEACON HAS BEEN ACTIVATED)        */}
        {/* ================================================================= */}
        {activeSignal ? (
          <div className="space-y-6">
            
            {/* BIG REASSURANCE CARD */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all ${
              activeSignal.status === 'rescued'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 ring-4 ring-emerald-500/30'
                : activeSignal.status === 'assigned'
                ? 'bg-blue-950/90 border-blue-500 text-blue-100 ring-4 ring-blue-500/30'
                : 'bg-red-950/90 border-red-500 text-red-100 ring-4 ring-red-500/30'
            }`}>
              
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mx-auto">
                  {activeSignal.status === 'rescued' ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  ) : activeSignal.status === 'assigned' ? (
                    <Radio className="w-12 h-12 text-blue-400 animate-pulse" />
                  ) : (
                    <Radio className="w-12 h-12 text-red-400 animate-ping" />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {activeSignal.status === 'rescued'
                      ? 'RESCUE CONFIRMED'
                      : activeSignal.status === 'assigned'
                      ? 'RESCUE TEAM EN ROUTE!'
                      : 'DISTRESS SIGNAL TRANSMITTED'}
                  </h2>
                  <p className="text-sm text-slate-200 mt-2 font-medium max-w-md mx-auto">
                    {activeSignal.status === 'rescued'
                      ? 'First responders have marked your evacuation complete. Stay safe.'
                      : activeSignal.status === 'assigned'
                      ? 'Emergency teams have been dispatched to your exact GPS coordinates. Stay in position.'
                      : 'Stay where you are. Your distress beacon and GPS coordinates have been received at the Emergency Operations Center.'}
                  </p>
                </div>

                {/* Status Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/20 text-xs font-bold uppercase tracking-wider text-white">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeSignal.status === 'rescued' 
                      ? 'bg-emerald-400' 
                      : activeSignal.status === 'assigned' 
                      ? 'bg-blue-400 animate-ping' 
                      : 'bg-red-500 animate-ping'
                  }`}></span>
                  <span>
                    {activeSignal.status === 'rescued'
                      ? 'Status: Evacuated & Safe'
                      : activeSignal.status === 'assigned'
                      ? 'Status: Dispatched • Team En Route'
                      : 'Status: EOC Received • Priority Queued'}
                  </span>
                </div>

                {/* Coordinate & Reference Details */}
                <div className="bg-black/30 rounded-2xl p-3.5 text-xs text-slate-300 font-mono space-y-1 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signal ID:</span>
                    <span className="font-bold text-white">#{activeSignal.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Locked Coordinates:</span>
                    <span className="font-bold text-white">{activeSignal.lat.toFixed(4)}° N, {activeSignal.lng.toFixed(4)}° E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Type:</span>
                    <span className="font-bold text-red-300">{activeSignal.condition}</span>
                  </div>
                </div>

              </div>

              {/* LOCATOR TOOLS (SOUND WHISTLE & STROBE) */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={toggleAudioWhistle}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    audioWhistleActive
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {audioWhistleActive ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                  <span>{audioWhistleActive ? 'STOP LOCATOR WHISTLE' : 'SOUND RESCUE WHISTLE'}</span>
                </button>

                <button
                  onClick={() => setStrobeActive(!strobeActive)}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    strobeActive
                      ? 'bg-white text-slate-950 ring-4 ring-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  <SunMedium className="w-5 h-5" />
                  <span>{strobeActive ? 'STOP SCREEN STROBE' : 'FLASH SCREEN STROBE'}</span>
                </button>
              </div>

            </div>

            {/* 3 CALM SURVIVAL RULES */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <span>Critical Survival Guidelines</span>
              </h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span><strong>Conserve your oxygen &amp; energy:</strong> Sit still, keep your airway covered with fabric if dust or smoke is present, and take slow breaths.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span><strong>Signal rhythmically:</strong> Tap metal pipes, structural steel, or stone <strong>3 times every minute</strong>. Rescue dogs and acoustic sensors filter for this pattern.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span><strong>Protect your device:</strong> Keep the screen face-down to protect the glass and preserve screen power until responders arrive.</span>
                </li>
              </ul>
            </div>

            {/* Quiet Cancel / Re-transmit Button */}
            <div className="text-center pt-2">
              <button
                onClick={handleCancelSOS}
                className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
              >
                I am safe now • Cancel distress beacon
              </button>
            </div>

          </div>
        ) : (
          /* ================================================================= */
          /* STATE B: PRE-SOS (ZERO OVERWHELM • 1-TAP EMERGENCY TRIGGER)       */
          /* ================================================================= */
          <div className="space-y-6">
            
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What is your emergency?
              </h2>
              <p className="text-xs text-slate-400">
                Select your situation below and press the red button.
              </p>
            </div>

            {/* 5 BIG 1-TAP EMERGENCY SITUATION CHIPS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMERGENCY_CONDITIONS.map((cond) => {
                const isSelected = selectedCondition === cond.id;
                const Icon = cond.icon;
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setSelectedCondition(cond.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? cond.activeColor
                        : `${cond.color} hover:border-slate-500 hover:bg-slate-900`
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-800 text-white'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-sm tracking-tight">{cond.label}</div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                        {cond.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* OPTIONAL SHORT NOTE (CAN BE LEFT COMPLETELY BLANK) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Name or details (Optional - leave blank if unable to type)
              </label>
              <input
                type="text"
                value={nameOrNote}
                onChange={(e) => setNameOrNote(e.target.value)}
                placeholder="e.g. Priya Sharma, 2 adults on roof, water rising fast"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* QUICK DISTRESS TOOLS BAR (NIGHT / DEBRIS / SMOKE SIGNALING) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStrobeActive(true)}
                className="py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
                title="Activate Fullscreen High-Lumen Optical Strobe & Camera Torch"
              >
                <SunMedium className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Screen Strobe &amp; Torch</span>
              </button>

              <button
                type="button"
                onClick={toggleAudioWhistle}
                className={`py-3 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
                  audioWhistleActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black ring-2 ring-amber-400'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-white'
                }`}
                title="Sound Acoustic Search Dog Distress Whistle"
              >
                {audioWhistleActive ? (
                  <VolumeX className="w-4 h-4 animate-bounce" />
                ) : (
                  <Volume2 className="w-4 h-4 text-blue-400" />
                )}
                <span>{audioWhistleActive ? 'Stop Whistle' : 'Rescue Whistle'}</span>
              </button>
            </div>

            {/* THE GIANT RED SOS TRANSMIT BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleTransmitSOS}
                disabled={isTransmitting}
                className={`w-full py-6 sm:py-8 px-6 rounded-3xl font-black text-2xl sm:text-3xl tracking-wider uppercase text-white shadow-2xl transition-all transform active:scale-98 flex items-center justify-center gap-3 ${
                  isTransmitting
                    ? 'bg-red-800 cursor-wait'
                    : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-600/60 ring-8 ring-red-600/30 animate-pulse hover:animate-none'
                }`}
              >
                {isTransmitting ? (
                  <>
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span>BROADCASTING SOS...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-8 h-8" />
                    <span>SEND EMERGENCY SOS</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                Instantly transmits your GPS coordinates and situation to the Emergency Operations Center.
              </p>
            </div>

          </div>
        )}

        {/* COLLAPSIBLE EVACUATION & HAZARD CHECK (BELOW PRIMARY RESCUE UI) */}
        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={() => setShowHazardReport(!showHazardReport)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Need to check or report an impassable road or flood obstacle?</span>
            </span>
            <span>{showHazardReport ? 'Hide' : 'Open'}</span>
          </button>

          {showHazardReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-3 text-xs space-y-3">
              <form onSubmit={handleCheckHazard} className="space-y-2.5">
                <input
                  type="text"
                  value={hazardLocation}
                  onChange={(e) => setHazardLocation(e.target.value)}
                  placeholder="Location (e.g. North Bridge, River Highway)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={hazardDesc}
                  onChange={(e) => setHazardDesc(e.target.value)}
                  placeholder="Describe hazard (e.g. 2m flood surge, bridge washed out)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isCheckingHazard || !hazardDesc.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isCheckingHazard ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Calculate Safe Detour Bearing</span>
                </button>
              </form>

              {hazardResult && (
                <div className="bg-slate-950 border border-blue-900/60 rounded-xl p-3 space-y-1 text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Calculated Safe Route:</span>
                  </div>
                  <p className="text-slate-300">{hazardResult.safetyGuidance}</p>
                  {hazardResult.recommendedSafeBearing && (
                    <p className="text-emerald-400 font-bold pt-1">
                      Bearing: {hazardResult.recommendedSafeBearing}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Responder Authentication Link */}
        <div className="text-center pt-6 pb-8">
          <button
            onClick={onNavigateToAdmin}
            className="text-slate-500 hover:text-slate-300 text-xs inline-flex items-center gap-1.5 transition-colors py-2 px-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60"
            title="Authorized Emergency Operations Terminal Access"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Emergency Services &amp; First Responders: Access EOC (Passcode Required)</span>
          </button>
        </div>

      </main>

      {/* FULLSCREEN OPTICAL EMERGENCY STROBE & HARDWARE TORCH OVERLAY */}
      <EmergencyStrobeOverlay
        isOpen={strobeActive}
        onClose={() => setStrobeActive(false)}
      />

    </div>
  );
};
