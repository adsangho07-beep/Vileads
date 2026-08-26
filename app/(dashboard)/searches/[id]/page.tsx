'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DbSearch, DbLead } from '@/types/db';
import { StatusBadge } from '@/components/StatusBadge';
import { LeadsTable } from '@/components/LeadsTable';
import {
  ArrowLeft,
  Building,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function SearchDetailsPage() {
  const params = useParams();
  const searchId = params.id as string;

  const [search, setSearch] = useState<DbSearch | null>(null);
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!searchId) return;
    try {
      const res = await fetch(`/api/searches/${searchId}/status`);
      if (!res.ok) {
        throw new Error('Impossible de récupérer le statut de la recherche.');
      }
      const data = await res.json();
      if (data.search) {
        setSearch(data.search);
      }
      if (data.leads) {
        setLeads(data.leads);
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('Polling error:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling loop every 3 seconds while pending or running
  useEffect(() => {
    if (!search || (search.status !== 'pending' && search.status !== 'running')) {
      return;
    }

    const interval = setInterval(() => {
      setPollCount((prev) => prev + 1);
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [search, fetchStatus]);

  const isRunning = search?.status === 'running' || search?.status === 'pending';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au tableau de bord</span>
        </Link>

        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full border border-blue-100 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Actualisation automatique ({pollCount * 3}s écoulées)</span>
          </div>
        )}
      </div>

      {/* Header Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {search?.sector || 'Extraction en cours...'}
              </h1>
              {search && <StatusBadge status={search.status} />}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {search?.city}
                {search?.country ? `, ${search.country}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Objectif : max {search?.max_results || 50} leads
              </span>
              {search?.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(search.created_at).toLocaleDateString()} à{' '}
                  {new Date(search.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchStatus()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Live Progress Bar if Running */}
        {isRunning && (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                Scraping Google Places en cours sur Apify...
              </span>
              <span>Recherche active</span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3 transition-all duration-1000" />
            </div>
            <p className="text-[11px] text-blue-700">
              Le crawler analyse les fiches Google Maps pour extraire numéros de téléphone, sites web et avis. Les leads s'afficheront dès la fin du scraping.
            </p>
          </div>
        )}

        {/* Error message if Failed */}
        {search?.status === 'failed' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>La recherche a rencontré une erreur</span>
            </div>
            <p>{search.error_message || 'Échec de la tâche de scraping.'}</p>
          </div>
        )}
      </div>

      {/* Leads Table & Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Leads collectés</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {leads.length}
            </span>
          </h2>
        </div>

        <LeadsTable
          leads={leads}
          searchName={`${search?.sector || 'leads'}-${search?.city || 'afrique'}`}
        />
      </div>
    </div>
  );
}
