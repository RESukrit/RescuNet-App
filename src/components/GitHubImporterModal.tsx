import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Github, 
  Globe, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { AppConfig } from '../types';
import { defaultAppConfig } from '../defaultData';

interface GitHubImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  currentConfig: AppConfig;
}

export const GitHubImporterModal: React.FC<GitHubImporterModalProps> = ({
  isOpen,
  onClose,
  onUpdateConfig,
  currentConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'presets' | 'json'>('url');
  const [urlInput, setUrlInput] = useState(currentConfig.source.url || 'https://github.com/RESukrit/RescuNet');
  const [customNotes, setCustomNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(JSON.stringify(currentConfig, null, 2));

  if (!isOpen) return null;

  const handleFetchAndParse = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter your GitHub Page URL, GitHub profile, or repository link.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setProgressStep('Connecting to GitHub source...');

    try {
      // Step 1: Simulated progress feedback
      setTimeout(() => setProgressStep('Fetching website DOM and project metadata...'), 700);
      setTimeout(() => setProgressStep('Synthesizing website and operational dashboard...'), 1600);

      const response = await fetch('/api/parse-github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput.trim(),
          customNotes: customNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setProgressStep('Finalizing component layout...');
        const merged: AppConfig = {
          ...currentConfig,
          ...result.data,
          source: {
            url: urlInput.trim(),
            type: 'github_page',
            lastSynced: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        };
        onUpdateConfig(merged);
        setJsonText(JSON.stringify(merged, null, 2));
        setSuccessMessage(`Successfully read and generated app from ${urlInput}!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error('Could not parse GitHub page structure.');
      }
    } catch (err: any) {
      console.error('Failed to parse:', err);
      setErrorMessage(err.message || 'Failed to read GitHub Page. Check the URL and try again.');
    } finally {
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleApplyPreset = (preset: 'developer' | 'devops' | 'oss') => {
    let presetConfig: AppConfig = JSON.parse(JSON.stringify(defaultAppConfig));

    if (preset === 'developer') {
      presetConfig.profile.name = 'Sukrit S.';
      presetConfig.profile.headline = 'Full-Stack Software Engineer & Solutions Architect';
      presetConfig.source.url = 'https://seksisukrit.github.io';
    } else if (preset === 'devops') {
      presetConfig.profile.name = 'CloudOps Platform';
      presetConfig.profile.headline = 'Distributed Infrastructure & Observability Suite';
      presetConfig.source.url = 'https://github.com/seksisukrit/cloud-platform';
      presetConfig.website.hero.title = 'Resilient Kubernetes & Cloud Run Orchestration';
    } else if (preset === 'oss') {
      presetConfig.profile.name = 'Aurora Framework';
      presetConfig.profile.headline = 'Modern Web Components & Telemetry Toolkit';
      presetConfig.source.url = 'https://github.com/seksisukrit/aurora-toolkit';
      presetConfig.website.hero.title = 'High-Speed Web Framework & Analytics';
    }

    onUpdateConfig(presetConfig);
    setJsonText(JSON.stringify(presetConfig, null, 2));
    setSuccessMessage('Preset template applied!');
    setTimeout(() => onClose(), 800);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onUpdateConfig(parsed);
      setSuccessMessage('Configuration applied successfully!');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setErrorMessage('Invalid JSON format. Please correct syntax errors before saving.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="github-importer-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Read GitHub Page & Synthesize App</h2>
              <p className="text-xs text-slate-500">
                Connect your existing website and dashboard to auto-populate the application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-100 flex gap-4">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            GitHub URL / Page
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Ready Presets
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Config Schema
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Import Note</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Your GitHub Page, Repository, or Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    id="github-url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. https://github.com/RESukrit/RescuNet"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-slate-800"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Quick format examples:</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://github.com/RESukrit/RescuNet')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    RESukrit/RescuNet
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://github.com/RESukrit')}
                    className="text-indigo-600 hover:underline"
                  >
                    github.com/RESukrit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Custom Instructions / Focus Areas (Optional)
                </label>
                <textarea
                  id="github-notes-input"
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Emphasize offline mesh communication, prioritize high-severity trauma cases, highlight Palakkad sector coordinates..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 resize-none"
                />
              </div>

              {isLoading && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Synthesizing Website & Dashboard</p>
                    <p className="text-xs text-indigo-700">{progressStep || 'Processing page structure...'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Choose a pre-configured profile layout tailored for your projects:
              </p>

              <button
                type="button"
                onClick={() => {
                  onUpdateConfig(defaultAppConfig);
                  setSuccessMessage('RescuNet Emergency System configuration loaded successfully!');
                  setTimeout(() => onClose(), 600);
                }}
                className="w-full text-left p-4 rounded-xl border border-red-200 bg-red-50/40 hover:border-red-400 hover:bg-red-50 transition-all flex items-start justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-red-700 flex items-center gap-1.5">
                    <span>RescuNet Disaster Management & Mesh SOS</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">Active Project</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Direct synthesis of RESukrit/RescuNet: Victim emergency SOS portal, Leaflet triage command map, and P2P mesh network topology.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all mt-1" />
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('devops')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-start justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600">
                    DevOps & Cloud Platform Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Focused on CI/CD pipelines, Kubernetes container uptime, performance benchmarks, and infrastructure logs.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('oss')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-start justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600">
                    Open Source Library & Community Hub
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Optimized for component libraries, documentation, star growth velocity, release trackers, and npm download metrics.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1" />
              </button>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase">Direct JSON Editor</span>
                <span className="text-xs text-slate-400">Modify any field directly</span>
              </div>
              <textarea
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            RescuNet Emergency Systems Integration &amp; Repository Sync
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'url' && (
              <button
                id="fetch-synthesize-submit-btn"
                type="button"
                disabled={isLoading}
                onClick={handleFetchAndParse}
                className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Read Page & Build App</span>
                  </>
                )}
              </button>
            )}

            {activeTab === 'json' && (
              <button
                type="button"
                onClick={handleApplyJson}
                className="px-5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                Apply JSON Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
