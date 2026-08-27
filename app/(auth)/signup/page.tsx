'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      // Automatically redirect to the verify page after signup
      router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col pt-12 md:pt-20 px-4 font-sans">
      {/* Brand Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Bienvenue sur Vileads
        </h1>
        <p className="text-slate-500 font-medium">
          La prospection intelligente dans votre poche
        </p>
      </div>

      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-slate-800">Créez votre compte</h2>
            <p className="text-sm text-slate-500 mt-1">
              Un nouveau compte sera créé
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-4">
              <input
                type="email"
                required
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mot de passe (min 6 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password strength indicator - visual only for now */}
            {password.length > 0 && (
              <div className="flex gap-1.5 mt-3">
                <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[15px] transition-all disabled:opacity-50 mt-6 shadow-md shadow-brand-500/25"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Créer un compte</span>
              )}
            </button>
          </form>
          
          <div className="text-center mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed px-4">
          En créant un compte, vous acceptez nos{' '}
          <Link href="#" className="text-brand-600 hover:underline">Conditions d'utilisation</Link>{' '}
          et notre{' '}
          <Link href="#" className="text-brand-600 hover:underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
