import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  CreditCard,
  Building2,
  Key,
  BadgeAlert,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { otpAuthClient } from '../../utils/otpAuthClient';
import { OtpChannel, OtpSecurityMode, TenantSubscriptionStatus } from '../../types';

export const SecuritySettingsSection: React.FC = () => {
  const { settings, updateSecuritySettings, updateSubscription, currentUser, addLog } = useShop();

  const isAdmin = currentUser?.role === 'Admin';

  const currentSec = settings.securitySettings || {
    otpEnabled: true,
    channel: 'email',
    securityMode: 'password_plus_otp',
    expirationMinutes: 5,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  };

  const currentSub = settings.subscription || {
    plan: 'Professional',
    status: 'ACTIVE',
    expiresAt: '2027-12-31T23:59:59Z',
    autoRenew: true,
    maxUsers: 10,
    maxInventory: 5000,
  };

  const [otpEnabled, setOtpEnabled] = useState(currentSec.otpEnabled);
  const [channel, setChannel] = useState<OtpChannel>(currentSec.channel);
  const [securityMode, setSecurityMode] = useState<OtpSecurityMode>(currentSec.securityMode);
  const [expirationMinutes, setExpirationMinutes] = useState(currentSec.expirationMinutes);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(currentSec.resendCooldownSeconds);
  const [maxAttempts, setMaxAttempts] = useState(currentSec.maxAttempts);

  // Subscription state
  const [subStatus, setSubStatus] = useState<TenantSubscriptionStatus>(currentSub.status);
  const [subPlan, setSubPlan] = useState(currentSub.plan);

  // Backend status state
  const [backendProviders, setBackendProviders] = useState<{
    email?: { configured: boolean; host: string; from: string; etherealActive: boolean };
    sms?: { configured: boolean; provider: string };
  } | null>(null);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  // Fetch backend provider status
  useEffect(() => {
    otpAuthClient.getSecuritySettings().then((data) => {
      if (data?.providers) {
        setBackendProviders(data.providers);
      }
    });
  }, []);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const newSettings = {
      otpEnabled,
      channel,
      securityMode,
      expirationMinutes: Number(expirationMinutes),
      resendCooldownSeconds: Number(resendCooldownSeconds),
      maxAttempts: Number(maxAttempts),
    };

    updateSecuritySettings(newSettings);

    // Sync with backend API
    await otpAuthClient.updateSecuritySettings(newSettings);

    setSavedFeedback('Security and OTP authentication policies successfully updated.');
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    updateSubscription({
      status: subStatus,
      plan: subPlan as any,
    });

    setSavedFeedback('Tenant subscription details updated.');
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSendTestOtp = async () => {
    setTestEmailSending(true);
    setTestEmailResult(null);

    try {
      const res = await otpAuthClient.requestOtp(currentUser?.email || 'admin@pakmobile.pk', currentUser);
      if (res.success) {
        setTestEmailResult({
          success: true,
          message: res.providerNotice || 'Test OTP dispatched successfully.',
          url: res.testMessageUrl,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: res.message || 'Failed to dispatch test OTP.',
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err?.message || 'Error triggering test OTP.',
      });
    } finally {
      setTestEmailSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: OTP AUTHENTICATION & LOGIN SECURITY                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Security & Multi-Factor OTP Authentication</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Enterprise
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage staff login verification, OTP delivery channels, expiration lifetimes, and rate limiting.
              </p>
            </div>
          </div>

          {!isAdmin && (
            <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin permission required to edit</span>
            </div>
          )}
        </div>

        {savedFeedback && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        <form onSubmit={handleSaveSecurity} className="p-6 space-y-6">
          {/* OTP Active Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Require OTP Verification on Staff Login
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                When enabled, users must enter a valid 6-digit numeric verification code to access the workspace.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={otpEnabled}
                disabled={!isAdmin}
                onChange={(e) => setOtpEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Delivery Channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OTP Delivery Channel
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setChannel('email')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    channel === 'email'
                      ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 font-semibold ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Email OTP</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Real SMTP / Nodemailer</div>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setChannel('sms')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'border-emerald-500 bg-emerald-50/40 text-slate-900 font-semibold ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span className="text-xs">SMS OTP</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Direct SMS Gateway</div>
                </button>
              </div>
            </div>

            {/* Authentication Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Login Security Mode
              </label>
              <select
                disabled={!isAdmin}
                value={securityMode}
                onChange={(e) => setSecurityMode(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="password_plus_otp">MODE 1: Password + OTP Verification (Recommended)</option>
                <option value="otp_only">MODE 2: Passwordless OTP Verification (Email/Phone Only)</option>
              </select>
              <div className="text-[11px] text-slate-400 mt-1">
                Password + OTP enforces both credential verification and 2-factor code authorization.
              </div>
            </div>

            {/* OTP Expiration Minutes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Code Expiration Duration</span>
                <span className="text-emerald-600 font-mono font-bold text-xs">{expirationMinutes} Minutes</span>
              </label>
              <select
                disabled={!isAdmin}
                value={expirationMinutes}
                onChange={(e) => setExpirationMinutes(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value={2}>2 Minutes (High Security)</option>
                <option value={5}>5 Minutes (Standard Industry Best Practice)</option>
                <option value={10}>10 Minutes (Extended Window)</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>

            {/* Resend Cooldown & Max Attempts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resend Cooldown
                </label>
                <select
                  disabled={!isAdmin}
                  value={resendCooldownSeconds}
                  onChange={(e) => setResendCooldownSeconds(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds</option>
                  <option value={90}>90 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Max Failed Attempts
                </label>
                <select
                  disabled={!isAdmin}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value={3}>3 Attempts</option>
                  <option value={5}>5 Attempts (Recommended)</option>
                  <option value={10}>10 Attempts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Real Provider Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Backend Provider Delivery Diagnostics</span>
              <span className="text-[10px] text-slate-500 font-mono">Server-Side Verified</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">SMTP Email Delivery</div>
                  {backendProviders?.email?.configured ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Configured
                    </span>
                  ) : backendProviders?.email?.etherealActive ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      Ethereal Real SMTP
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      Setup Needed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Host: {backendProviders?.email?.host || 'Not set'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">SMS Gateway API</div>
                  {backendProviders?.sms?.configured ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Configured
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      Not Configured
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Gateway: Twilio / BrandSMS
                </div>
              </div>
            </div>

            {/* Test Email Button */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="text-[11px] text-slate-500">
                Test the real server-side OTP generation and email dispatch right now.
              </div>
              <button
                type="button"
                onClick={handleSendTestOtp}
                disabled={testEmailSending || !isAdmin}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {testEmailSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Code...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send Test Verification Code</span>
                  </>
                )}
              </button>
            </div>

            {testEmailResult && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs ${
                  testEmailResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-medium">{testEmailResult.message}</div>
                {testEmailResult.url && (
                  <a
                    href={testEmailResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold underline mt-1 text-emerald-700"
                  >
                    <span>View Delivered Email in Ethereal Inbox</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Security Policy
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: TENANT SUBSCRIPTION & ACCOUNT STATUS                */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tenant Subscription & Plan License
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current tenant workspace status and software license entitlement.
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
              subStatus === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800'
                : subStatus === 'TRIAL'
                ? 'bg-blue-100 text-blue-800'
                : subStatus === 'EXPIRING_SOON'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            ● {subStatus}
          </div>
        </div>

        <form onSubmit={handleSaveSubscription} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Plan
              </label>
              <select
                disabled={!isAdmin}
                value={subPlan}
                onChange={(e) => setSubPlan(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
              >
                <option value="Starter">Starter Counter ($19/mo)</option>
                <option value="Professional">Professional Retailer ($39/mo)</option>
                <option value="Enterprise">Enterprise Multi-Branch ($79/mo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subscription State
              </label>
              <select
                disabled={!isAdmin}
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
              >
                <option value="ACTIVE">ACTIVE (Normal Operation)</option>
                <option value="TRIAL">TRIAL (14-Day Free Evaluation)</option>
                <option value="EXPIRING_SOON">EXPIRING_SOON (Renewal Notice)</option>
                <option value="EXPIRED">EXPIRED (Renewal Barrier)</option>
                <option value="SUSPENDED">SUSPENDED (Account Locked)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                License Expiration
              </label>
              <input
                type="text"
                disabled
                value="2027-12-31"
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono"
              />
            </div>
          </div>

          {subStatus === 'EXPIRED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <BadgeAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Subscription Testing Active:</strong> The workspace will display the renewal barrier.
                Tenant records, inventory, and customer databases remain completely preserved.
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Update Subscription State
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
