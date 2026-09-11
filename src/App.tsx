import React, { useState, useEffect } from 'react';
import { defaultAppConfig } from './defaultData';
import { AppConfig } from './types';
import { Navbar, ActiveViewType } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal';
import { AdminPortal } from './components/AdminPortal';
import { DualSplitView } from './components/DualSplitView';
import { MeshNetworkView } from './components/MeshNetworkView';
import { WebsiteView } from './components/WebsiteView';
import { GitHubImporterModal } from './components/GitHubImporterModal';
import { HostingGuideModal } from './components/HostingGuideModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const STORAGE_KEY = 'rescunet_github_app_config_v2';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.source && parsed.source.url.includes('seksisukrit')) {
          return defaultAppConfig;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved config from localStorage:', e);
    }
    return defaultAppConfig;
  });

  // Check URL query parameters for direct standalone website access
  const [activeView, setActiveView] = useState<ActiveViewType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      if (portal === 'citizen' || portal === 'user' || portal === 'victim') return 'victim';
      if (portal === 'admin' || portal === 'eoc' || portal === 'command') return 'dashboard';
      if (portal === 'split' || portal === 'dual') return 'split';
    }
    return 'dashboard';
  });

  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);
  const [isHostingGuideOpen, setIsHostingGuideOpen] = useState<boolean>(false);

  // Sync with localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist config to localStorage:', e);
    }
  }, [config]);

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const handleResetToDefault = () => {
    setConfig(defaultAppConfig);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500/30 selection:text-white">
        {/* Navigation & Control Header */}
        <Navbar
          config={config}
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenImporter={() => setIsImporterOpen(true)}
          onResetToDefault={handleResetToDefault}
          onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
        />

        {/* Main View Area */}
        <main className="flex-1">
          {/* WEBSITE 1: CITIZEN SOS PORTAL */}
          {activeView === 'victim' && (
            <CitizenPortal
              config={config}
              onNavigateToAdmin={() => setActiveView('dashboard')}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* WEBSITE 2: EMERGENCY OPERATIONS CENTER (EOC) ADMIN COMMAND */}
          {activeView === 'dashboard' && (
            <AdminPortal
              config={config}
              onNavigateToCitizen={() => setActiveView('victim')}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* DUAL OPERATIONS LIVE BRIDGE: BOTH CONNECTED */}
          {activeView === 'split' && (
            <DualSplitView
              config={config}
              onSelectCitizen={() => setActiveView('victim')}
              onSelectAdmin={() => setActiveView('dashboard')}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* P2P MESH DIAGNOSTICS */}
          {activeView === 'mesh' && (
            <MeshNetworkView
              config={config}
              onNavigateToDashboard={() => setActiveView('dashboard')}
              onNavigateToVictim={() => setActiveView('victim')}
            />
          )}

          {/* PROJECT ARCHITECTURE & REPO SYNC */}
          {activeView === 'overview' && (
            <WebsiteView
              config={config}
              onNavigateToDashboard={() => setActiveView('dashboard')}
              onOpenImporter={() => setIsImporterOpen(true)}
            />
          )}
        </main>

        {/* Free Web Hosting & Cloudflare Guide Modal */}
        <HostingGuideModal
          isOpen={isHostingGuideOpen}
          onClose={() => setIsHostingGuideOpen(false)}
        />

        {/* GitHub Importer & Reader Modal */}
        <GitHubImporterModal
          isOpen={isImporterOpen}
          onClose={() => setIsImporterOpen(false)}
          onUpdateConfig={handleUpdateConfig}
          currentConfig={config}
        />
      </div>
    </ErrorBoundary>
  );
}
