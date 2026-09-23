'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Radio,
  Activity,
  History,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  MapPin,
  Cpu,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

type AdminTab =
  | 'overview'
  | 'users'
  | 'roles'
  | 'locations'
  | 'weather'
  | 'alerts'
  | 'reasoning'
  | 'health'
  | 'security';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  created_at: string;
  last_login: string;
  location_name?: string | null;
}

interface LocationStats {
  total: number;
  states: number;
  districts: number;
  cities: number;
  towns: number;
  source: string;
}

interface WeatherStationTelemetry {
  name: string;
  state: string;
  lat: number;
  lon: number;
  status: 'HEALTHY' | 'WARNING' | 'ERROR' | 'UNAVAILABLE';
  latencyMs: number;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode?: number | null;
  freshness: string;
  observedAt?: string;
  provider: string;
}

interface AuditItem {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  result: string;
  details?: Record<string, unknown> | null;
}

interface SystemHealthData {
  database: {
    status: string;
    latencyMs: number;
    type: string;
  };
  weatherProvider: {
    provider: string;
    status: string;
    latencyMs: number;
  };
  authSecurity: {
    status: string;
    jwtAlgorithm: string;
    cookieProtection: string;
  };
  runtime: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryHeapUsedMb: number;
    memoryRssMb: number;
  };
  totalCheckTimeMs: number;
  timestamp: string;
}

interface SystemConfigData {
  database: {
    status: string;
    engine: string;
    ssl: boolean;
  };
  jwtAuthentication: {
    status: string;
    algorithm: string;
    tokenLifetimeMinutes: number;
    secretConfigured: boolean;
  };
  weatherPipeline: {
    primaryProvider: string;
    providerType: string;
    apiKeyRequired: boolean;
    status: string;
  };
  ownerBootstrap: {
    status: string;
    bootstrapEmail: string | null;
  };
  environment: string;
  geminiAiKey: string;
}

interface ScenarioAlert {
  id: string;
  title: string;
  hazardType: string;
  severity: 'INFO' | 'WATCH' | 'WARNING' | 'SEVERE';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'CANCELLED';
  location: string;
  state: string;
  issuedAt: string;
  expiresAt: string;
  description: string;
}

const DEFAULT_SCENARIO_ALERTS: ScenarioAlert[] = [
  {
    id: 'drill-bob-cyclone-01',
    title: 'Drill Scenario: Tropical Cyclone Squall Advisory',
    hazardType: 'CYCLONE',
    severity: 'SEVERE',
    status: 'ACTIVE',
    location: 'Odisha & Andhra Coastal Belt',
    state: 'Odisha',
    issuedAt: '2026-09-22T08:00:00.000Z',
    expiresAt: '2026-09-24T08:00:00.000Z',
    description: 'Scenario test for coastal evacuation alerting. Sustained winds 65 kmph gusting to 80 kmph in model run.',
  },
  {
    id: 'drill-rajasthan-heat-02',
    title: 'Drill Scenario: Severe Heatwave Assessment',
    hazardType: 'HEATWAVE',
    severity: 'WARNING',
    status: 'ACTIVE',
    location: 'West Rajasthan Plain',
    state: 'Rajasthan',
    issuedAt: '2026-09-22T06:00:00.000Z',
    expiresAt: '2026-09-23T18:00:00.000Z',
    description: 'Thermal index exceeding 45°C across simulated station cluster.',
  },
  {
    id: 'drill-kerala-rain-03',
    title: 'Drill Scenario: High-Intensity Rainfall Trigger',
    hazardType: 'HEAVY_RAIN',
    severity: 'WATCH',
    status: 'PENDING_REVIEW',
    location: 'Wayanad Ghats',
    state: 'Kerala',
    issuedAt: '2026-09-22T10:00:00.000Z',
    expiresAt: '2026-09-23T10:00:00.000Z',
    description: 'Orographic precipitation surge model verification.',
  },
];

export const AdminControlCenter: React.FC = () => {
  const { user: currentUser, role: authRole, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Operational Data States (Live from Backend)
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userTotal, setUserTotal] = useState<number>(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(0);
  const userPageSize = 10;

  const [locationStats, setLocationStats] = useState<LocationStats>({
    total: 7392,
    states: 36,
    districts: 799,
    cities: 6470,
    towns: 922,
    source: 'GeoNames India Gazetteer — CC BY 4.0',
  });
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);

  const [weatherTelemetry, setWeatherTelemetry] = useState<WeatherStationTelemetry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfigData | null>(null);

  // Scenario Alert Testbed State (Clearly marked as drill simulation)
  const [scenarioAlerts, setScenarioAlerts] = useState<ScenarioAlert[]>(DEFAULT_SCENARIO_ALERTS);

  // Modals / Confirmation Dialogs
  const [roleChangeModal, setRoleChangeModal] = useState<{
    open: boolean;
    user: UserItem | null;
    proposedRole: string;
  }>({ open: false, user: null, proposedRole: 'user' });

  const [statusChangeModal, setStatusChangeModal] = useState<{
    open: boolean;
    user: UserItem | null;
    proposedStatus: 'ACTIVE' | 'SUSPENDED';
  }>({ open: false, user: null, proposedStatus: 'SUSPENDED' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const isSuperAdmin = Boolean(authRole && authRole.toLowerCase() === 'super_admin');
  const isAdmin = Boolean(authRole && (authRole.toLowerCase() === 'admin' || authRole.toLowerCase() === 'super_admin'));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch real users from backend
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set('search', userSearch.trim());
      if (userRoleFilter.trim()) params.set('role', userRoleFilter.trim());
      if (userStatusFilter.trim()) params.set('status', userStatusFilter.trim());
      params.set('limit', userPageSize.toString());
      params.set('offset', (userPage * userPageSize).toString());

      const res = await apiClient.get<{ users: UserItem[]; pagination: { total: number } }>(
        `/admin/users?${params.toString()}`
      );
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        setUserTotal(res.data.pagination?.total || 0);
      }
    } catch {
      showToast('Failed to load user registry from database.', 'error');
    }
  }, [userSearch, userRoleFilter, userStatusFilter, userPage]);

  // Fetch all operational data
  const loadOperationalData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // 1. Overview & Location stats
      const locRes = await apiClient.get<{ stats: LocationStats }>('/admin/locations');
      if (locRes.success && locRes.data?.stats) {
        setLocationStats(locRes.data.stats);
      }

      // 2. Weather telemetry monitor
      const weatherRes = await apiClient.get<{ stations: WeatherStationTelemetry[] }>('/admin/weather/monitor');
      if (weatherRes.success && weatherRes.data?.stations) {
        setWeatherTelemetry(weatherRes.data.stations);
      }

      // 3. System Health
      const healthRes = await apiClient.get<{ health: SystemHealthData }>('/admin/system/health');
      if (healthRes.success && healthRes.data?.health) {
        setSystemHealth(healthRes.data.health);
      }

      // 4. System Config
      const configRes = await apiClient.get<{ config: SystemConfigData }>('/admin/system/config');
      if (configRes.success && configRes.data?.config) {
        setSystemConfig(configRes.data.config);
      }

      // 5. Audit Logs
      const auditRes = await apiClient.get<{ logs: AuditItem[] }>('/admin/audit?limit=50');
      if (auditRes.success && auditRes.data?.logs) {
        setAuditLogs(auditRes.data.logs);
      }

      // 6. Users
      await fetchUsers();
      showToast('Operational telemetry synchronized with live PostgreSQL and Open-Meteo.', 'success');
    } catch {
      showToast('Operational synchronization encountered an issue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, fetchUsers]);

  useEffect(() => {
    if (isAdmin) {
      loadOperationalData();
    }
  }, [isAdmin, loadOperationalData]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  // Location search handler
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSearchQuery.trim()) return;
    setLocationSearching(true);
    try {
      const res = await apiClient.get<{ locations: any[] }>(
        `/location/search?query=${encodeURIComponent(locationSearchQuery.trim())}&limit=12`
      );
      if (res.success && res.data?.locations) {
        setLocationSearchResults(res.data.locations);
      } else {
        setLocationSearchResults([]);
      }
    } catch {
      showToast('Location search failed.', 'error');
    } finally {
      setLocationSearching(false);
    }
  };

  // Role change execution
  const handleConfirmRoleChange = async () => {
    if (!roleChangeModal.user) return;
    const { user, proposedRole } = roleChangeModal;
    try {
      const res = await apiClient.patch<{ user: UserItem }>(`/admin/users/${user.id}/role`, {
        role: proposedRole,
      });

      if (res.success) {
        showToast(`Role for ${user.email} updated to ${proposedRole.toUpperCase()}.`, 'success');
        setRoleChangeModal({ open: false, user: null, proposedRole: 'user' });
        fetchUsers();
        // Refresh audit log
        const auditRes = await apiClient.get<{ logs: AuditItem[] }>('/admin/audit?limit=50');
        if (auditRes.success && auditRes.data?.logs) setAuditLogs(auditRes.data.logs);
      } else {
        const errMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.message || 'Role update rejected by server authorization.';
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user role.', 'error');
    }
  };

  // Status toggle execution
  const handleConfirmStatusChange = async () => {
    if (!statusChangeModal.user) return;
    const { user, proposedStatus } = statusChangeModal;
    try {
      const res = await apiClient.patch<{ user: UserItem }>(`/admin/users/${user.id}/status`, {
        status: proposedStatus,
      });

      if (res.success) {
        showToast(`Status for ${user.email} updated to ${proposedStatus}.`, 'success');
        setStatusChangeModal({ open: false, user: null, proposedStatus: 'SUSPENDED' });
        fetchUsers();
        const auditRes = await apiClient.get<{ logs: AuditItem[] }>('/admin/audit?limit=50');
        if (auditRes.success && auditRes.data?.logs) setAuditLogs(auditRes.data.logs);
      } else {
        const errMsg =
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.message || 'Status change rejected by server authorization.';
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user status.', 'error');
    }
  };

  // Scenario alert action handlers
  const handleScenarioAlertStatus = (id: string, newStatus: 'ACTIVE' | 'CANCELLED') => {
    setScenarioAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`Drill scenario advisory '${id}' set to ${newStatus}.`, 'success');
  };

  // Render loading state while authenticating
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-[2px] animate-pulse">
          <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
            <img src="/weathergpt-logo.svg" alt="WeatherGPT" className="w-7 h-7 animate-spin-slow" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white font-sans">Verifying Administrative Credentials...</p>
          <p className="text-xs text-slate-400">Validating Server-Side Cryptographic Session</p>
        </div>
      </div>
    );
  }

  // Strict Server-Side Role Gating Enforcement
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-navy-900/90 border border-red-500/40 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">403 Forbidden: Administrative Access Required</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The <strong>WeatherGPT Operational Control Center</strong> is strictly protected by server-side authorization. Your authenticated role (<span className="text-sky-400 font-mono font-bold uppercase">{authRole || 'user'}</span>) does not possess administrative privileges.
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left text-[11px] font-mono text-slate-300 space-y-1">
            <div className="text-red-400 font-bold">SECURITY GATE ENFORCEMENT:</div>
            <div>• Authenticated Account: {currentUser?.email || 'Unknown'}</div>
            <div>• Verified Server Role: {authRole || 'user'}</div>
            <div>• Minimum Required: ADMIN / SUPER_ADMIN</div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Return to Citizen Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-medium shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/95 border-red-500/40 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP OPERATIONAL STATUS HEADER */}
      <header className="sticky top-0 z-40 bg-navy-950/90 border-b border-slate-800/90 backdrop-blur-md px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 via-amber-500/20 to-sky-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">WeatherGPT Mission Operations Grid</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase hidden sm:inline-block">
                    LIVE OPERATIONAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Secure Administrative Control Center · Server-Side Authorized
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">PostgreSQL:</span>
              <span className="font-mono text-emerald-300 font-semibold">ONLINE</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <ShieldCheck className={`w-3.5 h-3.5 ${isSuperAdmin ? 'text-purple-400' : 'text-sky-400'}`} />
              <span className="text-slate-300 font-mono font-bold">
                {isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
              </span>
              <span className="text-slate-500 hidden xl:inline">({currentUser?.email})</span>
            </div>

            <button
              onClick={loadOperationalData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
              title="Refresh Operational Telemetry"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY WITH RESPONSIVE SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-navy-950/95 lg:bg-navy-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Mission Command Modules
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {[
              { id: 'overview', label: 'Overview & KPIs', icon: Activity, badge: null },
              { id: 'users', label: 'Users Registry', icon: Users, badge: userTotal.toString() },
              { id: 'roles', label: 'Role & RBAC Matrix', icon: ShieldCheck, badge: '5 Tier' },
              { id: 'locations', label: 'Location Catalog', icon: MapPin, badge: '7,392' },
              { id: 'weather', label: 'Weather Telemetry', icon: Radio, badge: 'NWP' },
              { id: 'alerts', label: 'Scenario Alerts', icon: AlertTriangle, badge: scenarioAlerts.length.toString() },
              { id: 'reasoning', label: 'Reasoning Core', icon: Cpu, badge: 'Rules-v1' },
              { id: 'health', label: 'System Diagnostics', icon: Server, badge: null },
              { id: 'security', label: 'Security & Config', icon: Lock, badge: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as AdminTab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
            <div className="text-[10px] font-mono text-slate-500 space-y-1">
              <div>Session: {currentUser?.email}</div>
              <div>Authority: <span className="text-emerald-400 font-bold">{authRole}</span></div>
              <div>Database: PostgreSQL (Live)</div>
            </div>
          </div>
        </aside>

        {/* MAIN OPERATIONAL CONTENT AREA */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-900/80 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h1 className="text-lg font-bold text-white">System Operations Overview</h1>
                  <p className="text-xs text-slate-400">
                    High-level health of PostgreSQL, nationwide location gazetteer, and Open-Meteo NWP ingestion.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    SYSTEM HEALTHY
                  </span>
                </div>
              </div>

              {/* KPI STAT CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>REGISTERED USERS</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{userTotal}</div>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live PostgreSQL Table
                  </div>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>NATIONWIDE LOCALITIES</span>
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{locationStats.total.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {locationStats.states} States/UTs · {locationStats.districts} Districts
                  </div>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>WEATHER PROVIDER</span>
                    <Radio className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-lg font-bold text-sky-300">Open-Meteo NWP</div>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Numerical Models Active
                  </div>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>SCENARIO TEST ALERTS</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-300">{scenarioAlerts.length}</div>
                  <div className="text-[11px] text-amber-400 font-mono">
                    Drill Simulations Only
                  </div>
                </div>
              </div>

              {/* OPERATIONAL STATUS BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-sky-400" />
                      <span>Database & Storage Integrity</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Database Engine:</span>
                      <span className="font-mono text-white font-semibold">PostgreSQL (pg.Pool)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">User Persistence Table:</span>
                      <span className="font-mono text-white font-semibold">users (Active)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Location Catalog Table:</span>
                      <span className="font-mono text-white font-semibold">locations (7,392 Records)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Audit Trail Table:</span>
                      <span className="font-mono text-white font-semibold">audit_logs (Immutable)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Data Ingestion & Licensing Attribution</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      LICENSED
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Location Gazetteer:</span>
                      <span className="font-mono text-white font-semibold">GeoNames India Gazetteer</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Attribution License:</span>
                      <span className="font-mono text-amber-300 font-semibold">Creative Commons CC BY 4.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Numerical Weather Provider:</span>
                      <span className="font-mono text-white font-semibold">Open-Meteo NWP Grid</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Statutory Notice:</span>
                      <span className="text-slate-400 text-[11px]">Non-Governmental academic reference</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-900/80 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h1 className="text-lg font-bold text-white">Live PostgreSQL User Registry</h1>
                  <p className="text-xs text-slate-400">
                    Direct administration of citizen and staff accounts. Password hashes are never transmitted or displayed.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Total Users: <strong className="text-white">{userTotal}</strong>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-col md:flex-row gap-3 bg-navy-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(0);
                    }}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="">All Roles</option>
                    <option value="user">USER</option>
                    <option value="analyst">ANALYST</option>
                    <option value="operator">OPERATOR</option>
                    <option value="admin">ADMIN</option>
                    <option value="super_admin">SUPER_ADMIN</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setUserPage(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              {/* USERS TABLE */}
              <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-3.5">Name & User ID</th>
                        <th className="p-3.5">Email Address</th>
                        <th className="p-3.5">Assigned Role</th>
                        <th className="p-3.5">Account Status</th>
                        <th className="p-3.5">Registered / Last Active</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No users found matching query filters.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => {
                          const isSelf = currentUser?.email?.toLowerCase() === u.email.toLowerCase();
                          const targetIsSuperAdmin = (u.role || '').toLowerCase() === 'super_admin';
                          const canManageRole = isSuperAdmin || (!targetIsSuperAdmin && !isSelf);
                          const canManageStatus = !isSelf && (isSuperAdmin || !targetIsSuperAdmin);

                          return (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3.5">
                                <div className="font-bold text-white">{u.name || 'Unnamed User'}</div>
                                <div className="text-[10px] font-mono text-slate-500">{u.id}</div>
                              </td>
                              <td className="p-3.5 font-mono text-slate-300">
                                <span>{u.email}</span>
                                {isSelf && (
                                  <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                    YOU
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    (u.role || '').toLowerCase() === 'super_admin'
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      : (u.role || '').toLowerCase() === 'admin'
                                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                      : (u.role || '').toLowerCase() === 'analyst'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : (u.role || '').toLowerCase() === 'operator'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {u.role ? u.role.toUpperCase() : 'USER'}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}
                                >
                                  {u.status || 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-400 text-[11px] font-mono">
                                <div>Reg: {new Date(u.created_at).toLocaleDateString()}</div>
                                <div className="text-slate-500">
                                  Login: {u.last_login ? new Date(u.last_login).toLocaleTimeString() : 'Never'}
                                </div>
                              </td>
                              <td className="p-3.5 text-right space-x-2">
                                {canManageRole && (
                                  <button
                                    onClick={() =>
                                      setRoleChangeModal({
                                        open: true,
                                        user: u,
                                        proposedRole: (u.role || 'user').toLowerCase(),
                                      })
                                    }
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-sky-300 transition-colors font-medium"
                                  >
                                    Change Role
                                  </button>
                                )}

                                {canManageStatus && (
                                  <button
                                    onClick={() =>
                                      setStatusChangeModal({
                                        open: true,
                                        user: u,
                                        proposedStatus: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                                      u.status === 'ACTIVE'
                                        ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                    }`}
                                  >
                                    {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                  </button>
                                )}

                                {isSelf && (
                                  <span className="text-[10px] text-slate-500 italic">Self-Protected</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {userTotal > userPageSize && (
                  <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Showing {userPage * userPageSize + 1} to{' '}
                      {Math.min((userPage + 1) * userPageSize, userTotal)} of {userTotal} users
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                        disabled={userPage === 0}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUserPage((p) => p + 1)}
                        disabled={(userPage + 1) * userPageSize >= userTotal}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ROLE & RBAC MATRIX */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl">
                <h1 className="text-lg font-bold text-white">Role-Based Access Control (RBAC) Matrix</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enforced server-side via cryptographic JWT verification. Normal administrators cannot elevate themselves or other users to SUPER_ADMIN.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    role: 'SUPER_ADMIN',
                    color: 'purple',
                    title: 'System Owner & Root Administrator',
                    permissions: [
                      'Full administrative control over all modules',
                      'Assign and revoke ADMIN and SUPER_ADMIN roles',
                      'Sole super admin lockout protection enabled',
                      'Modify critical environment & system parameters',
                      'Access audit logs & system health endpoints',
                    ],
                  },
                  {
                    role: 'ADMIN',
                    color: 'sky',
                    title: 'Operations & Registry Administrator',
                    permissions: [
                      'Manage standard users, analysts, and operators',
                      'Activate / Suspend non-admin citizen accounts',
                      'Inspect nationwide location catalog & weather telemetry',
                      'Manage scenario alerts & risk thresholds',
                      'Cannot elevate anyone to SUPER_ADMIN or ADMIN',
                    ],
                  },
                  {
                    role: 'ANALYST',
                    color: 'emerald',
                    title: 'Meteorological & Risk Analyst',
                    permissions: [
                      'Read-only access to multi-hazard risk engine',
                      'Analyze historical post-disaster datasets',
                      'View weather model forecasts & station telemetry',
                      'Blocked from administrative control APIs (/api/admin/*)',
                    ],
                  },
                  {
                    role: 'OPERATOR',
                    color: 'amber',
                    title: 'Station & Ingestion Operator',
                    permissions: [
                      'Operational monitoring of station data streams',
                      'Verify telemetry freshness and sensor connectivity',
                      'Report offline nodes to engineering staff',
                      'Blocked from administrative control APIs (/api/admin/*)',
                    ],
                  },
                  {
                    role: 'USER',
                    color: 'slate',
                    title: 'Citizen & Public Researcher',
                    permissions: [
                      'Search 7,392 nationwide locations',
                      'View live coordinate weather & hourly forecasts',
                      'Interactive chat with Meteorological Reasoning Core',
                      'Strictly blocked from /admin and /api/admin/*',
                    ],
                  },
                ].map((item) => (
                  <div key={item.role} className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                          item.color === 'purple'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : item.color === 'sky'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : item.color === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : item.color === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.role}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {item.permissions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-sky-400 shrink-0">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LOCATION CATALOG */}
          {activeTab === 'locations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-white">Nationwide Location Catalog Explorer</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Query 7,392 nationwide Indian localities stored directly in the PostgreSQL locations table.
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-[11px] font-mono text-slate-400">
                  Attribution: <span className="text-amber-300 font-semibold">GeoNames India Gazetteer — CC BY 4.0</span>
                </div>
              </div>

              {/* STATS OVERVIEW */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-navy-900/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">TOTAL LOCALITIES</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">{locationStats.total}</div>
                </div>
                <div className="bg-navy-900/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">STATES & UTS</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">{locationStats.states}</div>
                </div>
                <div className="bg-navy-900/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">DISTRICTS</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">{locationStats.districts}</div>
                </div>
                <div className="bg-navy-900/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">CITIES & CAPITALS</div>
                  <div className="text-xl font-extrabold text-sky-400 mt-0.5">{locationStats.cities}</div>
                </div>
                <div className="bg-navy-900/60 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">TOWNS & HQ</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{locationStats.towns}</div>
                </div>
              </div>

              {/* SEARCH LOCATION CATALOG */}
              <form onSubmit={handleLocationSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Test live PostgreSQL nationwide search (e.g. Sambalpur, Siliguri, Thane, Varanasi)..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={locationSearching}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {locationSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* RESULTS LIST */}
              {locationSearchResults.length > 0 && (
                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
                    <span>Search Results from PostgreSQL ({locationSearchResults.length} matches)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                          <th className="p-3">Name</th>
                          <th className="p-3">District</th>
                          <th className="p-3">State</th>
                          <th className="p-3">Locality Type</th>
                          <th className="p-3">Coordinates</th>
                          <th className="p-3 text-right">Population</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {locationSearchResults.map((loc) => (
                          <tr key={loc.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-white">{loc.name}</td>
                            <td className="p-3 text-slate-300">{loc.district}</td>
                            <td className="p-3 text-slate-300">{loc.state}</td>
                            <td className="p-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                {loc.locality_type || 'Locality'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">
                              {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-300">
                              {loc.population ? Number(loc.population).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WEATHER TELEMETRY */}
          {activeTab === 'weather' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-white">Open-Meteo NWP Telemetry Monitoring</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live telemetry polled across key Indian benchmark locations via /api/weather/coordinates.
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Open-Meteo Numerical Prediction Grid</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Attribution Notice:</strong> Weather data is retrieved live from the Open-Meteo Numerical Weather Prediction (NWP) API. This dataset is not an official IMD Automatic Weather Station (AWS) hardware stream.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weatherTelemetry.length === 0 ? (
                  <div className="col-span-3 p-8 text-center text-slate-400 bg-navy-900/40 rounded-2xl border border-slate-800">
                    Loading live benchmark station telemetry...
                  </div>
                ) : (
                  weatherTelemetry.map((st, idx) => (
                    <div key={idx} className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-white">{st.name}</h2>
                          <div className="text-xs text-slate-400">{st.state}</div>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            st.status === 'HEALTHY'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div className="text-2xl font-extrabold text-white">
                          {st.temperature !== null ? `${st.temperature}°C` : 'N/A'}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          Latency: <span className="text-sky-300 font-bold">{st.latencyMs}ms</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                        <div>Humidity: {st.humidity !== null ? `${st.humidity}%` : 'N/A'}</div>
                        <div>Wind: {st.windSpeed !== null ? `${st.windSpeed} km/h` : 'N/A'}</div>
                        <div>Freshness: <span className="text-emerald-400">{st.freshness}</span></div>
                        <div>Provider: NWP</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SCENARIO ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-white">Scenario Alert Feed (Simulation / Drill Testbed)</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operational testing workbench for multi-hazard early warning broadcasts.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold self-start sm:self-auto">
                  SCENARIO DRILL TESTBED
                </span>
              </div>

              <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-3.5">Severity</th>
                        <th className="p-3.5">Scenario Title</th>
                        <th className="p-3.5">Region / State</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Validity</th>
                        <th className="p-3.5 text-right">Drill Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {scenarioAlerts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/30">
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                a.severity === 'SEVERE'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : a.severity === 'WARNING'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              }`}
                            >
                              {a.severity}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white">{a.title}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{a.description}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {a.location}, {a.state}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                a.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : a.status === 'PENDING_REVIEW'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            {new Date(a.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {a.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => handleScenarioAlertStatus(a.id, 'ACTIVE')}
                                className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold"
                              >
                                Sign-off
                              </button>
                            )}
                            {a.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleScenarioAlertStatus(a.id, 'CANCELLED')}
                                className="px-2.5 py-1 rounded bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-[11px] font-semibold"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: METEOROLOGICAL REASONING CORE */}
          {activeTab === 'reasoning' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-white">WeatherGPT Meteorological Reasoning Core</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Domain reasoning architecture: Deterministic meteorological heuristic rules + Live Open-Meteo telemetry.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CORE ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Reasoning Engine Architecture</div>
                  <div className="text-base font-bold text-white">Client Meteorological Reasoning</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Evaluates thermal indices, convective rainfall likelihood, barometric squalls, and air quality using deterministic meteorological rules.
                  </p>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Live Weather Ingestion</div>
                  <div className="text-base font-bold text-sky-400">/api/weather/coordinates</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Provides grounded real-time numerical weather parameters (temperature, wind gusts, precipitation probability) directly to the reasoning engine.
                  </p>
                </div>

                <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Multilingual Indian Support</div>
                  <div className="text-base font-bold text-emerald-400">12 Languages Active</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    English, Hindi, Bengali, Odia, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Assamese via LanguageContext.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-white">Infrastructure & Runtime Diagnostics</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time latency probes across database connections, external APIs, and Node.js runtime memory.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DIAGNOSTICS HEALTHY
                </span>
              </div>

              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="text-xs text-slate-400 font-mono uppercase">PostgreSQL Probe</div>
                    <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{systemHealth.database.status}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Ping Latency: <strong className="text-white">{systemHealth.database.latencyMs}ms</strong>
                    </div>
                  </div>

                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="text-xs text-slate-400 font-mono uppercase">Open-Meteo Ingestion</div>
                    <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{systemHealth.weatherProvider.status}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Probe Latency: <strong className="text-white">{systemHealth.weatherProvider.latencyMs}ms</strong>
                    </div>
                  </div>

                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="text-xs text-slate-400 font-mono uppercase">Node Runtime Memory</div>
                    <div className="text-xl font-bold text-sky-400">
                      {systemHealth.runtime.memoryHeapUsedMb} MB Heap
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      RSS: <strong className="text-white">{systemHealth.runtime.memoryRssMb} MB</strong>
                    </div>
                  </div>

                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="text-xs text-slate-400 font-mono uppercase">Server Process Uptime</div>
                    <div className="text-xl font-bold text-white">
                      {Math.floor(systemHealth.runtime.uptimeSeconds / 60)} mins
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Node: <strong className="text-white">{systemHealth.runtime.nodeVersion}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SECURITY & CONFIGURATION */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-navy-900/80 border border-slate-800 p-5 rounded-2xl">
                <h1 className="text-lg font-bold text-white">Security & Environment Configuration Center</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspection of server-side configuration presence. Secret values and passwords are never displayed.
                </p>
              </div>

              {systemConfig && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-sky-400" />
                      <span>Authentication & Session Security</span>
                    </h2>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">JWT Secret Status:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {systemConfig.jwtAuthentication.status}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Cryptographic Algorithm:</span>
                        <span className="font-mono text-white font-semibold">
                          {systemConfig.jwtAuthentication.algorithm}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Token Lifetime:</span>
                        <span className="font-mono text-white font-semibold">
                          {systemConfig.jwtAuthentication.tokenLifetimeMinutes} minutes (24h)
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Cookie Protection:</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          HttpOnly; SameSite=Lax; Secure
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-400" />
                      <span>Database & Bootstrap Configuration</span>
                    </h2>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">DATABASE_URL Status:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {systemConfig.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Super Admin Bootstrap:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {systemConfig.ownerBootstrap.status}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Bootstrap Owner Account:</span>
                        <span className="font-mono text-white font-semibold">
                          {systemConfig.ownerBootstrap.bootstrapEmail || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Runtime Environment:</span>
                        <span className="font-mono text-sky-400 font-semibold">
                          {systemConfig.environment}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RECENT AUDIT TRAIL STREAM */}
              <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-400" />
                    <h2 className="text-sm font-bold text-white">Live Administrative Audit Trail (PostgreSQL)</h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events Recorded</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Actor (Role)</th>
                        <th className="p-2.5">Target</th>
                        <th className="p-2.5 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                            No administrative audit records logged yet. Privileged actions will appear here automatically.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/30">
                            <td className="p-2.5 text-slate-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-2.5 font-bold text-sky-300">{log.action}</td>
                            <td className="p-2.5 text-slate-300">
                              {log.actor_email || log.actor_id} (
                              <span className="text-amber-400">{log.actor_role}</span>)
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {log.resource_type}:{log.resource_id}
                            </td>
                            <td className="p-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                {log.result}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRMATION MODAL: ROLE CHANGE */}
      {roleChangeModal.open && roleChangeModal.user && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm User Role Change</h3>
                <p className="text-[11px] text-slate-400">Enforce Server-Side Authorization Boundary</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400">Target User:</span>{' '}
                <strong className="text-white font-mono">{roleChangeModal.user.email}</strong>
              </div>
              <div>
                <span className="text-slate-400">Current Role:</span>{' '}
                <span className="font-mono text-sky-400 uppercase font-bold">
                  {roleChangeModal.user.role || 'user'}
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Select New Role:</label>
                <select
                  value={roleChangeModal.proposedRole}
                  onChange={(e) =>
                    setRoleChangeModal({ ...roleChangeModal, proposedRole: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:border-sky-500"
                >
                  <option value="user">USER (Standard Citizen)</option>
                  <option value="analyst">ANALYST (Risk & Weather Analytics)</option>
                  <option value="operator">OPERATOR (Station Operations)</option>
                  {isSuperAdmin && <option value="admin">ADMIN (Operational Administrator)</option>}
                  {isSuperAdmin && <option value="super_admin">SUPER_ADMIN (Root Authority)</option>}
                </select>
              </div>
              {!isSuperAdmin && (
                <div className="text-[11px] text-amber-300/90 leading-relaxed pt-1">
                  Note: As an ADMIN, you may assign user, analyst, and operator roles. Only a SUPER_ADMIN can grant ADMIN or SUPER_ADMIN status.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeModal({ open: false, user: null, proposedRole: 'user' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Confirm Role Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: STATUS CHANGE */}
      {statusChangeModal.open && statusChangeModal.user && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusChangeModal.proposedStatus === 'SUSPENDED'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirm User Account {statusChangeModal.proposedStatus === 'SUSPENDED' ? 'Suspension' : 'Activation'}
                </h3>
                <p className="text-[11px] text-slate-400">Administrative Account Governance</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <p>
                Are you sure you want to change the status of{' '}
                <strong className="text-white font-mono">{statusChangeModal.user.email}</strong> to{' '}
                <span
                  className={`font-mono font-bold ${
                    statusChangeModal.proposedStatus === 'SUSPENDED' ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {statusChangeModal.proposedStatus}
                </span>
                ?
              </p>
              {statusChangeModal.proposedStatus === 'SUSPENDED' && (
                <p className="text-[11px] text-red-300/90 leading-relaxed pt-1">
                  Suspended accounts are immediately blocked at the authentication API layer and denied session generation.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusChangeModal({ open: false, user: null, proposedStatus: 'SUSPENDED' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold ${
                  statusChangeModal.proposedStatus === 'SUSPENDED'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Confirm {statusChangeModal.proposedStatus === 'SUSPENDED' ? 'Suspension' : 'Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
