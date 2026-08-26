'use client';

import React from 'react';
import { DbLead } from '@/types/db';
import {
  Building2,
  Phone,
  Globe,
  MapPin,
  Star,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface LeadRowProps {
  lead: DbLead;
  onOpenMessage: (lead: DbLead) => void;
}

export const LeadRow: React.FC<LeadRowProps> = ({ lead, onOpenMessage }) => {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 group">
      {/* Name & Category */}
      <td className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100/50">
            {lead.name ? lead.name.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              {lead.name || 'Sans nom'}
            </div>
            {lead.category && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                {lead.category}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Address */}
      <td className="py-4 px-4 text-xs text-slate-600 max-w-[220px]">
        {lead.address ? (
          <div className="flex items-start gap-1.5 line-clamp-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{lead.address}</span>
          </div>
        ) : (
          <span className="text-slate-300 italic">—</span>
        )}
      </td>

      {/* Phone */}
      <td className="py-4 px-4 text-xs">
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{lead.phone}</span>
          </a>
        ) : (
          <span className="text-slate-300 italic">—</span>
        )}
      </td>

      {/* Website */}
      <td className="py-4 px-4 text-xs">
        {lead.website ? (
          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline max-w-[150px] truncate"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        ) : (
          <span className="text-slate-300 italic">—</span>
        )}
      </td>

      {/* Rating */}
      <td className="py-4 px-4 text-xs">
        {lead.rating !== null && lead.rating !== undefined ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{lead.rating}</span>
            </div>
            {lead.reviews_count !== null && (
              <span className="text-slate-400 text-[11px]">({lead.reviews_count})</span>
            )}
          </div>
        ) : (
          <span className="text-slate-300 italic">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 px-4 text-right">
        <button
          type="button"
          onClick={() => onOpenMessage(lead)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200/80 transition-all shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Message IA</span>
        </button>
      </td>
    </tr>
  );
};
