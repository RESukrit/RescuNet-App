import React from 'react';
import { Radio, Shield, Globe, ExternalLink, Maximize2, Zap } from 'lucide-react';
import { AppConfig } from '../types';
import { CitizenPortal } from './CitizenPortal';
import { AdminPortal } from './AdminPortal';

interface DualSplitViewProps {
  config: AppConfig;
  onSelectCitizen: () => void;
  onSelectAdmin: () => void;
  onOpenHostingGuide: () => void;
}

export const DualSplitView: React.FC<DualSplitViewProps> = ({
  config,
  onSelectCitizen,
  onSelectAdmin,
  onOpenHostingGuide,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Dual Bridge Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-black">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>RescuNet Dual Operations Live Bridge</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>0ms Synchronized Channel (SSE + BroadcastChannel)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHostingGuide}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Deploy Free</span>
          </button>
          <button
            onClick={onSelectCitizen}
            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Citizen Fullscreen</span>
          </button>
          <button
            onClick={onSelectAdmin}
            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Split Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-800">
        
        {/* LEFT PANE: CITIZEN PORTAL */}
        <div className="relative overflow-y-auto max-h-[calc(100vh-50px)]">
          <div className="sticky top-0 z-20 bg-red-950/90 border-b border-red-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-red-200">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>WEBSITE 1: CITIZEN SURVIVOR SOS PORTAL</span>
            </span>
            <button
              onClick={() => window.open(`${window.location.origin}/?portal=citizen`, '_blank')}
              className="text-red-300 hover:text-white flex items-center gap-1"
            >
              <span>Open in New Window</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <CitizenPortal
            config={config}
            onNavigateToAdmin={onSelectAdmin}
            onOpenHostingGuide={onOpenHostingGuide}
          />
        </div>

        {/* RIGHT PANE: ADMIN COMMAND PORTAL */}
        <div className="relative overflow-y-auto max-h-[calc(100vh-50px)]">
          <div className="sticky top-0 z-20 bg-blue-950/90 border-b border-blue-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-blue-200">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>WEBSITE 2: EMERGENCY SERVICES (EOC) ADMIN COMMAND</span>
            </span>
            <button
              onClick={() => window.open(`${window.location.origin}/?portal=admin`, '_blank')}
              className="text-blue-300 hover:text-white flex items-center gap-1"
            >
              <span>Open in New Window</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <AdminPortal
            config={config}
            onNavigateToCitizen={onSelectCitizen}
            onOpenHostingGuide={onOpenHostingGuide}
          />
        </div>

      </div>
    </div>
  );
};
