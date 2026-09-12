import React from 'react';
import { 
  Radio, 
  LayoutDashboard, 
  Columns, 
  RefreshCw, 
  Download, 
  Github, 
  ExternalLink,
  Wifi,
  FileText,
  RotateCcw,
  Globe,
  ShieldCheck,
  Shield,
  Lock,
  LogOut
} from 'lucide-react';
import { AppConfig } from '../types';

export type ActiveViewType = 'victim' | 'dashboard' | 'split' | 'mesh' | 'overview';

interface NavbarProps {
  config: AppConfig;
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  onOpenImporter: () => void;
  onResetToDefault: () => void;
  onOpenHostingGuide?: () => void;
  onLockEoc?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeView,
  setActiveView,
  onOpenImporter,
  onResetToDefault,
  onOpenHostingGuide,
  onLockEoc,
  isSyncing = false,
}) => {
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rescunet-app-config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-900/40 bg-slate-900/95 backdrop-blur-md text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand & Responder Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/40 flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight truncate">
                RescuNet EOC
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1 animate-ping"></span>
                Tactical Terminal
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm flex items-center gap-1">
              <span>Authorized Responder Console</span>
            </p>
          </div>
        </div>

        {/* Center: Responder Command Tabs */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="view-dashboard-tab"
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Emergency Operations Center (EOC) Command Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Tactical EOC</span>
          </button>

          <button
            id="view-mesh-tab"
            onClick={() => setActiveView('mesh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'mesh'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="P2P Mesh Network Health & Packet Delivery"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Mesh Diagnostics</span>
          </button>

          <button
            id="view-split-tab"
            onClick={() => setActiveView('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'split'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dual Operations Live Bridge"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual Operations Bridge</span>
          </button>

          <button
            id="view-overview-tab"
            onClick={() => setActiveView('overview')}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 font-medium rounded-lg transition-all ${
              activeView === 'overview'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Architecture & Config"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </nav>

        {/* Right: Actions & Lock Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenHostingGuide && (
            <button
              onClick={onOpenHostingGuide}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
              title="Cloudflare Pages & Web Hosting Guide"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Deploy Guide</span>
            </button>
          )}

          <button
            id="connect-github-btn"
            onClick={onOpenImporter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Synchronize repository config"
          >
            <Github className="w-3.5 h-3.5 text-blue-400" />
            <span>Sync</span>
          </button>

          <button
            id="export-config-btn"
            onClick={handleExport}
            title="Export JSON specification"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Secure Lock & Exit to Public Citizen Site */}
          <button
            onClick={onLockEoc}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition-all shadow-sm"
            title="Lock terminal and exit to civilian Citizen SOS portal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit EOC</span>
          </button>
        </div>
      </div>
    </header>
  );
};
