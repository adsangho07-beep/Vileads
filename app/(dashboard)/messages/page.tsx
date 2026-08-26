import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { MessageSquare, Sparkles, Calendar, Globe, Building } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let messages: any[] = [];

  if (user) {
    const { data } = await supabase
      .from('messages')
      .select('*, leads(name, category, address, phone)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    messages = data || [];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <span>Messages IA Générés</span>
          <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
            {messages.length} messages
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Historique des accroches commerciales personnalisées rédigées par GPT-4o-mini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 px-4 bg-white rounded-3xl border border-slate-100">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Aucun message généré</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Ouvrez une fiche prospect dans une campagne pour générer votre première approche personnalisée.
            </p>
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accéder aux prospects</span>
            </Link>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-600" />
                      {msg.leads?.name || 'Prospect'}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {msg.leads?.category || 'Entreprise'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                    {msg.language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
                <span>Modèle : {msg.model || 'gpt-4o-mini'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
