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
import { ResponderAuthModal } from './components/ResponderAuthModal';
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

  // Responder authorization state (session scoped so every fresh visit starts at the rescue page and requires password)
  const [isResponderAuth, setIsResponderAuth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('rescunet_eoc_authorized') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingResponderView, setPendingResponderView] = useState<ActiveViewType>('dashboard');

  // ALWAYS start at the Citizen Rescue SOS Page ('victim')
  const [activeView, setActiveView] = useState<ActiveViewType>('victim');

  // Check on load if someone requested admin URL without being authorized yet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal')?.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      const wantsAdmin =
        portal === 'admin' ||
        portal === 'eoc' ||
        portal === 'command' ||
        portal === 'responder' ||
        pathname.includes('/admin') ||
        pathname.includes('/eoc') ||
        pathname.includes('/command') ||
        hash === '#admin' ||
        hash === '#eoc';

      if (wantsAdmin) {
        if (!isResponderAuth) {
          setPendingResponderView('dashboard');
          setShowAuthModal(true);
          setActiveView('victim');
        } else {
          setActiveView('dashboard');
        }
      }
    }
  }, [isResponderAuth]);

  // Handle switching views with responder protection
  const handleSelectView = (view: ActiveViewType) => {
    if (view !== 'victim' && !isResponderAuth) {
      setPendingResponderView(view);
      setShowAuthModal(true);
      return;
    }

    setActiveView(view);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (view === 'victim') {
          url.searchParams.set('portal', 'citizen');
        } else if (view === 'dashboard') {
          url.searchParams.set('portal', 'admin');
        } else if (view === 'split') {
          url.searchParams.set('portal', 'split');
        } else if (view === 'mesh') {
          url.searchParams.set('portal', 'mesh');
        } else {
          url.searchParams.delete('portal');
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleAuthorizeResponder = () => {
    setIsResponderAuth(true);
    try {
      sessionStorage.setItem('rescunet_eoc_authorized', 'true');
    } catch {}
    setShowAuthModal(false);
    setActiveView(pendingResponderView);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('portal', pendingResponderView === 'victim' ? 'citizen' : 'admin');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleLockEoc = () => {
    setIsResponderAuth(false);
    try {
      sessionStorage.removeItem('rescunet_eoc_authorized');
      localStorage.removeItem('rescunet_eoc_authorized');
    } catch {}
    setActiveView('victim');
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('portal', 'citizen');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

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
        
        {/* RESPONDER NAVBAR: ONLY visible to authorized personnel inside EOC / Responder views */}
        {activeView !== 'victim' && isResponderAuth && (
          <Navbar
            config={config}
            activeView={activeView}
            setActiveView={handleSelectView}
            onOpenImporter={() => setIsImporterOpen(true)}
            onResetToDefault={handleResetToDefault}
            onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            onLockEoc={handleLockEoc}
          />
        )}

        {/* Main View Area */}
        <main className="flex-1">
          {/* CITIZEN SOS PORTAL: Default, isolated view for citizens & victims */}
          {activeView === 'victim' && (
            <CitizenPortal
              config={config}
              onNavigateToAdmin={() => {
                setPendingResponderView('dashboard');
                setShowAuthModal(true);
              }}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* EMERGENCY OPERATIONS CENTER (EOC): Protected Responder Command */}
          {activeView === 'dashboard' && isResponderAuth && (
            <AdminPortal
              config={config}
              onNavigateToCitizen={handleLockEoc}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* DUAL OPERATIONS LIVE BRIDGE: Responders Only */}
          {activeView === 'split' && isResponderAuth && (
            <DualSplitView
              config={config}
              onSelectCitizen={() => handleSelectView('victim')}
              onSelectAdmin={() => handleSelectView('dashboard')}
              onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
            />
          )}

          {/* P2P MESH DIAGNOSTICS: Responders Only */}
          {activeView === 'mesh' && isResponderAuth && (
            <MeshNetworkView
              config={config}
              onNavigateToDashboard={() => handleSelectView('dashboard')}
              onNavigateToVictim={() => handleSelectView('victim')}
            />
          )}

          {/* PROJECT ARCHITECTURE & REPO SYNC: Responders Only */}
          {activeView === 'overview' && isResponderAuth && (
            <WebsiteView
              config={config}
              onNavigateToDashboard={() => handleSelectView('dashboard')}
              onOpenImporter={() => setIsImporterOpen(true)}
            />
          )}
        </main>

        {/* Responder Authentication Modal */}
        <ResponderAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            if (activeView !== 'victim' && !isResponderAuth) {
              setActiveView('victim');
            }
          }}
          onAuthorize={handleAuthorizeResponder}
        />

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
