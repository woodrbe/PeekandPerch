import React, { useState } from 'react';
import { Sparkles, X, Mail, Lock, Github, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center mx-auto text-2xl shadow-md">
            🐦
          </div>

          <h3 className="text-2xl font-extrabold text-stone-900">
            Peep & Perch Club Sign-In
          </h3>

          <p className="text-xs text-stone-500">
            Access your synchronized backyard bird journal across devices.
          </p>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-stone-900">Welcome Back, Birdwatcher!</h4>
            <p className="text-xs text-stone-500">Opening Backyard Aviary Journal...</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Quick Social Logins */}
            <button
              onClick={() => {
                setIsSubmitted(true);
                setTimeout(() => { setIsSubmitted(false); onClose(); }, 1200);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 transition cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>Continue with GitHub</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
              <span className="relative bg-white px-3 text-[10px] uppercase font-mono text-stone-400">or with email</span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="birdwatcher@backyard.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Sign In to Peep & Perch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};
