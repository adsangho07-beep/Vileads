'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Send,
  Search,
  List,
  MessageSquare,
  BarChart2,
  Settings,
  LogOut,
  Hexagon,
  Sparkles,
  ChevronUp,
  User,
  Shield,
  Menu,
  X,
  Coins,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  userEmail?: string | null;
  userName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ userEmail, userName }) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/credits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setCreditBalance(data.balance);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Campaigns', href: '/searches', icon: Send },
    { label: 'Lead Search', href: '/searches/new', icon: Search },
    { label: 'Lists', href: '/leads', icon: List },
    { label: 'Conversations', href: '/messages', icon: MessageSquare },
    { label: 'Analytics', href: '/analytics', icon: BarChart2 },
    { label: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'Utilisateur');
  const initials = displayName
    .split(/[\s._-]+/)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'VI';

  return (
    <>
      {/* Mobile Top Navigation Bar (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 flex items-center justify-between z-40">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Hexagon className="w-4 h-4 fill-white/20 stroke-[2.2]" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">Vileads</span>
          <span className="text-[9px] uppercase font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
            SaaS
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop overlay on mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-100/90 flex flex-col justify-between h-screen z-50 transition-transform duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <Hexagon className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Vileads
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1.5 border border-blue-100">
                SaaS
              </span>
            </div>
          </Link>

          {/* Close button on mobile inside drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="px-4 space-y-1.5 flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:translate-x-0.5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-blue-600 group-hover:scale-110'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Credit Balance */}
        <div className="px-4 pb-2">
          <Link
            href="/settings?tab=credits"
            className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/80 hover:bg-amber-100/70 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Coins className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80">Crédits</div>
                <div className="text-sm font-black text-amber-900 leading-tight">
                  {creditBalance === null ? '—' : creditBalance}
                </div>
              </div>
            </div>
            <span className="p-1.5 rounded-lg bg-amber-600 text-white group-hover:bg-amber-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* User Profile Card with Popover Trigger */}
        <div className="p-4 border-t border-slate-100 relative" ref={profileRef}>
          {/* Profile Dropdown Popup (Opens upward) */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-3xl border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
              </div>

              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Paramètres du compte</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Sécurité &amp; Mot de passe</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}

          {/* Clickable Profile Card */}
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition-all duration-200 active:scale-[0.98] ${
              profileMenuOpen
                ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                : 'border-transparent hover:bg-slate-50 hover:border-slate-200/60'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-blue-500/25">
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {userEmail || 'connecté'}
                </div>
              </div>
            </div>

            <ChevronUp
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                profileMenuOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </div>
        </div>
      </aside>
    </>
  );
};
