'use client';

import React, { useState } from 'react';
import { Download, Check, AlertCircle } from 'lucide-react';
import { DbLead } from '@/types/db';
import { exportLeadsToCsv } from '@/lib/csv';

interface ExportCsvButtonProps {
  leads: DbLead[];
  filename?: string;
  className?: string;
}

export const ExportCsvButton: React.FC<ExportCsvButtonProps> = ({
  leads,
  filename = 'leads-vileads.csv',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      alert('Aucun lead à exporter pour le moment.');
      return;
    }

    const success = exportLeadsToCsv(leads, filename);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isDisabled = !leads || leads.length === 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
        isDisabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          : copied
          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>Exporté ({leads.length})</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Exporter résultats ({leads?.length || 0})</span>
        </>
      )}
    </button>
  );
};
