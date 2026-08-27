'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { OTPInput } from '@/components/ui/otp-input';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup', // or 'email' depending on how it was sent, signup is standard for first verify
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Code invalide ou expiré.');
      setLoading(false);
    }
  };

  // Auto-verify when 6 digits are entered
  React.useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify();
    }
  }, [code]);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) throw resendError;
      setSuccess('Un nouveau code a été envoyé.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors du renvoi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto mt-8">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 text-brand-600 mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Vérifiez votre email</h2>
          <p className="text-sm text-slate-500 mt-2">
            Nous avons envoyé un code de vérification à
            <br />
            <strong className="text-slate-900">{email || 'votre adresse'}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2">
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <OTPInput
            length={6}
            value={code}
            onChange={setCode}
            disabled={loading}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification...
            </div>
          )}

          <div className="text-center mt-4">
            <p className="text-sm text-slate-500 mb-2">Vous n'avez pas reçu le code ?</p>
            <button
              onClick={handleResend}
              disabled={resendLoading || loading || !email}
              className="text-brand-600 font-semibold text-sm hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'Renvoi en cours...' : 'Renvoyer le code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col pt-12 md:pt-20 px-4 font-sans">
      {/* Brand Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Bienvenue sur Vileads
        </h1>
        <p className="text-slate-500 font-medium">
          La prospection intelligente dans votre poche
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
