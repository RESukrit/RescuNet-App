import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  MapPin, 
  Search, 
  Filter, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Send, 
  ExternalLink,
  ChevronRight,
  Globe,
  Bell,
  Activity,
  Users,
  Eye
} from 'lucide-react';
import { AppConfig, SosSignal, HazardZone } from '../types';
import { LeafletMap } from './LeafletMap';
import { 
  realtime, 
  getSosSignals, 
  getLocalSignals,
  resetLocalSignals,
  patchSosStatus, 
  publishEmergencyAdvisory, 
  EmergencyAdvisory 
} from '../services/realtime';

interface AdminPortalProps {
  config: AppConfig;
  onNavigateToCitizen: () => void;
  onOpenHostingGuide: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  onNavigateToCitizen,
  onOpenHostingGuide,
}) => {
  const [signals, setSignals] = useState<SosSignal[]>(() => getLocalSignals());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'active' | 'assigned' | 'rescued'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHazards, setShowHazards] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);

  // New Emergency Broadcast state
  const [isBroadcastingAdvisory, setIsBroadcastingAdvisory] = useState(false);
  const [advisoryTitle, setAdvisoryTitle] = useState('');
  const [advisoryMessage, setAdvisoryMessage] = useState('');
  const [advisoryLevel, setAdvisoryLevel] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [recentBroadcasts, setRecentBroadcasts] = useState<EmergencyAdvisory[]>([]);

  const hazardZones: HazardZone[] = config.rescuNet?.hazardZones || [
    {
      id: 'hazard-1',
      title: 'River Basin Flash Flood Zone',
      type: 'flood',
      severity: 'critical',
      center: [10.048, 76.632],
      radius: 650,
      description: 'Active flash flood with strong currents. Low elevation roads submerged.',
      active: true,
    },
    {
      id: 'hazard-2',
      title: 'North Ridge Landslide Hazard',
      type: 'landslide',
      severity: 'high',
      center: [10.065, 76.621],
      radius: 400,
      description: 'Mudslide blocking primary mountain highway.',
      active: true,
    },
    {
      id: 'hazard-3',
      title: 'Pine Forest Brushfire',
      type: 'fire',
      severity: 'high',
      center: [10.059, 76.641],
      radius: 500,
      description: 'Fast-moving brushfire spreading southwest.',
      active: true,
    },
  ];

  // Play audio chime when new beacon arrives
  const playIncomingBeaconAlert = () => {
    if (!audioAlerts) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const loadSignals = async () => {
    try {
      const data = await getSosSignals();
      setSignals(data);
    } catch (err) {
      console.warn('Error loading signals in admin portal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();

    // Subscribe to real-time events from citizen portals
    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.event === 'new-sos' && msg.payload) {
        setSignals((prev) => {
          const exists = prev.some((s) => s.id === msg.payload.id);
          if (exists) return prev;
          playIncomingBeaconAlert();
          return [msg.payload, ...prev].sort((a, b) => b.priority - a.priority);
        });
      } else if (msg.event === 'status-change' && msg.payload) {
        setSignals((prev) =>
          prev.map((s) => (s.id === msg.payload.id ? msg.payload : s))
        );
      } else if (msg.event === 'delete-sos' && msg.payload) {
        setSignals((prev) => prev.filter((s) => s.id !== msg.payload.id));
      } else if (msg.event === 'reset-signals' && Array.isArray(msg.payload)) {
        setSignals(msg.payload);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [audioAlerts]);

  // Handle Dispatch responder
  const handleDispatchUnit = async (id: number, teamName: string) => {
    try {
      const updated = await patchSosStatus(id, 'assigned', `Dispatched ${teamName}. En route.`);
      setSignals((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Error dispatching unit:', err);
    }
  };

  // Handle Mark Rescued
  const handleMarkRescued = async (id: number) => {
    try {
      const updated = await patchSosStatus(id, 'rescued', 'Evacuation complete. Victim at Medical Triage Post.');
      setSignals((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Error marking rescued:', err);
    }
  };

  // Handle Reset data
  const handleResetData = async () => {
    const reset = resetLocalSignals();
    setSignals(reset);
    try {
      await fetch('/api/sos/reset', { method: 'POST' });
    } catch {}
  };

  // Publish Emergency Advisory
  const handleBroadcastAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryTitle.trim() || !advisoryMessage.trim()) return;

    try {
      const adv = await publishEmergencyAdvisory({
        title: advisoryTitle,
        message: advisoryMessage,
        level: advisoryLevel,
      });
      setRecentBroadcasts((prev) => [adv, ...prev.slice(0, 3)]);
      setAdvisoryTitle('');
      setAdvisoryMessage('');
      setIsBroadcastingAdvisory(false);
    } catch (err) {
      console.error('Error broadcasting advisory:', err);
    }
  };

  // Filter signals
  const filteredSignals = signals.filter((sig) => {
    if (filterSeverity === 'critical' && sig.priority < 60) return false;
    if (filterSeverity === 'active' && sig.status !== 'active') return false;
    if (filterSeverity === 'assigned' && sig.status !== 'assigned') return false;
    if (filterSeverity === 'rescued' && sig.status !== 'rescued') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sig.name.toLowerCase().includes(q);
      const matchCond = sig.condition.toLowerCase().includes(q);
      const matchNotes = (sig.notes || '').toLowerCase().includes(q);
      return matchName || matchCond || matchNotes;
    }
    return true;
  });

  const activeCount = signals.filter((s) => s.status !== 'rescued').length;
  const criticalCount = signals.filter((s) => s.priority >= 60 && s.status !== 'rescued').length;
  const assignedCount = signals.filter((s) => s.status === 'assigned').length;
  const rescuedCount = signals.filter((s) => s.status === 'rescued').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* COMMAND EOC HEADER */}
      <header className="border-b border-blue-900/40 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/40 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">
                  RescuNet Emergency Operations Center (EOC)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  CMD-TACTICAL-01
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Mesh Gateway Uplink Active</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Central Disaster Dispatch, Algorithmic Triage Prioritization &amp; Field Unit Tracking
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAudioAlerts(!audioAlerts)}
              className={`p-2 rounded-xl border transition-colors ${
                audioAlerts ? 'bg-slate-800 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={audioAlerts ? 'Incoming SOS Audio Chime Enabled' : 'Audio Chime Muted'}
            >
              {audioAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsBroadcastingAdvisory(!isBroadcastingAdvisory)}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Broadcast EOC Alert</span>
            </button>

            <button
              onClick={onOpenHostingGuide}
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Deploy Live Free</span>
            </button>

            <button
              onClick={onNavigateToCitizen}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Open Citizen Portal →</span>
            </button>
          </div>

        </div>
      </header>

      {/* BROADCAST ADVISORY DRAWER / FORM */}
      {isBroadcastingAdvisory && (
        <div className="bg-slate-900 border-b border-red-900/60 p-4 sm:p-6 transition-all">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                <span>Transmit Emergency Broadcast to All Citizen Survivor Portals</span>
              </h3>
              <button
                onClick={() => setIsBroadcastingAdvisory(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleBroadcastAdvisory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={advisoryTitle}
                  onChange={(e) => setAdvisoryTitle(e.target.value)}
                  placeholder="Advisory Title (e.g. Flash Flood Evacuation)"
                  className="sm:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500"
                />
                <select
                  value={advisoryLevel}
                  onChange={(e: any) => setAdvisoryLevel(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="CRITICAL">CRITICAL EVACUATION</option>
                  <option value="WARNING">HAZARD WARNING</option>
                  <option value="INFO">ADVISORY INFO</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={advisoryMessage}
                onChange={(e) => setAdvisoryMessage(e.target.value)}
                placeholder="Message instructions (e.g. Dam spillway opening in 20 minutes. All residents in Sector 4 River Basin must move to North Ridge immediately.)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Advisory Over Mesh Network</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI METRICS ROW */}
      <section className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Beacons
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {activeCount}
              </div>
              <div className="text-[10px] text-slate-500">Awaiting resolution</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Critical (Score &gt;60)
              </div>
              <div className="text-2xl font-black text-red-400 mt-0.5">
                {criticalCount}
              </div>
              <div className="text-[10px] text-red-500/80 font-bold">Immediate dispatch</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Units Deployed
              </div>
              <div className="text-2xl font-black text-blue-400 mt-0.5">
                {assignedCount} Teams
              </div>
              <div className="text-[10px] text-blue-400">Active rescue missions</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Evacuated &amp; Safe
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {rescuedCount}
              </div>
              <div className="text-[10px] text-emerald-500/80">Rescues confirmed safe</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

        </div>
      </section>

      {/* MAIN TWO-COLUMN WORKSPACE: MAP & TRIAGE QUEUE */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE TACTICAL MAP */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Interactive Tactical Incident Map
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowHazards(!showHazards)}
                className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] transition-colors ${
                  showHazards ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {showHazards ? 'Hide Hazard Polygons' : 'Show Hazard Polygons'}
              </button>
            </div>
          </div>

          <div className="h-[480px] lg:h-[620px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <LeafletMap
              signals={signals}
              hazardZones={hazardZones}
              selectedSignalId={selectedSignalId}
              onSelectSignal={(sig) => setSelectedSignalId(sig.id)}
              showHazards={showHazards}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: TRIAGE PRIORITY QUEUE & DISPATCH BOARD */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Filter and Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search victim name, condition, notes..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filterSeverity === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({signals.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filterSeverity === 'critical' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-white'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterSeverity('active')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filterSeverity === 'active' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterSeverity('assigned')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filterSeverity === 'assigned' ? 'bg-blue-600 text-white' : 'text-blue-400 hover:text-white'
                }`}
              >
                Dispatched
              </button>
              <button
                onClick={() => setFilterSeverity('rescued')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                  filterSeverity === 'rescued' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-white'
                }`}
              >
                Rescued
              </button>
            </div>
          </div>

          {/* Triage Cards List */}
          <div className="space-y-3 overflow-y-auto max-h-[540px] pr-1">
            {filteredSignals.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No beacon signals match current filter.
              </div>
            ) : (
              filteredSignals.map((sig) => {
                const isCritical = sig.priority >= 60;
                const isSelected = sig.id === selectedSignalId;

                return (
                  <div
                    key={sig.id}
                    onClick={() => setSelectedSignalId(sig.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-slate-900 ring-2 ring-blue-500/30 shadow-xl'
                        : isCritical && sig.status !== 'rescued'
                        ? 'border-red-900/60 bg-red-950/20 hover:border-red-600'
                        : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {sig.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{sig.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sig.status === 'rescued'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : sig.status === 'assigned'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}>
                            {sig.status}
                          </span>
                        </div>

                        <div className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{sig.condition}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className={`text-base font-black ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                          {sig.priority}
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase font-bold">Priority</div>
                      </div>
                    </div>

                    {/* Metadata Telemetry */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                      <span>GPS: <strong>{sig.lat.toFixed(4)}, {sig.lng.toFixed(4)}</strong></span>
                      <span>•</span>
                      <span>Signal ID: #{sig.id}</span>
                      <span>•</span>
                      <span>Mesh Hops: {sig.meshHops || 1}</span>
                    </div>

                    {sig.notes && (
                      <p className="text-[11px] text-slate-300 mt-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800 italic">
                        "{sig.notes}"
                      </p>
                    )}

                    {/* Fast Dispatch Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800">
                      {sig.status !== 'rescued' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDispatchUnit(sig.id, 'Alpha Ground Search Unit');
                            }}
                            className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Dispatch Alpha Team
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDispatchUnit(sig.id, 'Marine Rescue Boat #2');
                            }}
                            className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Dispatch Boat #2
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRescued(sig.id);
                            }}
                            className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Mark Rescued
                          </button>
                        </>
                      )}
                      {sig.status === 'rescued' && (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Victim Evacuation Complete</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Algorithmic Triage Engine Active</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-white underline text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Prototype Test Signals</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
