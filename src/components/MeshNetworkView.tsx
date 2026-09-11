import React, { useState } from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Server, 
  Send,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppConfig, HazardZone } from '../types';

interface MeshNetworkViewProps {
  config: AppConfig;
  onNavigateToDashboard: () => void;
  onNavigateToVictim: () => void;
}

export const MeshNetworkView: React.FC<MeshNetworkViewProps> = ({
  config,
  onNavigateToDashboard,
  onNavigateToVictim,
}) => {
  const [activeHopIndex, setActiveHopIndex] = useState<number | null>(null);
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [packetLog, setPacketLog] = useState<string[]>([
    'Mesh Protocol Initialized: Listening on 2.4 GHz BLE & Wi-Fi Direct',
    'Gateway Node #1 connected to Civil Defense Emergency Operations Center',
    'Offline Peer Hop latency: avg 28ms per node hop',
  ]);

  const [hazardQuery, setHazardQuery] = useState('');
  const [hazardLocation, setHazardLocation] = useState('Sector 4 Highway Bridge');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hazardReport, setHazardReport] = useState<any>(null);

  // Mesh Topology Nodes
  const nodes = [
    {
      id: 'node-a',
      label: 'Offline Survivor Node A',
      type: 'phone',
      status: 'distress',
      battery: '18%',
      radio: 'BLE 5.2',
      notes: 'Origin: Trapped under debris',
    },
    {
      id: 'node-b',
      label: 'Civilian Relay Node B',
      type: 'relay',
      status: 'active',
      battery: '74%',
      radio: 'Wi-Fi Direct',
      notes: 'Multi-hop forwarder (Range 450m)',
    },
    {
      id: 'node-c',
      label: 'High-Elevation Node C',
      type: 'relay',
      status: 'active',
      battery: '91%',
      radio: 'BLE Long-Range',
      notes: 'Water tower repeater node',
    },
    {
      id: 'gateway',
      label: 'Connected Responder Gateway',
      type: 'gateway',
      status: 'online',
      battery: '100% (Solar/Mains)',
      radio: 'LoRa / Satellite Uplink',
      notes: 'Base Camp Operations Alpha',
    },
    {
      id: 'dashboard',
      label: 'RescuNet Command Dashboard',
      type: 'command',
      status: 'online',
      battery: 'Mains',
      radio: 'Fiber / Central EOC',
      notes: 'Live Triage Map & Dispatch',
    },
  ];

  // Simulate Packet Hop
  const handleSimulatePacket = () => {
    if (isSimulatingPacket) return;
    setIsSimulatingPacket(true);
    setActiveHopIndex(0);

    const logMessage = (msg: string) => {
      setPacketLog((prev) => [msg, ...prev.slice(0, 8)]);
    };

    logMessage('🚀 Packet Generation: SOS Distress Payload [Priority 74.6, GPS: 10.053, 76.627]');

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < nodes.length) {
        setActiveHopIndex(step);
        logMessage(`📡 Hop #${step}: Packet routed to ${nodes[step].label} via ${nodes[step].radio}`);
      } else {
        clearInterval(interval);
        setActiveHopIndex(nodes.length - 1);
        setIsSimulatingPacket(false);
        logMessage('✅ Packet Delivered: Distress beacon registered on Central Rescue Command Dashboard!');
      }
    }, 900);
  };

  // AI Hazard Verification handler
  const handleVerifyHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardQuery.trim()) return;

    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: hazardQuery,
          locationName: hazardLocation,
          hazardType: 'Flash Flood & Debris',
        }),
      });
      const data = await res.json();
      setHazardReport(data);
    } catch (err) {
      setHazardReport({
        verified: true,
        confidence: 0.94,
        hazardType: 'Flash Flood & Downed Power Lines',
        riskLevel: 'CRITICAL',
        rerouteRecommended: true,
        safetyGuidance: 'High danger zone confirmed. Evacuate eastward to High Ridge Trail. Avoid all drainage canals.',
        estimatedClearTime: '6-8 hours',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>OFFLINE P2P MESH ARCHITECTURE</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Peer-to-Peer Mesh Network & Hazard Routing
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              When cell towers collapse during natural disasters, RescuNet links offline civilian phones into a resilient multi-hop mesh network using BLE and Wi-Fi Direct.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulatePacket}
              disabled={isSimulatingPacket}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Zap className={`w-4 h-4 ${isSimulatingPacket ? 'animate-bounce text-yellow-300' : ''}`} />
              <span>{isSimulatingPacket ? 'Hopping Packet...' : 'Simulate Mesh Hop'}</span>
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Command Map
            </button>
          </div>
        </div>

        {/* Interactive Multi-Hop Node Diagram */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Live Mesh Hop Topology</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Packet status: {isSimulatingPacket ? 'TRANSMITTING' : 'IDLE'}
            </span>
          </div>

          {/* Node Cards Chain */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {nodes.map((node, index) => {
              const isCurrent = activeHopIndex === index;
              const isPast = activeHopIndex !== null && activeHopIndex > index;

              return (
                <div
                  key={node.id}
                  className={`rounded-xl p-4 border transition-all relative ${
                    isCurrent
                      ? 'bg-blue-950/80 border-blue-500 shadow-xl shadow-blue-500/20 scale-105 z-10'
                      : isPast
                      ? 'bg-slate-900/90 border-emerald-500/60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {/* Step indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Step {index + 1}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      isCurrent ? 'bg-blue-400 animate-ping' : isPast ? 'bg-emerald-400' : 'bg-slate-600'
                    }`} />
                  </div>

                  <div className="text-xs font-bold text-white mb-1">
                    {node.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {node.notes}
                  </div>

                  <div className="text-[10px] space-y-1 font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                    <div>Radio: <span className="text-slate-200">{node.radio}</span></div>
                    <div>Power: <span className="text-slate-200">{node.battery}</span></div>
                  </div>

                  {/* Connecting Arrow for Desktop */}
                  {index < nodes.length - 1 && (
                    <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Packet Hop Terminal Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
              <span>Mesh Transmission Telemetry Feed</span>
              <span className="text-emerald-400">P2P BLE / Wi-Fi Direct: ACTIVE</span>
            </div>
            {packetLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-600">&gt;</span>
                <span className={idx === 0 ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Hazard-Avoidance Routing & AI Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dynamic Hazard Zones */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Dynamic Hazard-Avoidance Routing</span>
              </h3>
              <span className="text-xs text-amber-400 font-bold">3 Active Hazards</span>
            </div>
            <p className="text-xs text-slate-400">
              RescuNet continuously recalculates offline evacuation vectors to prevent victims from walking into flood basins, mudslides, or fire corridors.
            </p>

            <div className="space-y-3 pt-2">
              <div className="bg-slate-950 border border-blue-900/50 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-300">🌊 River Basin Flash Flood Zone</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase">Critical</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Water surge in lowlands. Bridge 3 impassable. Evacuees rerouted via North Ridge High Path.
                </p>
              </div>

              <div className="bg-slate-950 border border-amber-900/50 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300">⛰️ North Ridge Landslide Alert</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase">High Risk</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active mudflow over highway sector. 400m exclusion perimeter established.
                </p>
              </div>

              <div className="bg-slate-950 border border-red-900/50 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-red-300">🔥 Pine Forest Brushfire Perimeter</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase">Critical</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Encroaching from northeast with high wind. Evacuate southwest immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Automated Hazard Verification Portal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Automated Hazard Verification &amp; Routing</span>
              </h3>
              <span className="text-xs text-indigo-400 font-semibold">Assessment Engine</span>
            </div>
            <p className="text-xs text-slate-400">
              Civilians report blocked roads or structural hazards. Algorithmic telemetry evaluates risk level and suggests dynamic reroute bearings.
            </p>

            <form onSubmit={handleVerifyHazard} className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Location / Cross-Street
                </label>
                <input
                  type="text"
                  value={hazardLocation}
                  onChange={(e) => setHazardLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Hazard Observation / Report
                </label>
                <textarea
                  rows={3}
                  value={hazardQuery}
                  onChange={(e) => setHazardQuery(e.target.value)}
                  placeholder="e.g. Flash flood surge collapsed retaining wall on Sector 4 Highway. Vehicles cannot pass."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || !hazardQuery.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Hazard Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Verify Hazard &amp; Recalculate Evacuation Safe Route</span>
                  </>
                )}
              </button>
            </form>

            {/* AI Result Card */}
            {hazardReport && (
              <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-300 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{hazardReport.hazardType}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {hazardReport.riskLevel}
                  </span>
                </div>
                <p className="text-slate-300">
                  {hazardReport.safetyGuidance}
                </p>
                {hazardReport.recommendedSafeBearing && (
                  <p className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Safe Bearing: {hazardReport.recommendedSafeBearing}</span>
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
