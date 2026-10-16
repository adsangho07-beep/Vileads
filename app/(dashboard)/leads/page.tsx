import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { LeadsTable } from '@/components/LeadsTable';
import { DbLead } from '@/types/db';
import { DEMO_LEADS } from '@/lib/demo';
import { Users, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function AllLeadsPage() {
  const supabase = createClient();
  let user: any = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // Ignore error
  }

  let leads: DbLead[] = [];

  if (user) {
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      leads = data || [];
    } catch {
      // Fallback below
    }

    if (leads.length === 0 && user.id === '00000000-0000-0000-0000-000000000001') {
      leads = DEMO_LEADS;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span>Tous les Prospects</span>
            <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
              {leads.length} contacts
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Base centralisée de tous les leads extraits sur vos différentes campagnes africaines
          </p>
        </div>
      </div>

      {/* Global Table */}
      <LeadsTable leads={leads} searchName="tous-les-leads" />
    </div>
  );
}
