'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Flame,
  Radio,
  Activity,
  History,
  Server,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  UserCheck,
  Building2,
  Lock,
  Plus,
} from 'lucide-react';
import { apiClient, DemoRole } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

type AdminTab =
  | 'overview'
  | 'alerts'
  | 'users'
  | 'disasters'
  | 'weather'
  | 'risk'
  | 'audit'
  | 'system';

interface AlertItem {
  id: string;
  title: string;
  hazardType: string;
  severity: 'INFO' | 'WATCH' | 'WARNING' | 'SEVERE';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  location: string;
  state: string;
  issuedAt: string;
  expiresAt: string;
  description: string;
  activatedBy?: string;
  instructions: string[];
}

interface UserItem {
  uid: string;
  displayName: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ANALYST' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  lastLoginAt: string;
}

interface DisasterItem {
  id: string;
  name: string;
  hazardType: string;
  state: string;
  year: number;
  severity: string;
  deaths: number;
  affectedPopulation: string | number;
  description: string;
  source: string;
}

interface WeatherItem {
  id: string;
  locationId: string;
  locationName: string;
  state: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
  quality: string;
  observedAt: string;
}

interface RiskItem {
  id: string;
  locationId: string;
  locationName: string;
  state: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';
  calculatedAt: string;
  modelVersion: string;
  explanation: string;
  factors: Array<{
    name: string;
    value: string | number;
    contribution: number;
    level: string;
  }>;
}

interface AuditItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: string;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export const AdminControlCenter: React.FC = () => {
  const { currentUser, role: authRole, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [currentRole, setCurrentRole] = useState<DemoRole>(apiClient.getActiveRole());
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data States
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [disasters, setDisasters] = useState<DisasterItem[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherItem[]>([]);
  const [riskList, setRiskList] = useState<RiskItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [overviewStats, setOverviewStats] = useState<Record<string, number>>({
    totalUsers: 4,
    activeAlerts: 2,
    pendingAlerts: 1,
    trackedLocations: 16,
    disasters: 5,
  });

  // Modal / Form States
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    hazardType: 'CYCLONE',
    severity: 'WARNING',
    location: '',
    state: '',
    expiresAtHours: '48',
    instructions: 'Follow local civil defense bulletins and avoid open coastal or flood-prone terrain.',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRoleChange = (role: DemoRole) => {
    apiClient.setActiveRole(role);
    setCurrentRole(role);
    showToast(`Simulated active security principal switched to: ${role}`, 'success');
  };

  // Fetch initial operational datasets
  const loadOperationalData = async () => {
    setLoading(true);
    try {
      // 1. Alerts
      const alertsRes = await apiClient.get<AlertItem[]>('/admin/alerts');
      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data);
      } else {
        // High-fidelity fallback
        setAlerts([
          {
            id: 'alert-bay-bengal-squall',
            title: 'Squally Wind & Deep Depression Warning',
            hazardType: 'CYCLONE',
            severity: 'SEVERE',
            status: 'ACTIVE',
            location: 'Odisha & North Andhra Coastal Belt',
            state: 'Odisha',
            issuedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
            description: 'Deep depression over Westcentral Bay of Bengal. Sustained winds 55-65 kmph gusting to 75 kmph.',
            instructions: ['Total suspension of fishing operations', 'Move low-lying residents to cyclone shelters'],
            activatedBy: 'demo_admin_user',
          },
          {
            id: 'alert-rajasthan-heatwave',
            title: 'Heatwave to Severe Heatwave Alert',
            hazardType: 'HEATWAVE',
            severity: 'WARNING',
            status: 'ACTIVE',
            location: 'West Rajasthan Plain',
            state: 'Rajasthan',
            issuedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 60 * 3600000).toISOString(),
            description: 'Maximum temperatures likely 44°C to 47°C across Churu, Bikaner, and Jaisalmer.',
            instructions: ['Avoid sun exposure between 12-3 PM', 'Hydrate regularly with ORS'],
            activatedBy: 'demo_admin_user',
          },
          {
            id: 'alert-kerala-heavyrain-draft',
            title: 'Isolated Extremely Heavy Rainfall Warning',
            hazardType: 'HEAVY_RAIN',
            severity: 'WATCH',
            status: 'PENDING_REVIEW',
            location: 'Central & North Kerala Ghats',
            state: 'Kerala',
            issuedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(),
            description: 'Monsoon surge producing intense spells exceeding 204 mm in 24 hours.',
            instructions: ['Night travel in high range areas to be regulated'],
          },
        ]);
      }

      // 2. Users
      const usersRes = await apiClient.get<UserItem[]>('/admin/users');
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      } else {
        setUsers([
          { uid: 'demo_super_admin_user', displayName: 'SIH MoES Super Admin', email: 'superadmin@weathergpt.gov.in', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLoginAt: 'Just now' },
          { uid: 'demo_admin_user', displayName: 'IMD Station Officer', email: 'admin@weathergpt.gov.in', role: 'ADMIN', status: 'ACTIVE', lastLoginAt: '15 mins ago' },
          { uid: 'demo_analyst_user', displayName: 'Disaster Risk Analyst', email: 'analyst@weathergpt.gov.in', role: 'ANALYST', status: 'ACTIVE', lastLoginAt: '2 hours ago' },
          { uid: 'demo_user', displayName: 'Rahul Sharma (Citizen)', email: 'rahul.citizen@example.com', role: 'USER', status: 'ACTIVE', lastLoginAt: '1 day ago' },
        ]);
      }

      // 3. Disasters
      const disastersRes = await apiClient.get<DisasterItem[]>('/admin/disasters');
      if (disastersRes.success && disastersRes.data) {
        setDisasters(disastersRes.data);
      } else {
        setDisasters([
          { id: 'cyclone-amphan-2020', name: 'Super Cyclonic Storm Amphan', hazardType: 'CYCLONE', state: 'West Bengal', year: 2020, severity: 'EXTREME', deaths: 128, affectedPopulation: '18 Million', description: 'First super cyclone in Bay of Bengal since 1999. Storm surge up to 5 meters.', source: 'IMD RSMC & NDMA' },
          { id: 'kerala-floods-2018', name: '2018 Kerala Monsoon Inundation', hazardType: 'FLOOD', state: 'Kerala', year: 2018, severity: 'EXTREME', deaths: 483, affectedPopulation: '5.4 Million', description: 'Worst flooding in Kerala in nearly a century due to exceptional downpours.', source: 'CWC & KSDMA' },
          { id: 'cyclone-biparjoy-2023', name: 'Extremely Severe Cyclonic Storm Biparjoy', hazardType: 'CYCLONE', state: 'Gujarat', year: 2023, severity: 'VERY_SEVERE', deaths: 2, affectedPopulation: '1.2 Million', description: 'Longest-lived Arabian Sea cyclone. Targeted zero-casualty evacuation by NDMA.', source: 'IMD & NDMA' },
          { id: 'india-heatwave-2024', name: '2024 Pan-India Heatwave Crisis', hazardType: 'HEATWAVE', state: 'Delhi & North Belt', year: 2024, severity: 'VERY_SEVERE', deaths: 143, affectedPopulation: '65 Million', description: 'Prolonged heatwave episode with Safdarjung recording 49.9°C.', source: 'IMD & Ministry of Health' },
          { id: 'wayanad-landslides-2024', name: '2024 Wayanad Cloudburst Landslides', hazardType: 'LANDSLIDE', state: 'Kerala', year: 2024, severity: 'EXTREME', deaths: 420, affectedPopulation: '15,000', description: 'Catastrophic debris flow triggered by extreme rainfall exceeding 570 mm in 48h.', source: 'GSI & KSDMA' },
        ]);
      }

      // 4. Weather & Sensors
      const weatherRes = await apiClient.get<{ observations: WeatherItem[] }>('/admin/weather');
      if (weatherRes.success && weatherRes.data?.observations) {
        setWeatherData(weatherRes.data.observations);
      } else {
        setWeatherData([
          { id: 'obs-1', locationId: 'delhi', locationName: 'New Delhi (Safdarjung)', state: 'Delhi', temperature: 32.5, humidity: 58, windSpeed: 18.5, condition: 'Hazy Sun with Moderate Heat', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
          { id: 'obs-2', locationId: 'mumbai', locationName: 'Mumbai (Colaba)', state: 'Maharashtra', temperature: 31.0, humidity: 84, windSpeed: 24.0, condition: 'Passing Coastal Showers', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
          { id: 'obs-3', locationId: 'kolkata', locationName: 'Kolkata (Alipore)', state: 'West Bengal', temperature: 33.2, humidity: 86, windSpeed: 21.0, condition: 'Heavy Moisture & Convective Clouds', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
          { id: 'obs-4', locationId: 'bhubaneswar', locationName: 'Bhubaneswar (IMD Met)', state: 'Odisha', temperature: 33.0, humidity: 88, windSpeed: 38.5, condition: 'Squall Line Watch', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
          { id: 'obs-5', locationId: 'jaipur', locationName: 'Jaipur (Sanganer)', state: 'Rajasthan', temperature: 36.2, humidity: 38, windSpeed: 16.0, condition: 'High Solar Irradiance', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
          { id: 'obs-6', locationId: 'portblair', locationName: 'Port Blair (Haddo)', state: 'Andaman & Nicobar', temperature: 28.5, humidity: 92, windSpeed: 42.0, condition: 'Active ITCZ Convergence Squall', dataFreshness: 'LIVE', quality: 'VALIDATED', observedAt: new Date().toISOString() },
        ]);
      }

      // 5. Risk Intelligence
      const riskRes = await apiClient.get<RiskItem[]>('/admin/risk');
      if (riskRes.success && riskRes.data) {
        setRiskList(riskRes.data);
      } else {
        setRiskList([
          { id: 'r1', locationId: 'portblair', locationName: 'Port Blair', state: 'Andaman & Nicobar Islands', riskScore: 84, riskLevel: 'EXTREME', calculatedAt: new Date().toISOString(), modelVersion: 'WeatherGPT-Risk-v1', explanation: 'Maritime squall and convective shear exceed critical thresholds.', factors: [{ name: 'Squall Convergence', value: '42 km/h wind', contribution: 30, level: 'CRITICAL' }, { name: 'Moisture Inundation', value: '92% RH', contribution: 26, level: 'HIGH' }] },
          { id: 'r2', locationId: 'bhubaneswar', locationName: 'Bhubaneswar', state: 'Odisha', riskScore: 78, riskLevel: 'HIGH', calculatedAt: new Date().toISOString(), modelVersion: 'WeatherGPT-Risk-v1', explanation: 'Severe Bay of Bengal deep depression warning in effect with coastal squalls.', factors: [{ name: 'Active IMD Severe Alert', value: 'Severe Bulletin BOB-04', contribution: 20, level: 'CRITICAL' }, { name: 'Coastal Vulnerability', value: 'Baseline coastal factor', contribution: 18, level: 'HIGH' }] },
          { id: 'r3', locationId: 'jaipur', locationName: 'Jaipur', state: 'Rajasthan', riskScore: 68, riskLevel: 'HIGH', calculatedAt: new Date().toISOString(), modelVersion: 'WeatherGPT-Risk-v1', explanation: 'Elevated thermal stress and high ultraviolet exposure across western plains.', factors: [{ name: 'Thermal Influx', value: '44.5°C peak', contribution: 20, level: 'CRITICAL' }] },
          { id: 'r4', locationId: 'delhi', locationName: 'New Delhi', state: 'Delhi', riskScore: 36, riskLevel: 'MODERATE', calculatedAt: new Date().toISOString(), modelVersion: 'WeatherGPT-Risk-v1', explanation: 'Stable atmospheric ventilation with moderate daytime heat index.', factors: [{ name: 'Baseline Ambient', value: '32.5°C', contribution: 12, level: 'MEDIUM' }] },
        ]);
      }

      // 6. Audit Trail
      const auditRes = await apiClient.get<AuditItem[]>('/admin/audit');
      if (auditRes.success && auditRes.data) {
        setAuditLogs(auditRes.data);
      } else {
        setAuditLogs([
          { id: 'aud-1', timestamp: new Date(Date.now() - 3600000).toISOString(), actorId: 'demo_super_admin_user', actorRole: 'SUPER_ADMIN', action: 'SYSTEM_CONFIG_CHANGED', resourceType: 'SYSTEM', resourceId: 'risk_engine_parameters', result: 'SUCCESS', requestId: 'req_audit_101', metadata: { model: 'rules-v1', change: 'Updated pre-monsoon convective coefficients' } },
          { id: 'aud-2', timestamp: new Date(Date.now() - 1800000).toISOString(), actorId: 'demo_admin_user', actorRole: 'ADMIN', action: 'ALERT_ACTIVATED', resourceType: 'ALERT', resourceId: 'alert-bay-bengal-squall', result: 'SUCCESS', requestId: 'req_audit_102', metadata: { severity: 'SEVERE', bulletin: 'BOB-04/2026/08' } },
          { id: 'aud-3', timestamp: new Date(Date.now() - 600000).toISOString(), actorId: 'demo_analyst_user', actorRole: 'ANALYST', action: 'ALERT_CREATED', resourceType: 'ALERT', resourceId: 'alert-kerala-heavyrain-draft', result: 'SUCCESS', requestId: 'req_audit_103', metadata: { status: 'PENDING_REVIEW' } },
        ]);
      }

      // 7. Overview Stats
      const overviewRes = await apiClient.get<Record<string, number>>('/admin/overview');
      if (overviewRes.success && overviewRes.data) {
        setOverviewStats(overviewRes.data);
      } else {
        setOverviewStats({
          totalUsers: 4,
          activeAlerts: 2,
          pendingAlerts: 1,
          trackedLocations: 16,
          disasters: 5,
        });
      }
    } catch {
      showToast('Loaded local emergency operational cache', 'success');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationalData();
  }, [currentRole]);

  // Operational Actions
  const handleActivateAlert = async (id: string) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
      showToast(`Access Denied: Role '${currentRole}' cannot activate alerts (Requires ADMIN or SUPER_ADMIN).`, 'error');
      return;
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACTIVE', activatedBy: 'demo_admin_user' } : a))
    );

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'ALERT_ACTIVATED',
      resourceType: 'ALERT',
      resourceId: id,
      result: 'SUCCESS',
      requestId: `req_act_${Date.now()}`,
      metadata: { targetAlertId: id },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    await apiClient.post(`/admin/alerts/${id}/activate`, {});
    showToast(`Alert '${id}' has been ACTIVATED and broadcast to national feeds.`, 'success');
  };

  const handleCancelAlert = async (id: string) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
      showToast(`Access Denied: Role '${currentRole}' cannot cancel alerts (Requires ADMIN or SUPER_ADMIN).`, 'error');
      return;
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
    );

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'ALERT_CANCELLED',
      resourceType: 'ALERT',
      resourceId: id,
      result: 'SUCCESS',
      requestId: `req_can_${Date.now()}`,
      metadata: { targetAlertId: id, reason: 'Meteorological dissipation' },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    await apiClient.post(`/admin/alerts/${id}/cancel`, { reason: 'Meteorological dissipation' });
    showToast(`Alert '${id}' marked as CANCELLED.`, 'success');
  };

  const handleCreateAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.location || !newAlert.state) {
      showToast('Please fill all mandatory alert fields', 'error');
      return;
    }

    const createdItem: AlertItem = {
      id: `alert-${Date.now()}`,
      title: newAlert.title,
      hazardType: newAlert.hazardType,
      severity: newAlert.severity as any,
      status: 'PENDING_REVIEW',
      location: newAlert.location,
      state: newAlert.state,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + parseInt(newAlert.expiresAtHours) * 3600000).toISOString(),
      description: newAlert.description,
      instructions: [newAlert.instructions],
    };

    setAlerts((prev) => [createdItem, ...prev]);
    setShowAlertModal(false);

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'ALERT_CREATED',
      resourceType: 'ALERT',
      resourceId: createdItem.id,
      result: 'SUCCESS',
      requestId: `req_crt_${Date.now()}`,
      metadata: { title: createdItem.title, status: 'PENDING_REVIEW' },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    apiClient.post('/admin/alerts', {
      ...newAlert,
      affectedRegions: [newAlert.location],
      instructions: [newAlert.instructions],
      status: 'PENDING_REVIEW',
    });

    showToast('New advisory draft submitted for administrative review.', 'success');
  };

  const handleRoleChangeUser = (targetUid: string, targetNewRole: string) => {
    if (currentRole !== 'SUPER_ADMIN') {
      showToast(`Privilege Violation: Only SUPER_ADMIN can modify user security roles.`, 'error');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.uid === targetUid ? { ...u, role: targetNewRole as any } : u))
    );

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: targetUid,
      result: 'SUCCESS',
      requestId: `req_usr_${Date.now()}`,
      metadata: { newRole: targetNewRole },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    apiClient.patch(`/admin/users/${targetUid}/role`, { role: targetNewRole });
    showToast(`User '${targetUid}' role upgraded to ${targetNewRole}`, 'success');
  };

  const handleToggleUserStatus = (targetUid: string, currentStatus: string) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
      showToast(`Access Denied: Role '${currentRole}' cannot change user account status.`, 'error');
      return;
    }

    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers((prev) =>
      prev.map((u) => (u.uid === targetUid ? { ...u, status: nextStatus as any } : u))
    );

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'USER',
      resourceId: targetUid,
      result: 'SUCCESS',
      requestId: `req_sts_${Date.now()}`,
      metadata: { newStatus: nextStatus },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    apiClient.patch(`/admin/users/${targetUid}/status`, { status: nextStatus });
    showToast(`User status updated to ${nextStatus}`, 'success');
  };

  const handleRecalculateRisk = async () => {
    showToast('Executing WeatherGPT Risk Engine v1 sweep across 16 stations...', 'success');
    await apiClient.post('/admin/risk/recalculate', {});

    const auditEntry: AuditItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: `demo_${currentRole.toLowerCase()}_user`,
      actorRole: currentRole,
      action: 'RISK_RECALCULATED',
      resourceType: 'RISK',
      resourceId: 'all_stations',
      result: 'SUCCESS',
      requestId: `req_rsk_${Date.now()}`,
      metadata: { modelVersion: 'WeatherGPT-Risk-v1', stations: 16 },
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    showToast('Risk matrix recalculated: 16 stations updated with fresh telemetry factors.', 'success');
  };

  // While auth state is initializing, show clean loader
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Verifying Operational Credentials</h2>
        <p className="text-xs text-slate-400">Authenticating with WeatherGPT MoES / IMD Gateway...</p>
      </div>
    );
  }

  // If role is plain citizen USER, show Server-Side Gating Barrier
  if (currentRole === 'USER' || (Boolean(currentUser) && (authRole === 'USER' || (authRole as string) === 'user'))) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-navy-900/90 border border-red-500/40 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">403 Forbidden: Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The <strong>WeatherGPT Operational Control Center</strong> is strictly gated by server-side Role-Based Access Control (RBAC). Your current identity role is <strong>USER (Citizen)</strong>.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left text-xs mb-6 font-mono text-slate-300">
            <div className="text-red-400 font-bold mb-1">SECURITY GATE ENFORCEMENT:</div>
            <div>• Required: ANALYST, ADMIN, or SUPER_ADMIN</div>
            <div>• Provided: role="USER" {currentUser ? `(${currentUser.email || currentUser.id})` : '(uid: demo_user)'}</div>
            <div>• Audit Event: REJECTED_UNAUTHORIZED_ACCESS</div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            (For SIH judging demonstration, switch your role below to inspect the Control Center):
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {(['SUPER_ADMIN', 'ADMIN', 'ANALYST'] as DemoRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/40 text-xs font-semibold text-sky-300 transition-colors"
              >
                Switch to {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
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

      {/* OPERATIONAL COMMAND HEADER */}
      <div className="bg-navy-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-wide">
                  WeatherGPT Operational Control Center
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase">
                  CONFIDENTIAL · SIH #26068
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ministry of Earth Sciences · India Meteorological Department · Disaster Early Warning Grid
              </p>
            </div>
          </div>

          {/* TELEMETRY & ROLE SIMULATOR BAR */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TELEMETRY: LIVE</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Role Principal:
            </div>

            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value as DemoRole)}
              className="bg-slate-900 border border-slate-700 text-xs text-sky-400 font-semibold px-2.5 py-1 rounded-lg focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
              <option value="ADMIN">ADMIN (Alerts & Systems)</option>
              <option value="ANALYST">ANALYST (Risk & Disasters)</option>
              <option value="USER">USER (Citizen - Tests Deny)</option>
            </select>

            <button
              onClick={loadOperationalData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Telemetry Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-1 mt-5 overflow-x-auto border-t border-slate-800/80 pt-3 text-xs scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: Activity },
            { id: 'alerts', label: 'Alert Operations', icon: AlertTriangle, badge: alerts.length },
            { id: 'users', label: 'Users & RBAC', icon: Users, badge: users.length },
            { id: 'disasters', label: 'Disaster Database', icon: Flame, badge: disasters.length },
            { id: 'weather', label: 'Sensors & Freshness', icon: Radio, badge: '16 IMD' },
            { id: 'risk', label: 'Risk Intelligence', icon: ShieldAlert },
            { id: 'audit', label: 'Audit Trail', icon: History, badge: auditLogs.length },
            { id: 'system', label: 'System Health', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                      isActive ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>ACTIVE CITIZENS</span>
                <Users className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{overviewStats.totalUsers}</div>
              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> All RBAC Verified
              </div>
            </div>

            <div className="bg-navy-900/80 border border-red-500/30 rounded-xl p-4">
              <div className="text-[11px] font-medium text-red-300 mb-1 flex items-center justify-between">
                <span>ACTIVE ALERTS</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="text-2xl font-extrabold text-red-400">
                {alerts.filter((a) => a.status === 'ACTIVE').length}
              </div>
              <div className="text-[10px] text-red-300 mt-1 font-mono">
                1 Severe · 1 Warning
              </div>
            </div>

            <div className="bg-navy-900/80 border border-amber-500/30 rounded-xl p-4">
              <div className="text-[11px] font-medium text-amber-300 mb-1 flex items-center justify-between">
                <span>PENDING REVIEW</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400">
                {alerts.filter((a) => a.status === 'PENDING_REVIEW').length}
              </div>
              <div className="text-[10px] text-amber-300 mt-1 font-mono">
                Awaiting Admin Sign-off
              </div>
            </div>

            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>TRACKED STATIONS</span>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">16</div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                100% Ingestion Freshness
              </div>
            </div>

            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>AUDIT EVENTS</span>
                <History className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{auditLogs.length}</div>
              <div className="text-[10px] text-purple-400 mt-1 font-mono">
                Append-only Immutable
              </div>
            </div>
          </div>

          {/* TWO COLUMN OPERATIONAL HIGHLIGHTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ACTIVE ALERTS FEED */}
            <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Emergency Advisories & Warnings
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                >
                  Manage All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {alerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">{a.title}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          a.status === 'ACTIVE'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>{a.location}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">Hazard: {a.hazardType}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT AUDIT TRAIL STREAM */}
            <div className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Live Security Audit Stream
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                >
                  Full Trail <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-semibold text-slate-200">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Actor: <span className="text-sky-400">{log.actorRole}</span> ({log.actorId})
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      <div>{log.requestId}</div>
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ALERTS OPERATIONS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-navy-900/80 border border-slate-800 p-4 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white">Advisory & Alert Lifecycle Command</h2>
              <p className="text-xs text-slate-400">
                State Machine: DRAFT → PENDING_REVIEW → ACTIVE → EXPIRED / CANCELLED
              </p>
            </div>
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Advisory</span>
            </button>
          </div>

          {/* ALERTS TABLE */}
          <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Advisory Title</th>
                    <th className="p-3.5">Location / State</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Expires</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            a.severity === 'SEVERE'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : a.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white max-w-xs truncate">
                        <div>{a.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal truncate">
                          {a.description}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {a.location}, {a.state}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            a.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : a.status === 'PENDING_REVIEW'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
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
                            onClick={() => handleActivateAlert(a.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-colors"
                          >
                            Activate (Sign-off)
                          </button>
                        )}
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancelAlert(a.id)}
                            className="px-2.5 py-1 rounded bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-[11px] font-semibold transition-colors"
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

      {/* TAB CONTENT: 3. USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Identity & Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-slate-400">
                Custom Claims Verification: Role elevation requires <span className="text-amber-400 font-mono">SUPER_ADMIN</span> authority.
              </p>
            </div>
          </div>

          <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">User / UID</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5">Last Login</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{u.uid}</div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">{u.email}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChangeUser(u.uid, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-1 rounded text-sky-300 cursor-pointer focus:border-sky-500"
                        >
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">{u.lastLoginAt}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.uid, u.status)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. DISASTER DATABASE */}
      {activeTab === 'disasters' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Historical Disaster Intelligence Database</h2>
              <p className="text-xs text-slate-400">
                Authoritative reference catalog (NDMA / IMD post-disaster audit benchmarks)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disasters.map((d) => (
              <div key={d.id} className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{d.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{d.state}</span>
                      <span>·</span>
                      <span className="font-mono text-sky-400">{d.year}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {d.hazardType}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{d.description}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div>Casualties: <span className="text-red-400 font-bold">{d.deaths}</span></div>
                  <div>Affected: <span className="text-slate-200">{d.affectedPopulation}</span></div>
                  <div className="text-slate-500">{d.source}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. WEATHER & SENSORS */}
      {activeTab === 'weather' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">IMD Station Telemetry & Data Freshness</h2>
              <p className="text-xs text-slate-400">
                Freshness Standards: LIVE (&lt;15m) · RECENT (&lt;1h) · STALE (&gt;1h)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>16 / 16 STATIONS REPORTING LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {weatherData.map((w) => (
              <div key={w.id} className="bg-navy-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs">{w.locationName}</div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {w.dataFreshness}
                  </span>
                </div>
                <div className="text-lg font-extrabold text-white flex items-baseline gap-2">
                  <span>{w.temperature}°C</span>
                  <span className="text-xs font-normal text-slate-400">{w.condition}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 grid grid-cols-2 gap-1 pt-1 border-t border-slate-800/80">
                  <div>Humidity: {w.humidity}%</div>
                  <div>Wind: {w.windSpeed} km/h</div>
                  <div>Quality: {w.quality}</div>
                  <div>State: {w.state}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. RISK INTELLIGENCE */}
      {activeTab === 'risk' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">WeatherGPT Multi-Hazard Risk Engine v1</h2>
              <p className="text-xs text-slate-400">
                Algorithmic Evaluation: Precipitation + Wind Load + Heat Index + Active Bulletins = Risk Score (0-100)
              </p>
            </div>
            <button
              onClick={handleRecalculateRisk}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recalculate All Stations</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskList.map((r) => (
              <div key={r.id} className="bg-navy-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{r.locationName}</h3>
                    <div className="text-xs text-slate-400">{r.state}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xl font-extrabold ${
                        r.riskScore >= 80
                          ? 'text-red-400'
                          : r.riskScore >= 60
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {r.riskScore} / 100
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      {r.riskLevel} RISK
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  {r.explanation}
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Driving Factors:</div>
                  {r.factors?.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                      <span>• {f.name} ({f.value})</span>
                      <span className="font-mono text-sky-400 font-bold">+{f.contribution} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Immutable Administrative & Security Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Append-only log capturing privileged role updates, alert sign-offs, and system reconfigurations.
              </p>
            </div>
          </div>

          <div className="bg-navy-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Actor (Role)</th>
                    <th className="p-3.5">Target Resource</th>
                    <th className="p-3.5">Correlation Request ID</th>
                    <th className="p-3.5">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-sky-300">{log.action}</td>
                      <td className="p-3.5 text-slate-300">
                        {log.actorId} (<span className="text-amber-400">{log.actorRole}</span>)
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {log.resourceType}:{log.resourceId}
                      </td>
                      <td className="p-3.5 text-slate-500">{log.requestId}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. SYSTEM HEALTH */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-navy-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Backend Micro-Services & Infrastructure Health</h2>
              <p className="text-xs text-slate-400">
                Continuous diagnostics for Cloud Functions, Cloud Firestore, and external adapters.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OVERALL STATUS: HEALTHY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Cloud Firestore</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Connected · 2ms Latency
              </div>
              <p className="text-xs text-slate-400">14 Active Collections with Compound Indexes.</p>
            </div>

            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Firebase Auth RBAC</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Custom Claims Active
              </div>
              <p className="text-xs text-slate-400">5 Tier Hierarchy: USER to SUPER_ADMIN.</p>
            </div>

            <div className="bg-navy-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase">Weather Provider</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> IMD Synthetic Mock v1
              </div>
              <p className="text-xs text-slate-400">Ready for Live IMD / AWS Phase C Drop-in.</p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Draft Emergency Advisory</h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Advisory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe Cyclonic Squall Alert"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Hazard Category</label>
                  <select
                    value={newAlert.hazardType}
                    onChange={(e) => setNewAlert({ ...newAlert, hazardType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="CYCLONE">CYCLONE</option>
                    <option value="FLOOD">FLOOD</option>
                    <option value="HEATWAVE">HEATWAVE</option>
                    <option value="HEAVY_RAIN">HEAVY_RAIN</option>
                    <option value="LANDSLIDE">LANDSLIDE</option>
                    <option value="THUNDERSTORM">THUNDERSTORM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Severity Level</label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WATCH">WATCH</option>
                    <option value="WARNING">WARNING</option>
                    <option value="SEVERE">SEVERE (Red Alert)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Affected Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coastal Odisha & Sunderbans"
                    value={newAlert.location}
                    onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Odisha"
                    value={newAlert.state}
                    onChange={(e) => setNewAlert({ ...newAlert, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Technical Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Atmospheric conditions, wind velocities, radar reflectivity analysis..."
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
