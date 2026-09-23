'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CloudSun,
  Bot,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Compass,
  History,
  TrendingUp,
  MapPin,
  Settings,
  Info,
  Home,
  ChevronLeft,
  ChevronRight,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const authenticatedNavItems = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home, exact: true },
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/forecast', label: t('nav.forecast', 'Forecast'), icon: CloudSun },
    { to: '/chat', label: t('nav.chat', 'Ask WeatherGPT'), icon: Bot, badge: 'AI' },
    { to: '/alerts', label: t('nav.alerts', 'Disaster Alerts'), icon: AlertTriangle, badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    { to: '/risk', label: t('nav.risk', 'Risk Intelligence'), icon: ShieldCheck },
    { to: '/explorer', label: t('nav.explorer', 'Weather Explorer'), icon: Compass },
    { to: '/history', label: t('nav.history', 'Disaster History'), icon: History },
    { to: '/climate', label: t('nav.climate', 'Climate Trends'), icon: TrendingUp },
    { to: '/locations', label: t('nav.locations', 'Locations'), icon: MapPin },
    { to: '/admin', label: t('nav.admin', 'Admin Console'), icon: ShieldAlert, badge: 'OPS', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
    { to: '/about', label: t('nav.about', 'About / MoES'), icon: Info },
  ];

  const unauthenticatedNavItems = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home, exact: true },
    { to: '/login', label: t('common.signIn', 'Sign In'), icon: LogIn },
    { to: '/register', label: t('common.createAccount', 'Create Account'), icon: UserPlus },
    { to: '/admin', label: t('nav.admin', 'Admin Console'), icon: ShieldAlert, badge: 'OPS', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { to: '/about', label: t('nav.about', 'About / MoES'), icon: Info },
  ];

  const items = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <aside
      className={`hidden md:flex flex-col bg-navy-950 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.to
            : item.to === '/'
            ? pathname === '/'
            : pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && (item as any).badge && (
                <span
                  className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    (item as any).badgeColor || 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {(item as any).badge}
                </span>
              )}
            </Link>
          );
        })}

        {isAuthenticated && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors group mt-4 border border-transparent hover:border-red-500/30"
            title={collapsed ? t('common.signOut', 'Sign Out') : undefined}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 text-red-400 group-hover:scale-105 transition-transform" />
            {!collapsed && <span>{t('common.signOut', 'Sign Out')}</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <div className="text-[11px] text-slate-500 font-mono">
            SIH 26068 · MoES/IMD
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ml-auto"
          aria-label={collapsed ? t('nav.expandSidebar', 'Expand sidebar') : t('nav.collapseSidebar', 'Collapse sidebar')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
