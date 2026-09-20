'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Bot,
  AlertTriangle,
  Menu,
  X,
  CloudSun,
  ShieldCheck,
  Compass,
  History,
  TrendingUp,
  MapPin,
  Settings,
  Info,
  ShieldAlert,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();
  const { role, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isAdminPermitted = role === 'admin';

  const primaryItems = isAuthenticated
    ? [
        { to: '/', label: 'Home', icon: Home, exact: true },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat', label: 'Ask AI', icon: Bot, isHighlight: true },
        { to: '/alerts', label: 'Alerts', icon: AlertTriangle, hasDot: true },
      ]
    : [
        { to: '/', label: 'Home', icon: Home, exact: true },
        { to: '/login', label: 'Sign In', icon: LogIn },
        { to: '/register', label: 'Register', icon: UserPlus, isHighlight: true },
        { to: '/about', label: 'About', icon: Info },
      ];

  const secondaryItems = isAuthenticated
    ? [
        ...(isAdminPermitted ? [{ to: '/admin', label: 'Admin Console', icon: ShieldAlert }] : []),
        { to: '/forecast', label: t('nav.forecast', 'Forecast'), icon: CloudSun },
        { to: '/risk', label: t('nav.risk', 'Risk Intelligence'), icon: ShieldCheck },
        { to: '/explorer', label: t('nav.explorer', 'Weather Explorer'), icon: Compass },
        { to: '/history', label: t('nav.history', 'Disaster History'), icon: History },
        { to: '/climate', label: t('nav.climate', 'Climate Trends'), icon: TrendingUp },
        { to: '/locations', label: t('nav.locations', 'Locations'), icon: MapPin },
        { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
        { to: '/about', label: t('nav.about', 'About / MoES'), icon: Info },
      ]
    : [
        { to: '/login', label: 'Sign In', icon: LogIn },
        { to: '/register', label: 'Create Account', icon: UserPlus },
        { to: '/about', label: t('nav.about', 'About / MoES'), icon: Info },
      ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-navy-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2"
        aria-label="Mobile Navigation"
      >
        {primaryItems.map((item) => {
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
              className={`flex flex-col items-center justify-center w-14 h-full relative text-[10px] font-medium transition-colors ${
                isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.isHighlight ? (
                <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 border-2 border-navy-950">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5" />
                  {item.hasDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
              )}
              <span className={item.isHighlight ? 'mt-0.5' : ''}>{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium text-slate-400 hover:text-slate-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 h-full bg-navy-900 border-l border-slate-800 p-5 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-5 h-5" />
                <span className="font-bold text-sm text-white">WeatherGPT</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAuthenticated && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      setIsDrawerOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              SIH 2026 Problem #26068 · MoES/IMD
            </div>
          </div>
        </div>
      )}
    </>
  );
};
