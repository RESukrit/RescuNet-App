import React, { useState, useEffect } from 'react';
import { defaultAppConfig } from './defaultData';
import { AppConfig, SosSignal } from './types';
import { Navbar, ActiveViewType } from './components/Navbar';
import { VictimView } from './components/VictimView';
import { DashboardView } from './components/DashboardView';
import { SplitView } from './components/SplitView';
import { MeshNetworkView } from './components/MeshNetworkView';
import { WebsiteView } from './components/WebsiteView';
import { GitHubImporterModal } from './components/GitHubImporterModal';

const STORAGE_KEY = 'rescunet_github_app_config_v2';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure source is RESukrit/RescuNet if not set
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

  const [activeView, setActiveView] = useState<ActiveViewType>('dashboard');
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500/30 selection:text-white">
      {/* Navigation & Control Header */}
      <Navbar
        config={config}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenImporter={() => setIsImporterOpen(true)}
        onResetToDefault={handleResetToDefault}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeView === 'victim' && (
          <VictimView
            config={config}
            onNavigateToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            config={config}
            onOpenImporter={() => setIsImporterOpen(true)}
            onNavigateToWebsite={() => setActiveView('victim')}
          />
        )}

        {activeView === 'split' && (
          <SplitView
            config={config}
            onOpenImporter={() => setIsImporterOpen(true)}
            onNavigateToWebsite={() => setActiveView('victim')}
            onNavigateToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'mesh' && (
          <MeshNetworkView
            config={config}
            onNavigateToDashboard={() => setActiveView('dashboard')}
            onNavigateToVictim={() => setActiveView('victim')}
          />
        )}

        {activeView === 'overview' && (
          <WebsiteView
            config={config}
            onNavigateToDashboard={() => setActiveView('dashboard')}
            onOpenImporter={() => setIsImporterOpen(true)}
          />
        )}
      </main>

      {/* GitHub Importer & Reader Modal */}
      <GitHubImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onUpdateConfig={handleUpdateConfig}
        currentConfig={config}
      />
    </div>
  );
}
