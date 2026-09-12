import React, { useState } from 'react';
import { Shield, Lock, ArrowLeft, CheckCircle, AlertTriangle, KeyRound } from 'lucide-react';

interface ResponderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: () => void;
}

export const ResponderAuthModal: React.FC<ResponderAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthorize,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim().toLowerCase();
    // Support standard responder PINs and passwords
    if (
      clean === '9110' ||
      clean === '1120' ||
      clean === 'admin' ||
      clean === 'rescunet' ||
      clean === 'rescue' ||
      clean === 'emergency' ||
      clean === '0000' ||
      clean === '1234' ||
      clean === 'password'
    ) {
      setError(false);
      onAuthorize();
    } else {
      setError(true);
    }
  };

  const handleQuickDemoPin = () => {
    setPin('9110');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-blue-900/60 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Emergency Responder Access
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                RESTRICTED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Disaster Operations &amp; Incident Command Center
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-5 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Authorized Personnel Only</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            This terminal contains confidential casualty triage, survivor GPS coordinates, and tactical team dispatch controls. Citizens should remain on the public Citizen SOS Portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Enter Responder PIN or Security Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={32}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter Passcode or PIN (9110)"
                autoFocus
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-wider text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Incorrect Passcode. (Responder demo code is 9110 or admin)</span>
              </p>
            )}
          </div>

          {/* Demo helper */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleQuickDemoPin}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <span>Demo PIN: <strong>9110</strong> (Click to auto-fill)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Citizen SOS</span>
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Unlock EOC Portal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
