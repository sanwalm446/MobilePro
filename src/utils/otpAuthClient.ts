/**
 * MobiFlow Software — Real Server-Side OTP Authentication Client
 * Connects to the Express backend /api/auth/otp/* and /api/admin/* endpoints
 */

export interface RequestOtpResponse {
  success: boolean;
  requiresOtp?: boolean;
  challengeId?: string;
  channel?: 'email' | 'sms';
  maskedDestination?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
  providerConfigured?: boolean;
  providerNotice?: string;
  testMessageUrl?: string;
  previewCode?: string;
  deliveryStatus?: string;
  message?: string;
  code?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  code?: 'VERIFIED' | 'INCORRECT_OTP' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'ALREADY_USED' | 'CHALLENGE_NOT_FOUND' | 'INVALID_FORMAT';
  message: string;
  token?: string;
  redirectTo?: string;
  user?: any;
  tenant?: any;
  attemptsLeft?: number;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  testMessageUrl?: string;
  remainingSeconds?: number;
  previewCode?: string;
  code?: string;
}

export interface CheckAccountResponse {
  success: boolean;
  userExists?: boolean;
  userId?: string;
  role?: string;
  tenantId?: string;
  otpEnabled?: boolean;
  channel?: 'email' | 'sms';
  maskedDestination?: string;
  securityMode?: string;
  message?: string;
  code?: string;
}

export const otpAuthClient = {
  // 1. Check account existence & pre-validate status
  async checkAccount(identifier: string): Promise<CheckAccountResponse> {
    try {
      const res = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[OTP Client] Check account error:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your network.',
      };
    }
  },

  // 2. Request real OTP from backend
  async requestOtp(
    identifier: string,
    userDetails?: any,
    channelOverride?: 'email' | 'sms'
  ): Promise<RequestOtpResponse> {
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, userDetails, channelOverride }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[OTP Client] Failed to connect to auth server:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your network connection.',
      };
    }
  },

  // 3. Verify OTP with backend
  async verifyOtp(
    challengeId: string,
    otp: string,
    rememberDevice = true
  ): Promise<VerifyOtpResponse> {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp, rememberDevice }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[OTP Client] Verification request error:', err);
      return {
        success: false,
        message: 'Network error during verification. Please check your connection and try again.',
      };
    }
  },

  // 4. Resend fresh OTP with server-side rate limiting
  async resendOtp(challengeId: string): Promise<ResendOtpResponse> {
    try {
      const res = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[OTP Client] Resend request error:', err);
      return {
        success: false,
        message: 'Network error while requesting new code.',
      };
    }
  },

  // 5. Get security and provider status
  async getSecuritySettings() {
    try {
      const res = await fetch('/api/auth/security-settings');
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  // 6. Update security settings (Admin only)
  async updateSecuritySettings(settings: any) {
    try {
      const res = await fetch('/api/auth/security-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update security settings' };
    }
  },

  // 7. Super Admin: Get tenants directory
  async getAdminTenants() {
    try {
      const res = await fetch('/api/admin/tenants');
      return await res.json();
    } catch {
      return { success: false, tenants: [] };
    }
  },

  // 8. Super Admin: Get system stats
  async getAdminStats() {
    try {
      const res = await fetch('/api/admin/system-stats');
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // 9. Super Admin: Get audit logs
  async getAdminAuditLogs() {
    try {
      const res = await fetch('/api/admin/audit-logs');
      return await res.json();
    } catch {
      return { success: false, logs: [] };
    }
  },

  // 10. Super Admin: Update tenant subscription
  async updateAdminSubscription(payload: { tenantId: string; status?: string; plan?: string; expiresAt?: string }) {
    try {
      const res = await fetch('/api/admin/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update subscription' };
    }
  },
};
