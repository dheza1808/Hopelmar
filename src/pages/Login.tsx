import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, KeyRound, Eye, EyeOff, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('farah@hopelmar.co.id');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('sales');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, email);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle radial ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-200/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-amber-100/35 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-[430px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex flex-col items-center">
            <span className="text-[28px] font-black text-[#b91c1c] tracking-tight leading-none">
              hopelmar<sup className="text-xs text-slate-800 font-bold ml-0.5">®</sup>
            </span>
            <span className="text-[9px] font-extrabold text-slate-800 tracking-[0.3em] uppercase mt-1">
              LOGISTICS
            </span>
          </div>
        </div>

        {/* Warning Badge Banner */}
        <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3 flex items-start gap-3 mb-6">
          <div className="p-1 rounded bg-amber-100/80 text-amber-800 mt-0.5 shrink-0">
            <Shield className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-900 font-mono tracking-tight uppercase">
              AUTHORIZED INTERNAL STAFF ONLY
            </div>
            <div className="text-[10px] text-amber-800 font-mono mt-0.5">
              System Access Restricted • Unlawful attempts logged & audited
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wider mb-1.5">
              WORKSTATION ID / CORPORATE EMAIL
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
                  <path d="M7 8h10M7 12h5" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xxxxxxx@hopelmar.co.id"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Format: [username]@hopelmar.co.id or standard employee badge code
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wider mb-1.5">
              SECRET KEY / PASSCODE
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span className="text-slate-600 text-xs">Remember this workstation</span>
            </label>
            <a href="#forgot" className="text-red-600 font-medium hover:underline text-xs">
              Forgot credentials?
            </a>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-md shadow-red-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to MIS Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-mono tracking-wider">
            PT HOPELMAR INTERNATIONAL © 2025 • FREIGHT MANAGEMENT INFORMATION SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
};
