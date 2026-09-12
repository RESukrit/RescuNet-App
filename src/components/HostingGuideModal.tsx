import React, { useState } from 'react';
import { 
  Globe, 
  Cloud, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Zap, 
  Terminal, 
  X,
  Radio,
  Share2,
  AlertCircle,
  HelpCircle,
  Lock,
  MapPin
} from 'lucide-react';

interface HostingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingGuideModal: React.FC<HostingGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cloudflare' | 'cloudrun' | 'vercel' | 'architecture'>('cloudflare');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Deploying to Cloudflare Pages &amp; Live Web (Free Tier)</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deploy both the Citizen SOS Portal and Admin EOC with OpenStreetMap integration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cloudflare'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloudflare Pages Setup &amp; Fixes</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cloudrun'
                ? 'border-blue-400 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Current Cloud Run Live App</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'vercel'
                ? 'border-indigo-400 text-indigo-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Vercel / Netlify Deploy</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Error Architecture</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          
          {/* TAB 1: CLOUDFLARE */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-6">
              
              {/* Not seeing it on Cloudflare? Checklist */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs space-y-2">
                <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Why might you not be seeing it on Cloudflare Pages?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Build output directory:</strong> Ensure Cloudflare Pages output directory is set to <code className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">dist</code> (not build or public).</li>
                  <li><strong>Node.js Version:</strong> Cloudflare Pages defaults to Node 12 or 16 on older projects. We've included <code className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">.nvmrc</code> (Node 20). You can also add environment variable <code className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">NODE_VERSION = 20</code> in your Cloudflare dashboard.</li>
                  <li><strong>Public Citizen View vs. EOC Responder View:</strong> By default, visitors to your <code className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">.pages.dev</code> domain see the Citizen SOS screen. To view the Emergency Operations Center (EOC), add <code className="bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-mono">?portal=admin</code> or click "Authorized Responder Terminal Access" with PIN <strong>9110</strong>!</li>
                </ul>
              </div>

              {/* Deployment Option 1: Git Connect */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                  <span>Option A: Connect GitHub Repository to Cloudflare Pages (Recommended)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  In <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-semibold">dash.cloudflare.com</a> &gt; <strong>Workers &amp; Pages</strong> &gt; <strong>Create Application &gt; Pages &gt; Connect to Git</strong>:
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-300">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                    <span>Cloudflare Pages Build Settings:</span>
                  </div>
                  <div><strong>Framework preset:</strong> <code className="text-emerald-400">Vite</code> (or None)</div>
                  <div><strong>Build command:</strong> <code className="text-emerald-400">npm run build</code></div>
                  <div><strong>Build output directory:</strong> <code className="text-emerald-400">dist</code></div>
                  <div><strong>Root directory:</strong> <code className="text-slate-400">(leave blank)</code></div>
                  <div className="pt-2 border-t border-slate-900 text-slate-400">
                    <span>Environment Variables (Settings &gt; Environment variables):</span>
                    <div className="mt-1 text-emerald-400">NODE_VERSION = 20</div>
                  </div>
                </div>
              </div>

              {/* Deployment Option 2: Wrangler CLI */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                  <span>Option B: Direct 1-Line Deploy with Wrangler CLI</span>
                </h3>
                <p className="text-xs text-slate-300">
                  If you have Wrangler CLI installed on your machine, deploy in 10 seconds:
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>npx wrangler pages deploy dist --project-name=rescunet</code>
                  <button
                    onClick={() => copyToClipboard('npx wrangler pages deploy dist --project-name=rescunet', 'wrangler-cmd')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-sans transition-colors flex items-center gap-1"
                  >
                    {copiedCode === 'wrangler-cmd' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Portal URLs on Cloudflare */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                  <span>How to View Both Portals on Your Cloudflare Domain</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-red-900/50 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Citizen SOS Portal (Public)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">The default homepage for all citizens in distress.</p>
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-900 p-1.5 rounded">https://your-app.pages.dev/</div>
                  </div>

                  <div className="bg-slate-950 border border-blue-900/50 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Emergency Operations (EOC) Command</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Protected tactical terminal (Default PIN: <strong>9110</strong>).</p>
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-900 p-1.5 rounded">https://your-app.pages.dev/?portal=admin</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CURRENT CLOUD RUN */}
          {activeTab === 'cloudrun' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-blue-200 text-xs space-y-2">
                <div className="font-bold text-sm text-blue-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Your Application Is Already Running Live Right Now!</span>
                </div>
                <p>
                  The current container serves both portals live with genuine OpenStreetMap cartography on port 3000.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Active URLs:</h4>
                <div className="space-y-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="font-mono text-slate-300 truncate">
                      <span className="text-slate-500">Citizen Portal: </span>
                      {typeof window !== 'undefined' ? window.location.origin : ''}/?portal=citizen
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/?portal=citizen`, 'citizen')}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      {copiedCode === 'citizen' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="font-mono text-slate-300 truncate">
                      <span className="text-slate-500">Admin EOC Portal: </span>
                      {typeof window !== 'undefined' ? window.location.origin : ''}/?portal=admin
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/?portal=admin`, 'admin')}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      {copiedCode === 'admin' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                You can also deploy with one click to Vercel or Render.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-300">
                <div className="text-slate-500">// Terminal Deploy Command</div>
                <div className="text-emerald-400">npx vercel deploy --prod</div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p>• Framework Preset: <strong>Vite</strong></p>
                <p>• Output Directory: <strong>dist</strong></p>
              </div>
            </div>
          )}

          {/* TAB 4: ZERO-ERROR ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 text-xs">
                <strong>Zero-Error Guarantee:</strong> Here is how the application is optimized for stability:
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Authentic OpenStreetMap Integration:</strong>
                    <p className="text-slate-400">Directly uses standard OpenStreetMap tiles with Humanitarian (HOT) and Topo layers, without inverting filters or missing tile errors.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Strict NaN &amp; Undefined Guards:</strong>
                    <p className="text-slate-400">All input fields, GPS coordinate calculations, and battery telemetry are guarded with mathematical bounds to prevent invalid numbers or React warnings.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Dual Offline Fallbacks:</strong>
                    <p className="text-slate-400">If the server network drops, the app seamlessly switches to browser localStorage + Web Audio + BroadcastChannel without failing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            RescuNet Emergency Response Platform v2.4 • OpenStreetMap &amp; Cloudflare Ready
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
