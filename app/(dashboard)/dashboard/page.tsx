import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KpiCard } from '@/components/KpiCard';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Send,
  Search,
  Users,
  ChevronDown,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  Building,
  Star,
  ExternalLink,
} from 'lucide-react';
import { DbSearch, DbLead } from '@/types/db';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let searches: DbSearch[] = [];
  let recentLeads: DbLead[] = [];
  let totalLeadsCount = 0;
  let totalMessagesCount = 0;

  if (user) {
    const { data: sList } = await supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    searches = sList || [];

    const { data: lList, count: lCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    recentLeads = lList || [];
    totalLeadsCount = lCount || recentLeads.length;

    const { count: mCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    totalMessagesCount = mCount || 0;
  }

  const activeSearches = searches.filter((s) => s.status === 'running' || s.status === 'pending').length;
  const succeededSearches = searches.filter((s) => s.status === 'succeeded').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header matching CoreOS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Campaign Results
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1 leading-relaxed">
            Manage your prospect lists and track the quality of your contacts. Create new lists
            according to your own criteria, or import your own data. Each list can be used to launch a
            targeted prospecting campaign.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/searches/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Search className="w-4 h-4" />
            <span>Nouvelle recherche</span>
          </Link>
          <ExportCsvButton leads={recentLeads} filename="all-recent-leads.csv" />
        </div>
      </div>

      {/* Filters row from screenshot */}
      <div className="flex flex-wrap items-center gap-4 bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Campaigns
          </span>
          <div className="relative inline-flex items-center">
            <select className="appearance-none bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option>All campaigns ({searches.length})</option>
              {searches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sector} - {s.city}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dates
          </span>
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>All time</span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Row (directly from CoreOS screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Active Campaigns"
          value={activeSearches > 0 ? activeSearches : searches.length || 10}
          badge="↗ 3%"
          badgeColor="blue"
          subtitle={`${succeededSearches} terminées`}
        />
        <KpiCard
          title="Total Leads Extraits"
          value={totalLeadsCount > 0 ? totalLeadsCount : '150+'}
          badge="↗ 12%"
          badgeColor="blue"
          subtitle="Google Maps Africa"
        />
        <KpiCard
          title="Messages IA Rédigés"
          value={totalMessagesCount > 0 ? totalMessagesCount : '48'}
          badge="↗ 100%"
          badgeColor="blue"
          subtitle="GPT-4o-mini FR/EN"
        />
      </div>

      {/* Middle Grid: Opening Rate chart + Answers Type Donut + Last Answers list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Opening Rate Line Chart card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Opening rate</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">87%</div>
          </div>

          {/* SVG Smooth Dual Line Chart */}
          <div className="my-6 py-4">
            <svg viewBox="0 0 300 120" className="w-full h-28 overflow-visible">
              <defs>
                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#f1f5f9" strokeWidth="1" />

              {/* Curve 1 (Campaign 1) */}
              <path
                d="M 10 95 C 40 40, 70 110, 100 70 C 130 30, 160 90, 190 60 C 220 30, 250 80, 290 35"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Curve 2 (Campaign 2) */}
              <path
                d="M 10 110 C 40 85, 70 65, 100 85 C 130 95, 160 50, 190 75 C 220 85, 250 45, 290 55"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Campaign 1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
              <span>Campaign 2</span>
            </div>
          </div>
        </div>

        {/* Answers Type Donut Chart card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-500">Answers type</div>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center my-4">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="46" fill="transparent" stroke="#eff6ff" strokeWidth="16" />
              {/* Segment 1: Blue 600 */}
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="16"
                strokeDasharray="289"
                strokeDashoffset="100"
                strokeLinecap="round"
              />
              {/* Segment 2: Blue 800 */}
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="transparent"
                stroke="#1e3a8a"
                strokeWidth="16"
                strokeDasharray="289"
                strokeDashoffset="230"
              />
              {/* Segment 3: Blue 400 */}
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="transparent"
                stroke="#93c5fd"
                strokeWidth="16"
                strokeDasharray="289"
                strokeDashoffset="260"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">150</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Answers
              </span>
            </div>
          </div>

          {/* Legend pills */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Openings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-800" />
              <span>Appointments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Informations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Others</span>
            </div>
          </div>
        </div>

        {/* Last Answers / Leads Card (4 cols) directly from screenshot */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Last Answers</h3>
          </div>

          <div className="space-y-3 flex-1">
            {recentLeads.length > 0
              ? recentLeads.slice(0, 4).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                        {lead.name || 'Lead Anonyme'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lead.category || 'Commerce'} •{' '}
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/searches/${lead.search_id}`}
                      className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 -rotate-45" />
                    </Link>
                  </div>
                ))
              : [
                  { name: 'John Doe', date: '12/12/2024' },
                  { name: 'Amadou Diallo', date: '12/12/2024' },
                  { name: 'Koffi Mensah', date: '11/12/2024' },
                  { name: 'Fatou Sow', date: '10/12/2024' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Send className="w-3.5 h-3.5 -rotate-45" />
                    </div>
                  </div>
                ))}
          </div>

          <Link
            href="/leads"
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-[0.99]"
          >
            <span>See all answers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Searches Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recherches & Campagnes Récentes</h2>
            <p className="text-xs text-slate-500">
              Historique de vos extractions Google Maps en Afrique
            </p>
          </div>
          <Link
            href="/searches"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Voir toutes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {searches.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
            <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Aucune campagne lancée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Commencez par cibler un secteur d'activité et une ville africaine pour extraire vos premiers leads.
            </p>
            <Link
              href="/searches/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Créer ma première campagne</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Secteur</th>
                  <th className="py-3 px-3">Ville & Pays</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {searches.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{s.sector}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {s.city}
                      {s.country ? `, ${s.country}` : ''}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/searches/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-semibold text-slate-700 transition-colors"
                      >
                        <span>Voir leads</span>
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
