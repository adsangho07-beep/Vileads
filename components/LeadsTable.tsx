'use client';

import React, { useState, useMemo } from 'react';
import { DbLead } from '@/types/db';
import { LeadRow } from './LeadRow';
import { MessagePanel } from './MessagePanel';
import { ExportCsvButton } from './ExportCsvButton';
import { Search, Filter, Users, Building, PhoneCall } from 'lucide-react';

interface LeadsTableProps {
  leads: DbLead[];
  searchName?: string;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, searchName = 'vileads' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLeadForMessage, setActiveLeadForMessage] = useState<DbLead | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).slice(0, 8);
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        !searchTerm.trim() ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm);

      const matchCategory =
        selectedCategory === 'all' || lead.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [leads, searchTerm, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par nom, téléphone, mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Categories selector & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {categories.length > 0 && (
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Toutes les catégories ({leads.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ExportCsvButton
            leads={filteredLeads}
            filename={`leads-${searchName.toLowerCase().replace(/\s+/g, '-')}.csv`}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">Aucun lead trouvé</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {leads.length === 0
                ? 'Le scraping est en cours ou aucun résultat ne correspond à cette requête.'
                : 'Modifiez vos filtres de recherche pour afficher les leads correspondants.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Entreprise & Catégorie</th>
                  <th className="py-3 px-4">Adresse</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Site Web</th>
                  <th className="py-3 px-4">Avis Google</th>
                  <th className="py-3 px-4 text-right">Prospection</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onOpenMessage={(l) => setActiveLeadForMessage(l)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Message Slideover / Drawer */}
      <MessagePanel
        lead={activeLeadForMessage}
        isOpen={Boolean(activeLeadForMessage)}
        onClose={() => setActiveLeadForMessage(null)}
      />
    </div>
  );
};
