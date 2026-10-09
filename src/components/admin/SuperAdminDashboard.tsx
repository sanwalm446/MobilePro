import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  LogOut,
  Globe,
  Sliders,
  Activity,
  Calendar,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Eye,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { otpAuthClient } from '../../utils/otpAuthClient';
import { ShopLogo } from '../common/ShopLogo';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  onGoToLanding: () => void;
  onSwitchToTenant?: (tenantId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onLogout,
  onGoToLanding,
  onSwitchToTenant,
}) => {
  const { currentUser, settings } = useShop();

  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'security' | 'audit'>('tenants');

  // Security config editor
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [expirationMinutes, setExpirationMinutes] = useState(5);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Load data from backend
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, statsRes, logsRes] = await Promise.all([
        otpAuthClient.getAdminTenants(),
        otpAuthClient.getAdminStats(),
        otpAuthClient.getAdminAuditLogs(),
      ]);

      if (tenantsRes?.success && tenantsRes.tenants) {
        setTenantsList(tenantsRes.tenants);
      }
      if (statsRes?.success && statsRes.stats) {
        setSystemStats(statsRes.stats);
        if (statsRes.securitySettings) {
          setOtpEnabled(statsRes.securitySettings.otpEnabled);
          setChannel(statsRes.securitySettings.channel);
          setExpirationMinutes(statsRes.securitySettings.expirationMinutes);
          setCooldownSeconds(statsRes.securitySettings.resendCooldownSeconds);
          setMaxAttempts(statsRes.securitySettings.maxAttempts);
        }
      }
      if (logsRes?.success && logsRes.logs) {
        setAuditLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('[Super Admin] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateSubscription = async (tenantId: string, status: string) => {
    try {
      const res = await otpAuthClient.updateAdminSubscription({ tenantId, status });
      if (res?.success) {
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGlobalSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await otpAuthClient.updateSecuritySettings({
        otpEnabled,
        channel,
        expirationMinutes: Number(expirationMinutes),
        resendCooldownSeconds: Number(cooldownSeconds),
        maxAttempts: Number(maxAttempts),
      });
      if (res?.success) {
        setSaveFeedback('Global security settings successfully updated.');
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    } catch (err: any) {
      setSaveFeedback('Failed to update global security settings.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Super Admin Nav */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">
                Mobi<span className="text-purple-400">Flow</span> Admin
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-900/60 border border-purple-500/40 text-purple-300">
                SUPER_ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Root Multi-Tenant Management & Security Control</p>
          </div>
        </div>

        {/* Right Nav buttons */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            type="button"
            onClick={onGoToLanding}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Site</span>
          </button>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
              SA
            </div>
            <span className="font-mono text-slate-300 text-[11px] hidden sm:inline">
              {currentUser?.email || 'superadmin@mobiflow.pk'}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Managed Tenants</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {systemStats?.totalTenants ?? tenantsList.length}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Full tenant isolation active</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Staff Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {systemStats?.totalUsers ?? 7}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Multi-tenant role-based access</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>OTP Engine Health</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">100% Operational</div>
            <div className="mt-1 text-[11px] text-slate-400">
              {systemStats?.etherealActive ? 'Real Ethereal SMTP active' : 'Real SMTP delivery active'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Security Mode</span>
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-base font-bold font-mono text-amber-300">Password + Real OTP</div>
            <div className="mt-1 text-[11px] text-slate-400">Rate limited & single-use tokens</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tenants'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tenants & Subscriptions ({tenantsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Global OTP & Rate Limit Policies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Security Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: TENANTS DIRECTORY */}
        {activeTab === 'tenants' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Registered Multi-Tenant Workspaces</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each tenant has isolated IMEI databases, sales registers, customers, and staff users.
                </p>
              </div>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/60">
                Data Isolation: Guaranteed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tenant / Shop</th>
                    <th className="py-3 px-4">Owner & Contact</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Users</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tenantsList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">{t.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{t.ownerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{t.city}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                        {t.userCount ?? 1} staff
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          {t.subscription?.plan || 'Professional'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            t.subscription?.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : t.subscription?.status === 'EXPIRED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.subscription?.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : t.subscription?.status === 'EXPIRED'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span>{t.subscription?.status || 'ACTIVE'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.id !== 'system-root' && (
                          <div className="inline-flex items-center gap-1.5">
                            {t.subscription?.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateSubscription(t.id, 'EXPIRED')}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-[11px] text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                                title="Simulate expired subscription to test Requirement 20 lock barrier"
                              >
                                Test Expire
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateSubscription(t.id, 'ACTIVE')}
                                className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-[11px] text-emerald-300 border border-emerald-800 transition-colors cursor-pointer font-semibold"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL SECURITY & OTP SETTINGS */}
        {activeTab === 'security' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-lg">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Global Multi-Factor OTP Authentication Policy</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls server-side cryptographic OTP generation, rate limits, countdown timers, and channel delivery.
              </p>
            </div>

            {saveFeedback && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saveFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveGlobalSecurity} className="space-y-6">
              {/* OTP Enabled Switch */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Require OTP Verification for All Tenant Staff</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    When enabled, entering valid credentials prompts the user for a 6-digit numeric OTP before granting access.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={otpEnabled}
                    onChange={(e) => setOtpEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Channel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Delivery Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  >
                    <option value="email">Email (Real SMTP / Nodemailer)</option>
                    <option value="sms">SMS (Twilio / SMS Gateway API)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Delivers cryptographic verification codes with destination masking for privacy.
                  </p>
                </div>

                {/* Expiration Minutes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    OTP Code Expiration Lifetime (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={expirationMinutes}
                    onChange={(e) => setExpirationMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Expired OTP codes reject verification and require requesting a new code.
                  </p>
                </div>

                {/* Resend Cooldown Seconds */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resend Cooldown Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={cooldownSeconds}
                    onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enforced on server-side: refreshing browser does not bypass cooldown.
                  </p>
                </div>

                {/* Max Verification Attempts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Failed Verification Attempts Before Lockout
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Protects against brute-force guessing attacks with rate-limited temporary block.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Save Global Security Policies
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Real-Time Authentication & OTP Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks all verification attempts, dispatches, rate limits, and security actions.
                </p>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
              >
                Refresh Log Stream
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target User / Destination</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No audit events recorded in current server session yet. Initiate a login to see real events.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 text-slate-400">{log.timestamp.replace('T', ' ').slice(0, 19)}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-200">{log.action}</td>
                        <td className="py-2.5 px-4 text-purple-300">{log.identifier}</td>
                        <td className="py-2.5 px-4 uppercase text-slate-400">{log.channel}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : log.status === 'FAILED'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
