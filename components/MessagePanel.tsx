'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Globe,
  Loader2,
  RefreshCw,
  MessageSquare,
  Building,
  MapPin,
  Star,
  Send,
  Mail,
  Smartphone,
  Flame,
  Briefcase,
  Smile,
  Target,
  ExternalLink,
} from 'lucide-react';
import { DbLead, DbMessage, MessageChannel, MessageTone } from '@/types/db';

interface MessagePanelProps {
  lead: DbLead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({ lead, isOpen, onClose }) => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [tone, setTone] = useState<MessageTone>('professional');
  const [loading, setLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [history, setHistory] = useState<DbMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing messages when lead opens
  useEffect(() => {
    if (lead && isOpen) {
      setError(null);
      setCopied(false);
      fetchMessages(lead.id);
    } else {
      setCurrentMessage('');
      setHistory([]);
    }
  }, [lead, isOpen]);

  const fetchMessages = async (leadId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/leads/${leadId}/message`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setHistory(data.messages);
          setCurrentMessage(data.messages[0].content);
          if (data.messages[0].language) setLanguage(data.messages[0].language);
          if (data.messages[0].channel) setChannel(data.messages[0].channel);
          if (data.messages[0].tone) setTone(data.messages[0].tone);
        }
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!lead) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, channel, tone }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erreur lors de la génération du message.');
      }

      setCurrentMessage(data.message.content);
      setHistory((prev) => [data.message, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Impossible de générer le message.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentMessage) return;
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build direct action link (WhatsApp / Mail / SMS)
  const getDirectActionUrl = () => {
    if (!currentMessage) return null;
    const cleanPhone = lead?.phone ? lead.phone.replace(/[^\d+]/g, '') : '';

    if (channel === 'whatsapp') {
      const textParam = encodeURIComponent(currentMessage);
      if (cleanPhone) {
        // remove leading 00 or + for wa.me if standard
        const phoneFormatted = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
        return `https://wa.me/${phoneFormatted}?text=${textParam}`;
      }
      return `https://wa.me/?text=${textParam}`;
    }

    if (channel === 'email') {
      const lines = currentMessage.split('\n');
      let subject = `Opportunité pour ${lead?.name || 'votre entreprise'}`;
      let body = currentMessage;

      if (lines[0]?.toLowerCase().startsWith('objet:') || lines[0]?.toLowerCase().startsWith('subject:')) {
        subject = lines[0].replace(/^(objet:|subject:)/i, '').trim();
        body = lines.slice(1).join('\n').trim();
      }

      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    if (channel === 'sms' && cleanPhone) {
      return `sms:${cleanPhone}?body=${encodeURIComponent(currentMessage)}`;
    }

    return null;
  };

  const directActionUrl = getDirectActionUrl();

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Message de prospection IA</h2>
              <p className="text-xs text-slate-500">Rédigé sur-mesure selon le canal &amp; le ton</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Lead Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{lead.name}</span>
              </h3>
              {lead.rating && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {lead.rating}/5 ({lead.reviews_count || 0})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {lead.category && (
                <span className="text-xs font-medium text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-md">
                  {lead.category}
                </span>
              )}
              {lead.phone && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                  📞 {lead.phone}
                </span>
              )}
            </div>

            {lead.address && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{lead.address}</span>
              </p>
            )}
          </div>

          {/* 1. CHANNEL SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Canal de contact
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  channel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  channel === 'email'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  channel === 'sms'
                    ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>SMS</span>
              </button>
            </div>
          </div>

          {/* 2. TONE SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ton du message
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'professional', label: 'Professionnel', icon: Briefcase },
                { id: 'direct', label: 'Direct', icon: Target },
                { id: 'friendly', label: 'Chaleureux', icon: Smile },
                { id: 'persuasive', label: 'Persuasif', icon: Flame },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as MessageTone)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. LANGUAGE SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Langue de prospection
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium border transition-all ${
                  language === 'fr'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>🇫🇷</span> Français
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium border transition-all ${
                  language === 'en'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>🇬🇧</span> English
              </button>
            </div>
          </div>

          {/* Generate Action Button */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rédaction personnalisée en cours...</span>
                </>
              ) : currentMessage ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Régénérer avec ces options</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Générer le message ({channel.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Generated Message Display & Direct Actions */}
          {currentMessage ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Message prêt à l'envoi ({channel})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {currentMessage}
              </div>

              {/* Direct Quick Launch Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {directActionUrl && (
                  <a
                    href={directActionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        : channel === 'email'
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                        : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                    }`}
                  >
                    {channel === 'whatsapp' && (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ouvrir dans WhatsApp Web / App</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                    {channel === 'email' && (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Ouvrir dans votre client Email</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                    {channel === 'sms' && (
                      <>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Envoyer par SMS</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                  </a>
                )}
              </div>
            </div>
          ) : !loading && !loadingHistory ? (
            <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Aucun message généré</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Choisissez votre canal (WhatsApp, Email, SMS), le ton désiré, puis cliquez sur Générer.
              </p>
            </div>
          ) : null}

          {/* History of messages */}
          {history.length > 1 && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Historique des versions ({history.length})
              </h4>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {history.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    onClick={() => {
                      setCurrentMessage(msg.content);
                      if (msg.language) setLanguage(msg.language);
                      if (msg.channel) setChannel(msg.channel);
                      if (msg.tone) setTone(msg.tone);
                    }}
                    className={`p-3 rounded-xl text-xs cursor-pointer border transition-all ${
                      currentMessage === msg.content
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span className="font-bold uppercase text-slate-600 flex items-center gap-1">
                        <span>{msg.channel ? `[${msg.channel.toUpperCase()}]` : ''}</span>
                        <span>{msg.tone ? `• ${msg.tone}` : ''}</span>
                      </span>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="line-clamp-2 text-slate-600">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs text-slate-500">
          <span>Canal : {channel.toUpperCase()} • Ton : {tone}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
