import React from 'react';
import { SearchStatus } from '@/types/db';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: SearchStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'running':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse ${className}`}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          Scraping en cours...
        </span>
      );
    case 'succeeded':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Terminé avec succès
        </span>
      );
    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Échoué
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          En attente
        </span>
      );
  }
};
