import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Radio, 
  BatteryLow, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Filter, 
  RefreshCw, 
  Flame, 
  Activity, 
  ChevronRight, 
  PhoneCall, 
  Layers, 
  Eye, 
  RotateCcw,
  Sparkles,
  Zap,
  Users,
  Clock
} from 'lucide-react';
import { AppConfig, SosSignal, HazardZone } from '../types';
import { LeafletMap } from './LeafletMap';

interface DashboardViewProps {
  config: AppConfig;
  onOpenImporter: () => void;
  onNavigateToWebsite: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  onOpenImporter,
  onNavigateToWebsite,
}) => {
  const [signals, setSignals] = useState<SosSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'active' | 'assigned' | 'rescued'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHazards, setShowHazards] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Fetch signals from /api/sos
  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sos');
      if (res.ok) {
        const data = await res.json();
        setSignals(data);
      }
    } catch (e) {
      console.warn('Error syncing SOS beacons:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    // 3-second live polling interval matching dashboard.html
    const interval = setInterval(fetchSignals, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update signal status (e.g. dispatch, rescue)
  const handleUpdateStatus = async (id: number, status: 'active' | 'assigned' | 'rescued') => {
    // Optimistic update
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    try {
      await fetch(`/api/sos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.warn('Failed to update signal status:', e);
    }
  };

  // Reset to default test signals
  const handleResetSignals = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sos/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
      }
    } catch (e) {
      console.warn('Error resetting signals:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter signals
  const filteredSignals = signals.filter((sig) => {
    if (filterSeverity === 'critical' && (sig.priority < 60 || sig.status === 'rescued')) return false;
    if (filterSeverity === 'active' && sig.status !== 'active') return false;
    if (filterSeverity === 'assigned' && sig.status !== 'assigned') return false;
    if (filterSeverity === 'rescued' && sig.status !== 'rescued') return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        sig.name.toLowerCase().includes(query) ||
        sig.condition.toLowerCase().includes(query) ||
        (sig.notes && sig.notes.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Calculate statistics
  const activeCount = signals.filter((s) => s.status !== 'rescued').length;
  const criticalCount = signals.filter((s) => s.priority >= 60 && s.status !== 'rescued').length;
  const assignedCount = signals.filter((s) => s.status === 'assigned').length;
  const rescuedCount = signals.filter((s) => s.status === 'rescued').length;
  const lowBatteryCount = signals.filter((s) => s.battery <= 25 && s.status !== 'rescued').length;

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Operations Command Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                RescuNet Command Dashboard
              </h1>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE BEACON SCANNER
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Palakkad Sector Operations • Automated Algorithmic Triage Queue
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              showHazards
                ? 'bg-blue-950/70 border-blue-600/60 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hazard Zones {showHazards ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchSignals();
            }}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Beacons"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={handleResetSignals}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            title="Reset to initial prototype test signals"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Test Data</span>
          </button>

          <button
            onClick={onNavigateToWebsite}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Trigger SOS as Victim</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* KPI Triage Metrics Row */}
      <section className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Active Distress */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Beacons
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {activeCount}
              </div>
              <div className="text-[10px] text-slate-500">Unresolved signals</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Critical Triage */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Critical (Score &gt;60)
              </div>
              <div className="text-2xl font-black text-red-400 mt-0.5">
                {criticalCount}
              </div>
              <div className="text-[10px] text-red-500/80 font-semibold">Immediate extraction</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Teams Dispatched */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Units En Route
              </div>
              <div className="text-2xl font-black text-blue-400 mt-0.5">
                {assignedCount} Teams
              </div>
              <div className="text-[10px] text-blue-500/80">Active rescue ops</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          {/* Critical Battery Decay */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Battery &le;25%
              </div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                {lowBatteryCount}
              </div>
              <div className="text-[10px] text-amber-500/80">Nodes facing blackout</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BatteryLow className="w-5 h-5" />
            </div>
          </div>

        </div>
      </section>

      {/* Main Command Workspace: Two Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Triage Priority Feed (Replicates sidebar from dashboard.html) */}
        <div className="w-full lg:w-[420px] bg-slate-900/90 border-r border-slate-800 flex flex-col h-[500px] lg:h-auto overflow-hidden">
          
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-red-500" />
                <span>Priority Triage Queue</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {filteredSignals.length} records
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search victim, condition, or notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterSeverity === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({signals.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterSeverity === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800/80 text-red-400 hover:text-red-300'
                }`}
              >
                Critical ({criticalCount})
              </button>
              <button
                onClick={() => setFilterSeverity('active')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterSeverity === 'active'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800/80 text-amber-400 hover:text-amber-300'
                }`}
              >
                Pending ({signals.filter(s => s.status === 'active').length})
              </button>
              <button
                onClick={() => setFilterSeverity('assigned')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterSeverity === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/80 text-blue-400 hover:text-blue-300'
                }`}
              >
                En Route ({assignedCount})
              </button>
              <button
                onClick={() => setFilterSeverity('rescued')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterSeverity === 'rescued'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800/80 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Rescued ({rescuedCount})
              </button>
            </div>
          </div>

          {/* Triage Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/50">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                <span>Scanning for distress beacons...</span>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No distress beacons match the selected filter.
              </div>
            ) : (
              filteredSignals.map((sig) => {
                const isSelected = sig.id === selectedSignalId;
                const isCritical = sig.priority >= 60;
                const isRescued = sig.status === 'rescued';
                const isAssigned = sig.status === 'assigned';

                return (
                  <div
                    key={sig.id}
                    onClick={() => setSelectedSignalId(sig.id)}
                    className={`pt-3 first:pt-0 cursor-pointer rounded-xl p-3.5 transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500/80 shadow-lg'
                        : 'bg-slate-950/60 hover:bg-slate-850 border-slate-800/80'
                    } ${
                      isRescued
                        ? 'border-l-4 border-l-emerald-500 opacity-75'
                        : isCritical
                        ? 'border-l-4 border-l-red-500'
                        : 'border-l-4 border-l-amber-500'
                    }`}
                  >
                    {/* Header with Title and Score Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {sig.name}
                        </div>
                        <div className={`text-xs font-semibold mt-0.5 ${
                          isRescued ? 'text-emerald-400' : isCritical ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          🚨 {sig.condition}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isRescued
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCritical
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        Score: {sig.priority}
                      </span>
                    </div>

                    {/* Metadata: Battery, Time, Hops */}
                    <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-mono">
                        <BatteryLow className={`w-3 h-3 ${sig.battery < 25 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                        <span>Battery: {sig.battery}%</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{sig.time}</span>
                      </span>
                      <span>•</span>
                      <span className="text-blue-400 font-mono">
                        {sig.meshHops || 2} mesh hops
                      </span>
                    </div>

                    {/* Notes if available */}
                    {sig.notes && (
                      <p className="mt-2 text-xs text-slate-300 italic bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800">
                        "{sig.notes}"
                      </p>
                    )}

                    {/* Quick Response Actions */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        Status: <span className={
                          isRescued ? 'text-emerald-400' : isAssigned ? 'text-blue-400' : 'text-amber-400'
                        }>{sig.status || 'ACTIVE'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isRescued && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(sig.id, isAssigned ? 'rescued' : 'assigned');
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              isAssigned
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isAssigned ? 'Mark Rescued' : 'Dispatch Team'}
                          </button>
                        )}
                        {isRescued && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(sig.id, 'active');
                            }}
                            className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400"
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSignalId(sig.id);
                          }}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
                        >
                          <MapPin className="w-2.5 h-2.5 text-red-400" />
                          <span>Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Leaflet Interactive Map */}
        <div className="flex-1 flex flex-col min-h-[450px] p-4 bg-slate-950">
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <LeafletMap
              signals={filteredSignals}
              selectedSignalId={selectedSignalId}
              onSelectSignal={(sig) => setSelectedSignalId(sig.id)}
              hazardZones={hazardZones}
              showHazards={showHazards}
            />
          </div>

          {/* Active Incident Summary Strip */}
          <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Sector Focus: Palakkad Region (10.053&deg; N, 76.627&deg; E)</span>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline">Priority Formula: Severity Base + (100 - Battery) * 0.3</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-emerald-400 font-mono">
                Telemetry Frequency: 2.4 GHz Mesh
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
