import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber';
  subtitle?: string;
  icon?: LucideIcon;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  badge,
  badgeColor = 'blue',
  subtitle,
  icon: Icon,
}) => {
  const badgeColors = {
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-500">{title}</span>
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColors[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        {subtitle && <span className="text-xs text-slate-400 font-medium">{subtitle}</span>}
      </div>
    </div>
  );
};
