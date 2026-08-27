'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Veuillez confirmer votre adresse email.');
        }
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect.');
        }
        throw authError;
      }

      if (data.session) {
        window.location.href = redirect;
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Identifiants invalides.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto mt-8">
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500 font-medium">
            Connectez-vous pour accéder à vos campagnes
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Mot de passe"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[15px] transition-all disabled:opacity-50 mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Connexion par email</span>
            )}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed px-4">
        En vous connectant, vous acceptez nos{' '}
        <Link href="#" className="text-brand-600 hover:underline">Conditions d'utilisation</Link>{' '}
        et notre{' '}
        <Link href="#" className="text-brand-600 hover:underline">Politique de confidentialité</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col pt-12 md:pt-20 px-4 font-sans">
      {/* Brand Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 mb-2">
          {/* Using a text logo since we don't have the exact svg */}
          <span className="text-3xl font-bold">V</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Bienvenue sur Vileads
        </h1>
        <p className="text-slate-500 font-medium">
          La prospection intelligente dans votre poche
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
