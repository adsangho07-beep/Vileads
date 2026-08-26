'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building, Globe, Zap, Loader2, Sparkles } from 'lucide-react';

const AFRICAN_PRESETS = [
  { country: 'Sénégal', city: 'Dakar', flag: '🇸🇳' },
  { country: 'Côte d\'Ivoire', city: 'Abidjan', flag: '🇨🇮' },
  { country: 'Cameroun', city: 'Douala', flag: '🇨🇲' },
  { country: 'Maroc', city: 'Casablanca', flag: '🇲🇦' },
  { country: 'Nigeria', city: 'Lagos', flag: '🇳🇬' },
  { country: 'Kenya', city: 'Nairobi', flag: '🇰🇪' },
  { country: 'Rwanda', city: 'Kigali', flag: '🇷🇼' },
  { country: 'Bénin', city: 'Cotonou', flag: '🇧🇯' },
  { country: 'Togo', city: 'Lomé', flag: '🇹🇬' },
  { country: 'RDC', city: 'Kinshasa', flag: '🇨🇩' },
];

const SECTOR_SUGGESTIONS = [
  'Restaurants & Cafés',
  'Hôtels & Hébergement',
  'Cliniques & Médecins',
  'Pharmacies',
  'Agences Immobilières',
  'BTP & Construction',
  'Cabinets d\'Avocats',
  'Salons de Beauté & Coiffure',
  'Supermarchés & Épiceries',
  'Agences Marketing & Web',
  'Écoles & Centres de formation',
];

export const SearchForm: React.FC = () => {
  const router = useRouter();
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [maxResults, setMaxResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim() || !city.trim()) {
      setError('Veuillez renseigner un secteur d\'activité et une ville.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector,
          city,
          country,
          max_results: maxResults,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erreur lors du lancement de la recherche.');
      }

      router.push(`/searches/${data.searchId}`);
    } catch (err: any) {
      setError(err.message || 'Impossible de lancer la recherche.');
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: { country: string; city: string }) => {
    setCountry(preset.country);
    setCity(preset.city);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nouvelle recherche de prospects</h2>
            <p className="text-xs text-slate-500">
              Extraction ciblée sur Google Maps pour les entreprises du marché africain
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sector Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Secteur d'activité ou mot-clé *
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Restaurants, Agences Immobilières, Cliniques..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Sector Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {SECTOR_SUGGESTIONS.slice(0, 5).map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setSector(sec)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                >
                  + {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Location inputs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ville & Pays d'Afrique *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ville (ex: Dakar)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pays (ex: Sénégal)"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Quick Country/City Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {AFRICAN_PRESETS.slice(0, 6).map((preset) => (
                <button
                  type="button"
                  key={preset.city}
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    city === preset.city
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.flag} {preset.city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Max results selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nombre de prospects à extraire
            </span>
            <p className="text-xs text-slate-400">
              Limite maximale de résultats retournés par Google Maps
            </p>
          </div>

          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            {[20, 50, 100].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setMaxResults(num)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  maxResults === num
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {num} leads
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Démarrage du crawler Google Places...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Lancer l'extraction de leads</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
