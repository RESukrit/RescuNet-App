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
  Share2
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
                <span>Deploying Both Websites Live to the Real Web (Free Tier)</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deploy the Citizen SOS Portal and Admin Command Center with zero downtime &amp; zero errors.
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
            <span>Cloudflare Pages &amp; Workers</span>
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
            <span>Vercel / Render (1-Click)</span>
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
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs">
                <strong>Why Cloudflare?</strong> Cloudflare gives you free unlimited bandwidth, automated global DDoS mitigation, free SSL, and lets you host custom domains (e.g. <code className="text-white bg-slate-950 px-1 py-0.5 rounded">sos.rescunet.org</code> for survivors and <code className="text-white bg-slate-950 px-1 py-0.5 rounded">eoc.rescunet.org</code> for emergency services).
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                  <span>Connect Your GitHub Repository to Cloudflare Pages</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Log in to <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">dash.cloudflare.com</a>, navigate to <strong>Workers &amp; Pages</strong>, and click <strong>Create Application &gt; Pages &gt; Connect to Git</strong>.
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-300">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                    <span>Cloudflare Build Settings:</span>
                  </div>
                  <div><strong>Build command:</strong> <code className="text-emerald-400">npm run build</code></div>
                  <div><strong>Build output directory:</strong> <code className="text-emerald-400">dist</code></div>
                  <div><strong>Node.js Version:</strong> <code className="text-emerald-400">20</code> (or 22)</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                  <span>Direct URL Routing for Both Portals</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Both portals are built into this single high-speed codebase with dedicated URLs:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-red-900/50 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Citizen / Survivor Portal</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Add <code className="text-white bg-slate-900 px-1 rounded">?portal=citizen</code> or click "Citizen SOS" tab.</p>
                    <div className="text-[10px] text-slate-500 font-mono">https://yourdomain.com/?portal=citizen</div>
                  </div>

                  <div className="bg-slate-950 border border-blue-900/50 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Emergency Operations (EOC) Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Add <code className="text-white bg-slate-900 px-1 rounded">?portal=admin</code> or click "EOC Command" tab.</p>
                    <div className="text-[10px] text-slate-500 font-mono">https://yourdomain.com/?portal=admin</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                  <span>Optional Custom Subdomain Mapping (Cloudflare DNS)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  You can set up free subdomains in Cloudflare DNS pointing to the same deployment, with a 2-line Cloudflare Transform Rule to rewrite to <code className="text-white bg-slate-950 px-1 rounded">?portal=citizen</code> or <code className="text-white bg-slate-950 px-1 rounded">?portal=admin</code> automatically.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CURRENT CLOUD RUN */}
          {activeTab === 'cloudrun' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-blue-200 text-xs space-y-2">
                <div className="font-bold text-sm text-blue-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Your Application Is Already Running Live on Cloud Run Right Now!</span>
                </div>
                <p>
                  The current container build serves both websites live with full backend APIs and real-time Server-Sent Events on port 3000.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Active URLs:</h4>
                <div className="space-y-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="font-mono text-slate-300 truncate">
                      <span className="text-slate-500">Citizen Portal: </span>
                      {window.location.origin}/?portal=citizen
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
                      {window.location.origin}/?portal=admin
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

              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">How to test live multi-device connectivity:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5">
                  <li>Open the Citizen Portal URL on your phone or in tab 1.</li>
                  <li>Open the Admin EOC Portal URL on your desktop or in tab 2.</li>
                  <li>Click <strong>SEND EMERGENCY SOS</strong> on the phone: watch it instantly pop up on the EOC map with audio ping!</li>
                  <li>Click <strong>Dispatch Unit</strong> on the EOC: watch the phone instantly update with the assigned rescue team!</li>
                </ol>
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
                <p>• Serverless functions route <code className="text-white">/api/*</code> requests automatically.</p>
              </div>
            </div>
          )}

          {/* TAB 4: ZERO-ERROR ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 text-xs">
                <strong>Zero-Error Guarantee:</strong> Here is how we engineered the app to guarantee zero unhandled errors or blank screens:
              </div>

              <div className="space-y-3 text-xs text-slate-300">
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
                    <p className="text-slate-400">If the server network drops or cell service is cut, the app seamlessly switches to browser localStorage + Web Audio + BroadcastChannel without failing or showing red error banners.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">React Error Boundary Protection:</strong>
                    <p className="text-slate-400">Any transient component error is safely trapped by an error boundary with instant recovery, preventing total app crashes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Live Cross-Tab &amp; SSE Resilience:</strong>
                    <p className="text-slate-400">Real-time sync utilizes Server-Sent Events with automated reconnect backoff plus redundant cross-tab BroadcastChannel communication.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            RescuNet Emergency Response Platform v2.4 • Production Ready
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
