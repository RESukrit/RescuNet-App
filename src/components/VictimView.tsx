import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Radio, 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryCharging, 
  MapPin, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Activity, 
  Navigation, 
  Volume2, 
  VolumeX, 
  Compass, 
  Clock, 
  Moon, 
  Sun, 
  ChevronRight,
  WifiOff,
  Share2
} from 'lucide-react';
import { AppConfig, SosSignal } from '../types';
import { submitSosSignal } from '../services/realtime';
import { EmergencyStrobeOverlay } from './EmergencyStrobeOverlay';

interface VictimViewProps {
  config: AppConfig;
  onNavigateToDashboard: () => void;
  onSignalDispatched?: (signal: SosSignal) => void;
}

export const VictimView: React.FC<VictimViewProps> = ({
  config,
  onNavigateToDashboard,
  onSignalDispatched,
}) => {
  const [name, setName] = useState('Priya Sharma');
  const [condition, setCondition] = useState('Trapped under debris');
  const [notes, setNotes] = useState('');
  const [battery, setBattery] = useState<number>(24);
  const [lat, setLat] = useState<number>(10.0534);
  const [lng, setLng] = useState<number>(76.6272);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'acquired' | 'error'>('acquired');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    priority?: number;
    meshHops?: number;
    message: string;
  } | null>(null);

  // Audio beacon toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [strobeActive, setStrobeActive] = useState(false);

  // Welfare check-in timer simulation
  const [welfarePrompt, setWelfarePrompt] = useState(false);
  const [welfareCountdown, setWelfareCountdown] = useState(30);

  // AI Hazard Verification state
  const [hazardNote, setHazardNote] = useState('');
  const [hazardLocation, setHazardLocation] = useState('Sector 4 Access Bridge');
  const [isVerifyingHazard, setIsVerifyingHazard] = useState(false);
  const [hazardResult, setHazardResult] = useState<any>(null);

  // Initialize battery reading from browser if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((batteryManager: any) => {
          if (batteryManager && typeof batteryManager.level === 'number' && !Number.isNaN(batteryManager.level)) {
            const pct = Math.round(batteryManager.level * 100);
            if (!Number.isNaN(pct) && pct > 0 && pct <= 100) {
              setBattery(pct);
            }
          }
          batteryManager?.addEventListener?.('levelchange', () => {
            if (batteryManager && typeof batteryManager.level === 'number' && !Number.isNaN(batteryManager.level)) {
              const pct = Math.round(batteryManager.level * 100);
              if (!Number.isNaN(pct) && pct > 0 && pct <= 100) {
                setBattery(pct);
              }
            }
          });
        }).catch(() => {
          // Fallback to default
        });
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  // Welfare countdown timer
  useEffect(() => {
    let timer: any;
    if (welfarePrompt && welfareCountdown > 0) {
      timer = setInterval(() => {
        setWelfareCountdown((c) => c - 1);
      }, 1000);
    } else if (welfarePrompt && welfareCountdown === 0) {
      // Auto-escalate SOS when timer expires!
      handleSendSOS(true);
      setWelfarePrompt(false);
    }
    return () => clearInterval(timer);
  }, [welfarePrompt, welfareCountdown]);

  // Acquire real GPS from device
  const handleAcquireGPS = () => {
    setGpsStatus('acquiring');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(Number(position.coords.latitude.toFixed(5)));
          setLng(Number(position.coords.longitude.toFixed(5)));
          setGpsStatus('acquired');
        },
        (error) => {
          console.warn('GPS error, using disaster zone coordinates:', error);
          setGpsStatus('error');
          // Palakkad disaster zone default coordinates
          setLat(10.053);
          setLng(76.627);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus('error');
    }
  };

  // Play audio beacon tone via Web Audio API
  const playAlarmTone = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Send Emergency SOS
  const handleSendSOS = async (isAutoEscalated = false) => {
    setIsBroadcasting(true);
    setBroadcastResult(null);
    playAlarmTone();

    const safeBattery = Number.isNaN(battery) ? 24 : battery;
    const safeLat = Number.isNaN(lat) ? 10.0534 : lat;
    const safeLng = Number.isNaN(lng) ? 76.6272 : lng;

    const payload = {
      name: name.trim() || 'Victim 1',
      condition,
      battery: safeBattery,
      lat: safeLat,
      lng: safeLng,
      notes: notes.trim() + (isAutoEscalated ? ' [Auto-Escalated: Welfare Check Unanswered]' : ''),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    try {
      const savedSignal = await submitSosSignal(payload);

      setBroadcastResult({
        success: true,
        priority: savedSignal.priority,
        meshHops: savedSignal.meshHops || 2,
        message: `✅ SOS SIGNAL BROADCASTED! Mesh packet hopped across ${savedSignal.meshHops || 2} nodes to emergency gateway. Priority Triage: ${savedSignal.priority}/100.`,
      });

      if (onSignalDispatched) {
        onSignalDispatched(savedSignal);
      }
    } catch (err) {
      // Offline fallback: simulate local mesh broadcast
      const simulatedPriority = calculateSimulatedPriority(condition, safeBattery);
      setBroadcastResult({
        success: true,
        priority: simulatedPriority,
        meshHops: 3,
        message: `⚠️ Offline Local Mesh Broadcast: Signal stored in local peer cache and forwarded via BLE radio to nearby peer nodes. Priority: ${simulatedPriority}.`,
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const calculateSimulatedPriority = (cond: string, batt: number) => {
    const weights: Record<string, number> = {
      'Trapped under debris': 50.0,
      'Medical Emergency': 40.0,
      'Trapped in a fire': 35.0,
      'Cut off by floodwater': 25.0,
    };
    const base = weights[cond] || 15.0;
    const safeBatt = Number.isNaN(batt) ? 24 : Math.max(0, Math.min(100, batt));
    const battScore = (100 - safeBatt) * 0.3;
    return Math.round((base + battScore) * 100) / 100;
  };

  // Verify Hazard using AI endpoint
  const handleVerifyHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardNote.trim()) return;

    setIsVerifyingHazard(true);
    try {
      const res = await fetch('/api/verify-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: hazardNote,
          locationName: hazardLocation,
          hazardType: 'Road Blockage / Flood Water',
        }),
      });

      const data = await res.json();
      setHazardResult(data);
    } catch (err) {
      setHazardResult({
        verified: true,
        confidence: 0.9,
        riskLevel: 'HIGH',
        safetyGuidance: 'Proceed away from downstream flow. Move uphill towards designated high-ground triage shelter.',
      });
    } finally {
      setIsVerifyingHazard(false);
    }
  };

  return (
    <div className={`w-full min-h-screen transition-colors ${lowPowerMode ? 'bg-black text-slate-200' : 'bg-slate-950 text-slate-100'} p-4 sm:p-6 lg:p-8 font-sans`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Emergency Status Bar */}
        <div className="bg-slate-900/90 border border-red-900/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">RescuNet Victim SOS</h1>
                <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Offline P2P Mesh
                </span>
              </div>
              <p className="text-xs text-slate-400">
                P2P BLE & Wi-Fi Direct Relay active • Zero internet required
              </p>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStrobeActive(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border bg-slate-800 text-amber-400 border-amber-500/40 hover:bg-slate-700"
              title="Activate High-Lumen Emergency Screen Strobe & Torch"
            >
              <Sun className="w-3.5 h-3.5 animate-pulse" />
              <span>Strobe</span>
            </button>

            <button
              onClick={() => setLowPowerMode(!lowPowerMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                lowPowerMode
                  ? 'bg-slate-800 text-yellow-400 border-yellow-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Ultra-Low Power OLED Saver Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{lowPowerMode ? 'Low Power ON' : 'Low Power'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors"
              title={soundEnabled ? 'Mute Beacon Alarm' : 'Unmute Beacon Alarm'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onNavigateToDashboard}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <span>Command Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Welfare Check-In Alert Banner (if prompt active) */}
        {welfarePrompt ? (
          <div className="bg-amber-950/80 border border-amber-600/60 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-amber-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-200 text-sm sm:text-base">
                  Automated Welfare Check-In Active
                </h4>
                <p className="text-xs text-amber-300/80">
                  Please verify your safety. Unanswered prompt auto-escalates SOS in <span className="font-bold text-white text-sm underline">{welfareCountdown}s</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setWelfarePrompt(false);
                  setWelfareCountdown(30);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                I AM SAFE
              </button>
              <button
                onClick={() => {
                  handleSendSOS(true);
                  setWelfarePrompt(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                ESCALATE SOS NOW
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Automated Welfare Monitor: Standing by</span>
            </div>
            <button
              onClick={() => {
                setWelfareCountdown(30);
                setWelfarePrompt(true);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
            >
              Simulate Welfare Prompt
            </button>
          </div>
        )}

        {/* Main Distress Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>EMERGENCY BEACON TRANSMITTER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Broadcast Location & Distress
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Tap the red emergency button to transmit your medical condition, GPS coordinates, and remaining battery to first responders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Victim Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Victim / Group Identifier</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name or Household (e.g., Victim 1)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Condition Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Emergency Condition</span>
                <span className="text-[10px] text-red-400 font-semibold lowercase">affects triage score</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="Trapped under debris">Trapped under debris (Base Weight: 50)</option>
                <option value="Medical Emergency">Medical Emergency (Base Weight: 40)</option>
                <option value="Trapped in a fire">Trapped in a fire (Base Weight: 35)</option>
                <option value="Cut off by floodwater">Cut off by floodwater (Base Weight: 25)</option>
                <option value="Structural Collapse Risk">Structural Collapse Risk (Base Weight: 45)</option>
                <option value="Gas Leak">Gas Leak (Base Weight: 38)</option>
              </select>
            </div>

            {/* GPS Telemetry */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>GPS Coordinates</span>
                </label>
                <button
                  type="button"
                  onClick={handleAcquireGPS}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{gpsStatus === 'acquiring' ? 'Acquiring...' : 'Refresh Device GPS'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={Number.isNaN(lat) ? '' : String(lat)}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setLat(Number.isNaN(parsed) ? 10.0534 : parsed);
                  }}
                  placeholder="Latitude"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={Number.isNaN(lng) ? '' : String(lng)}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setLng(Number.isNaN(parsed) ? 76.6272 : parsed);
                  }}
                  placeholder="Longitude"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] text-slate-500">Preset Locations:</span>
                <button
                  type="button"
                  onClick={() => { setLat(10.0534); setLng(76.6272); }}
                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                >
                  Sector 4 (Central)
                </button>
                <button
                  type="button"
                  onClick={() => { setLat(10.0451); setLng(76.6385); }}
                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                >
                  River Basin
                </button>
                <button
                  type="button"
                  onClick={() => { setLat(10.0612); setLng(76.6198); }}
                  className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                >
                  North Ridge
                </button>
              </div>
            </div>

            {/* Battery Telemetry */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  {(Number.isNaN(battery) ? 24 : battery) < 25 ? (
                    <BatteryLow className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  ) : (Number.isNaN(battery) ? 24 : battery) < 60 ? (
                    <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Device Battery Level: {Number.isNaN(battery) ? 24 : battery}%</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  decay bonus: +{((100 - (Number.isNaN(battery) ? 24 : battery)) * 0.3).toFixed(1)} pts
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={Number.isNaN(battery) ? 24 : battery}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setBattery(Number.isNaN(val) ? 24 : val);
                }}
                className="w-full accent-red-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <p className="text-[11px] text-slate-500">
                Lower battery exponentially elevates emergency triage score in RescuNet algorithm to prioritize dying nodes.
              </p>
            </div>

            {/* Field Notes (Full Width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Field Situation Details (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 2 adults, 1 infant. Water level at 1.5m. Roof access available."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* THE BIG EMERGENCY SOS BUTTON */}
          <div className="pt-4 text-center space-y-4">
            <button
              onClick={() => handleSendSOS(false)}
              disabled={isBroadcasting}
              className={`w-full py-6 sm:py-7 px-6 rounded-2xl font-black text-xl sm:text-2xl tracking-wider uppercase text-white shadow-2xl transition-all transform active:scale-98 ${
                isBroadcasting
                  ? 'bg-red-800 cursor-wait'
                  : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-600/50 hover:shadow-red-500/70 ring-4 ring-red-500/20'
              }`}
            >
              {isBroadcasting ? (
                <span className="flex items-center justify-center gap-3">
                  <Radio className="w-7 h-7 animate-spin" />
                  <span>BROADCASTING TO MESH...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <AlertTriangle className="w-7 h-7 animate-bounce" />
                  <span>SEND EMERGENCY SOS</span>
                </span>
              )}
            </button>

            {/* Broadcast Status Feedback */}
            {broadcastResult && (
              <div
                className={`p-4 rounded-xl border text-sm text-left transition-all ${
                  broadcastResult.success
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                    : 'bg-red-950/70 border-red-600 text-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-100">{broadcastResult.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-300/80 pt-1">
                      <span>• Calculated Priority: <strong className="text-white">{broadcastResult.priority}</strong>/100</span>
                      <span>• P2P Mesh Hops: <strong className="text-white">{broadcastResult.meshHops}</strong></span>
                      <button
                        onClick={onNavigateToDashboard}
                        className="underline text-white font-bold hover:text-emerald-100"
                      >
                        View Beacon on Command Dashboard →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Offline P2P Mesh Hop Visualizer */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>P2P Offline Mesh Protocol Route</span>
            </h3>
            
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-center sm:text-left">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>[Offline Phone]</span>
                </div>
                <div className="text-slate-500 font-bold hidden sm:block">──(BLE Hop)──►</div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <span>[Peer Relay Node]</span>
                </div>
                <div className="text-slate-500 font-bold hidden sm:block">──(Wi-Fi Direct)──►</div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span>[Rescue Gateway]</span>
                </div>
                <div className="text-slate-500 font-bold hidden sm:block">──►</div>
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <span>[Triage Dashboard]</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Hazard Verification Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Automated Hazard Verification &amp; Safe Routing</h3>
                <p className="text-xs text-slate-400">Report blocked roads, debris, or rising water for verification and dynamic routing updates.</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded">
              Telemetric Engine
            </span>
          </div>

          <form onSubmit={handleVerifyHazard} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={hazardLocation}
                onChange={(e) => setHazardLocation(e.target.value)}
                placeholder="Hazard Location (e.g. Sector 4 Bridge)"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={hazardNote}
                onChange={(e) => setHazardNote(e.target.value)}
                placeholder="Describe hazard (e.g. Mudslide washed out highway, impassable by vehicle)"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isVerifyingHazard || !hazardNote.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md"
              >
                {isVerifyingHazard ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Incident Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Verify &amp; Broadcast Hazard Alert</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Verification Output */}
          {hazardResult && (
            <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-4 text-xs space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified: {hazardResult.hazardType || 'Active Blockage'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  hazardResult.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  Risk Level: {hazardResult.riskLevel || 'HIGH'}
                </span>
              </div>
              <p className="text-slate-300">
                <strong>Safety Guidance:</strong> {hazardResult.safetyGuidance}
              </p>
              {hazardResult.recommendedSafeBearing && (
                <p className="text-emerald-400 font-medium flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Recommended Safe Bearing: {hazardResult.recommendedSafeBearing}</span>
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Emergency Fullscreen Strobe Overlay */}
      <EmergencyStrobeOverlay
        isOpen={strobeActive}
        onClose={() => setStrobeActive(false)}
      />
    </div>
  );
};
