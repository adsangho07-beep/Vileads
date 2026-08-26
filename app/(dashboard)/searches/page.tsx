import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Send,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { DbSearch } from '@/types/db';

export const revalidate = 0;

export default async function SearchesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let searches: DbSearch[] = [];

  if (user) {
    const { data } = await supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    searches = data || [];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Toutes les Campagnes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos extractions de leads ciblées sur l'Afrique
          </p>
        </div>

        <Link
          href="/searches/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Campagne</span>
        </Link>
      </div>

      {/* Searches List Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
        {searches.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Aucune campagne pour l'instant</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Lancez votre première recherche pour scraper des prospects qualifiés sur Google Maps.
            </p>
            <Link
              href="/searches/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Créer une campagne</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Secteur / Mot-clé</th>
                  <th className="py-3 px-4">Localisation</th>
                  <th className="py-3 px-4">Objectif</th>
                  <th className="py-3 px-4">Date de création</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {searches.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{s.sector}</td>
                    <td className="py-4 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {s.city}
                        {s.country ? `, ${s.country}` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{s.max_results} leads max</td>
                    <td className="py-4 px-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/searches/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-colors shadow-sm"
                      >
                        <span>Ouvrir</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
