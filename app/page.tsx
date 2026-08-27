import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default async function HomePage() {
  const supabase = createClient();

  let isAuthenticated = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Supabase not configured yet
  }

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo placeholder */}
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">Vileads</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link 
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition-colors"
            >
              Connexion
            </Link>
            <Link 
              href="/signup"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700 transition-colors shadow-sm"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-8 mx-auto shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Bienvenue sur <span className="text-brand-600">Vileads</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Générez plus de leads, plus rapidement. La plateforme tout-en-un pour développer votre activité et trouver vos futurs clients.
        </p>
        <div className="flex items-center gap-4">
          <Link 
            href="/signup"
            className="px-8 py-3 rounded-full bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 text-lg"
          >
            Commencer gratuitement
          </Link>
        </div>
      </main>
    </div>
  );
}
