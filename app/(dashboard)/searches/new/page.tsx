import React from 'react';
import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NewSearchPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au Dashboard</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span>Générateur de Leads Google Maps</span>
          <span className="p-1 rounded-lg bg-blue-100/70 text-blue-700">
            <Sparkles className="w-4 h-4" />
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Ciblez n'importe quelle métropole ou région africaine pour extraire des coordonnées vérifiées et générer vos approches commerciales.
        </p>
      </div>

      {/* Form Card */}
      <SearchForm />
    </div>
  );
}
