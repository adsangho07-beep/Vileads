import React from 'react';
import { KpiCard } from '@/components/KpiCard';
import { BarChart2, TrendingUp, Users, Target, CheckCircle2, Award } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Analytics & Performance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Statistiques détaillées de vos campagnes d'extraction et de conversion en Afrique
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard title="Taux de complétion" value="96.4%" badge="↗ 2%" subtitle="Extraction Google" />
        <KpiCard title="Numéros valides" value="88.2%" badge="↗ 5%" subtitle="Téléphones récupérés" />
        <KpiCard title="Sites web trouvés" value="64.0%" badge="↗ 1%" subtitle="Présence en ligne" />
        <KpiCard title="Génération IA" value="100%" badge="↗ 0%" subtitle="Temps moyen 1.2s" />
      </div>

      {/* Charts breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Top Métropoles Ciblées</h3>
          <div className="space-y-3">
            {[
              { city: 'Dakar (Sénégal)', share: 38, count: '380 leads' },
              { city: 'Abidjan (Côte d\'Ivoire)', share: 29, count: '290 leads' },
              { city: 'Douala (Cameroun)', share: 18, count: '180 leads' },
              { city: 'Casablanca (Maroc)', share: 15, count: '150 leads' },
            ].map((item) => (
              <div key={item.city} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.city}</span>
                  <span className="text-slate-400">{item.count}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sectors */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Secteurs les plus performants</h3>
          <div className="space-y-3">
            {[
              { sector: 'Restaurants & Hôtels', share: 42, color: 'bg-blue-600' },
              { sector: 'Cliniques & Santé', share: 24, color: 'bg-blue-700' },
              { sector: 'BTP & Immobilier', share: 20, color: 'bg-blue-400' },
              { sector: 'Agences & Cabinets', share: 14, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.sector} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.sector}</span>
                  <span className="text-slate-400">{item.share}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
