'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Settings,
  User,
  Key,
  Sliders,
  Shield,
  Check,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Mail,
  Smartphone,
  Database,
  Bot,
  Lock,
  RefreshCw,
  Coins,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
} from 'lucide-react';
import { MessageChannel, MessageTone, DbCreditTransaction } from '@/types/db';
import { CREDIT_PACKAGES, LEAD_SEARCH_CREDIT_COST } from '@/lib/credits';

export default function SettingsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'preferences' | 'security' | 'credits'>(
    (searchParams.get('tab') as any) === 'credits' ? 'credits' : 'profile'
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credits Tab
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditTransactions, setCreditTransactions] = useState<DbCreditTransaction[]>([]);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Preferences Form
  const [defaultChannel, setDefaultChannel] = useState<MessageChannel>('whatsapp');
  const [defaultTone, setDefaultTone] = useState<MessageTone>('professional');
  const [defaultLanguage, setDefaultLanguage] = useState<'fr' | 'en'>('fr');

  // Security Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || '');
        setFullName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '');
        setCompanyName(currentUser.user_metadata?.company_name || '');
        if (currentUser.user_metadata?.default_channel) setDefaultChannel(currentUser.user_metadata.default_channel);
        if (currentUser.user_metadata?.default_tone) setDefaultTone(currentUser.user_metadata.default_tone);
        if (currentUser.user_metadata?.default_language) setDefaultLanguage(currentUser.user_metadata.default_language);
      }
    }
    loadUserData();
  }, []);

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      if (res.ok) {
        setCreditBalance(data.balance);
        setCreditTransactions(data.transactions || []);
      }
    } catch {
      // silent — the balance simply won't refresh this cycle
    }
  };

  useEffect(() => {
    loadCredits();

    // Coming back from a Moneroo checkout redirect — the webhook may still be
    // in flight, so poll briefly to pick up the freshly granted credits.
    const paymentStatus = searchParams.get('paymentStatus');
    if (searchParams.get('purchase') || paymentStatus) {
      setCreditNotice(
        paymentStatus === 'cancelled' || paymentStatus === 'failed'
          ? "Le paiement n'a pas abouti."
          : 'Paiement reçu, vérification en cours...'
      );
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        loadCredits();
        if (attempts >= 6) clearInterval(interval);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleBuyCredits = async (packageId: string) => {
    setBuyingPackageId(packageId);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible de lancer l'achat de crédits.");
      }
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors du lancement de l'achat.");
      setBuyingPackageId(null);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setErrorMessage(null);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          company_name: companyName,
          default_channel: defaultChannel,
          default_tone: defaultTone,
          default_language: defaultLanguage,
        },
      });

      if (error) throw error;
      triggerSuccess('Profil mis à jour avec succès !');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      triggerSuccess('Mot de passe modifié avec succès !');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil & Compte', icon: User },
    { id: 'credits', label: 'Crédits', icon: Coins },
    { id: 'integrations', label: 'Intégrations & APIs', icon: Key },
    { id: 'preferences', label: 'Préférences Prospection', icon: Sliders },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Settings className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
          </div>
          <span>Paramètres du compte</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gérez votre profil, vos clés d'intégration, vos préférences de prospection et la sécurité
        </p>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Tabs (Sidebar inside Settings) */}
        <div className="md:col-span-4 space-y-1.5 bg-white p-3 rounded-3xl border border-slate-100/90 shadow-sm h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setErrorMessage(null);
                  setSavedSuccess(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/90 shadow-sm">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Informations personnelles</h3>
                <p className="text-xs text-slate-400">Vos coordonnées visibles dans votre espace Vileads</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Adama Sangho"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email de connexion
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400">Géré par Supabase Auth</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nom de votre entreprise / Agence
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: IziSAAS Digital"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB CREDITS */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Crédits Vileads</h3>
                <p className="text-xs text-slate-400">
                  Chaque recherche de leads consomme {LEAD_SEARCH_CREDIT_COST} crédits. 5 crédits offerts à l'inscription.
                </p>
              </div>

              {creditNotice && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                  <span>{creditNotice}</span>
                </div>
              )}

              {/* Balance */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-amber-100">Solde actuel</div>
                  <div className="text-3xl font-black mt-0.5">
                    {creditBalance === null ? '—' : creditBalance}
                    <span className="text-sm font-semibold ml-1.5 text-amber-100">crédits</span>
                  </div>
                </div>
                <Coins className="w-10 h-10 text-amber-200/80" />
              </div>

              {/* Packages */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Acheter des crédits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="relative p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {pkg.badge}
                        </span>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-500">{pkg.label}</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{pkg.credits} <span className="text-sm font-semibold text-slate-400">crédits</span></div>
                        <div className="text-sm font-bold text-blue-600 mt-1">{pkg.amountXof.toLocaleString('fr-FR')} XOF</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuyCredits(pkg.id)}
                        disabled={buyingPackageId !== null}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        {buyingPackageId === pkg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                        <span>Acheter</span>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">Paiement sécurisé via Moneroo (Mobile Money & carte bancaire).</p>
              </div>

              {/* Transaction history */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historique</h4>
                {creditTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Aucune transaction pour le moment.</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {creditTransactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      const Icon = tx.type === 'signup_bonus' ? Gift : tx.type === 'purchase' ? ShoppingBag : tx.type === 'refund' ? RefreshCw : Zap;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-700 truncate">
                                {tx.description || tx.type}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(tx.created_at).toLocaleString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-bold shrink-0 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? '+' : ''}
                            {tx.amount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">État des intégrations &amp; Connecteurs</h3>
                <p className="text-xs text-slate-400">Statut des services connectés au SaaS Vileads</p>
              </div>

              <div className="space-y-4">
                {/* Supabase Status */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Base de Données &amp; Auth (Supabase)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Tables Searches, Leads &amp; Messages avec RLS active</p>
                      <span className="text-[11px] font-medium text-slate-400">Projet ID : ucywkgrrqhaqplpobouk</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connecté
                  </span>
                </div>

                {/* Apify Status */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Scraper Google Places (Apify)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Acteur officiel compass/crawler-google-places</p>
                      <span className="text-[11px] font-medium text-slate-400">Compte : convenient_rowan</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Opérationnel
                  </span>
                </div>

                {/* AI Model Status */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Moteur IA de Prospection</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Génération adaptative (Groq gratuit, Gemini gratuit ou Fallback intelligent)</p>
                      <span className="text-[11px] font-medium text-slate-400">Multi-canal : WhatsApp, Email, SMS</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Actif
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Préférences de Prospection par défaut</h3>
                <p className="text-xs text-slate-400">Définissez vos options favorites pour la génération des messages</p>
              </div>

              {/* Default Channel */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Canal de contact par défaut
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'emerald' },
                    { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
                    { id: 'sms', label: 'SMS', icon: Smartphone, color: 'purple' },
                  ].map((c) => {
                    const Icon = c.icon;
                    const isSelected = defaultChannel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDefaultChannel(c.id as MessageChannel)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Tone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ton de message par défaut
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'professional', label: 'Professionnel' },
                    { id: 'direct', label: 'Direct' },
                    { id: 'friendly', label: 'Chaleureux' },
                    { id: 'persuasive', label: 'Persuasif' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDefaultTone(t.id as MessageTone)}
                      className={`py-2 px-3 rounded-2xl text-xs font-medium border text-center transition-all ${
                        defaultTone === t.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Language */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Langue par défaut
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultLanguage('fr')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-medium border transition-all ${
                      defaultLanguage === 'fr'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    🇫🇷 Français (Par défaut)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultLanguage('en')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-medium border transition-all ${
                      defaultLanguage === 'en'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Sauvegarder les préférences</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sécurité du compte</h3>
                <p className="text-xs text-slate-400">Modifiez votre mot de passe de connexion</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimum 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Retapez le nouveau mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Mettre à jour le mot de passe</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
