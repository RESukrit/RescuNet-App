import React from 'react';
import { 
  Radio, 
  LayoutDashboard, 
  Columns, 
  RefreshCw, 
  Download, 
  Github, 
  Sparkles, 
  ExternalLink,
  Wifi,
  FileText,
  RotateCcw
} from 'lucide-react';
import { AppConfig } from '../types';

export type ActiveViewType = 'victim' | 'dashboard' | 'split' | 'mesh' | 'overview';

interface NavbarProps {
  config: AppConfig;
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  onOpenImporter: () => void;
  onResetToDefault: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeView,
  setActiveView,
  onOpenImporter,
  onResetToDefault,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand & Repository Link */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-900/40 flex-shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight truncate">
                RescuNet
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping"></span>
                GitHub Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm flex items-center gap-1">
              <span>Repo:</span>
              <a 
                href={config.source.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 truncate"
              >
                <span>RESukrit/RescuNet</span>
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            </p>
          </div>
        </div>

        {/* Center: View Switcher */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="view-victim-tab"
            onClick={() => setActiveView('victim')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'victim'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Victim SOS</span>
          </button>

          <button
            id="view-dashboard-tab"
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Command Map</span>
          </button>

          <button
            id="view-split-tab"
            onClick={() => setActiveView('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'split'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual Sim</span>
          </button>

          <button
            id="view-mesh-tab"
            onClick={() => setActiveView('mesh')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeView === 'mesh'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>P2P Mesh</span>
          </button>

          <button
            id="view-overview-tab"
            onClick={() => setActiveView('overview')}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 font-medium rounded-lg transition-all ${
              activeView === 'overview'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="connect-github-btn"
            onClick={onOpenImporter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">Sync / Read Repo</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            id="export-config-btn"
            onClick={handleExport}
            title="Export JSON specification"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
