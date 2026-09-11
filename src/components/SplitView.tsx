import React from 'react';
import { VictimView } from './VictimView';
import { DashboardView } from './DashboardView';
import { AppConfig } from '../types';
import { Radio, LayoutDashboard, Zap } from 'lucide-react';

interface SplitViewProps {
  config: AppConfig;
  onOpenImporter: () => void;
  onNavigateToWebsite: () => void;
  onNavigateToDashboard: () => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  config,
  onOpenImporter,
  onNavigateToWebsite,
  onNavigateToDashboard,
}) => {
  return (
    <div className="w-full bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
      {/* Sub-bar explaining Dual Simulation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Real-Time Dual Simulation:</span>
            </span>
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <Radio className="w-3.5 h-3.5" /> Victim SOS Console (Left)
            </span>
            <span className="text-slate-600">⇄</span>
            <span className="flex items-center gap-1 text-blue-400 font-medium">
              <LayoutDashboard className="w-3.5 h-3.5" /> Command Triage Map (Right)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Press "SEND EMERGENCY SOS" on the left; watch it pop up on the triage map in real-time!
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-5 grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {/* Left Column: Victim SOS Portal */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-850 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Victim Emergency Beacon Interface</span>
            </div>
            <button
              onClick={onNavigateToWebsite}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
            >
              Full Screen Mode
            </button>
          </div>
          <div className="max-h-[86vh] overflow-y-auto">
            <VictimView
              config={config}
              onNavigateToDashboard={onNavigateToDashboard}
            />
          </div>
        </div>

        {/* Right Column: Command Dashboard */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-850 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Rescue Command Dashboard &amp; Leaflet Map</span>
            </div>
            <button
              onClick={onNavigateToDashboard}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
            >
              Full Screen Mode
            </button>
          </div>
          <div className="max-h-[86vh] overflow-y-auto">
            <DashboardView
              config={config}
              onOpenImporter={onOpenImporter}
              onNavigateToWebsite={onNavigateToWebsite}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
