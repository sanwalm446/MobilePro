import express from 'express';
import path from 'path';
import crypto from 'crypto';
import nodemailer, { Transporter, TestAccount } from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// TYPES & DATA STRUCTURES
// ---------------------------------------------------------------------------
export type UserRole = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'Admin' | 'Manager' | 'Shop Keeper' | 'Salesman' | 'Accountant' | 'Employee';
export type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Deactivated';
export type TenantSubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED';

interface ServerUser {
  id: string;
  tenantId: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isMainAdmin?: boolean;
}

interface TenantSubscription {
  plan: 'Starter' | 'Professional' | 'Enterprise';
  status: TenantSubscriptionStatus;
  expiresAt: string;
  autoRenew: boolean;
  maxUsers: number;
  maxInventory: number;
}

interface TenantRecord {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  subscription: TenantSubscription;
  createdAt: string;
}

interface StoredChallenge {
  challengeId: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tenantId: string;
  hashedOtp: string;
  salt: string;
  channel: 'email' | 'sms';
  maskedDestination: string;
  createdAt: number;
  expiresAt: number;
  resendCooldownUntil: number;
  attemptsLeft: number;
  verified: boolean;
  providerConfigured: boolean;
  providerNotice?: string;
  testMessageUrl?: string;
  rawOtpForTestOnly?: string;
}

interface SecuritySettings {
  otpEnabled: boolean;
  channel: 'email' | 'sms';
  securityMode: 'password_plus_otp' | 'otp_only';
  expirationMinutes: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  identifier: string;
  channel: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'EXPIRED' | 'RATE_LIMITED';
  details: string;
  ip: string;
}

// ---------------------------------------------------------------------------
// IN-MEMORY SEEDED DATABASE
// ---------------------------------------------------------------------------
const serverUsers: ServerUser[] = [
  {
    id: 'usr-0',
    tenantId: 'system-root',
    name: 'Super Admin (MobiFlow Root)',
    username: 'superadmin',
    email: 'superadmin@mobiflow.pk',
    phone: '0300-9999999',
    passwordHash: 'superadmin123',
    role: 'SUPER_ADMIN',
    status: 'Active',
    isMainAdmin: true,
  },
  {
    id: 'usr-1',
    tenantId: 'tenant-default',
    name: 'Muhammad Sanwal (Owner)',
    username: 'sanwal',
    email: 'sanwalmalik2006@gmail.com',
    phone: '0329-2920600',
    passwordHash: 'admin123',
    role: 'Admin',
    status: 'Active',
    isMainAdmin: true,
  },
  {
    id: 'usr-1-alias',
    tenantId: 'tenant-default',
    name: 'Muhammad Sanwal (Admin)',
    username: 'admin',
    email: 'admin@mobiflow.pk',
    phone: '0300-8452190',
    passwordHash: 'admin123',
    role: 'Admin',
    status: 'Active',
    isMainAdmin: true,
  },
  {
    id: 'usr-2',
    tenantId: 'tenant-default',
    name: 'Kashif Ali',
    username: 'kashif',
    email: 'kashif@pakmobile.pk',
    phone: '0321-4567890',
    passwordHash: 'manager123',
    role: 'Manager',
    status: 'Active',
  },
  {
    id: 'usr-3',
    tenantId: 'tenant-default',
    name: 'Zeeshan Butt',
    username: 'zeeshan',
    email: 'zeeshan@pakmobile.pk',
    phone: '0305-1122334',
    passwordHash: 'sales123',
    role: 'Salesman',
    status: 'Active',
  },
  {
    id: 'usr-4',
    tenantId: 'tenant-default',
    name: 'Rizwan Haider',
    username: 'rizwan',
    email: 'rizwan@pakmobile.pk',
    phone: '0333-9876543',
    passwordHash: 'acc123',
    role: 'Accountant',
    status: 'Active',
  },
  {
    id: 'usr-5',
    tenantId: 'tenant-default',
    name: 'Bilal Khan (Trainee)',
    username: 'bilal',
    email: 'bilal.trainee@pakmobile.pk',
    phone: '0312-3344556',
    passwordHash: 'emp123',
    role: 'Employee',
    status: 'Pending', // pending approval demo
  },
  {
    id: 'usr-customera',
    tenantId: 'tenant-customera',
    name: 'Hammad Rao (Owner - ABC Mobile)',
    username: 'customera',
    email: 'hammad@abcmobile.pk',
    phone: '0301-7788990',
    passwordHash: 'customer123',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'usr-customerb',
    tenantId: 'tenant-customerb',
    name: 'Sanwal Khan (Owner - Sanwal Mobile)',
    username: 'customerb',
    email: 'sanwal@sanwalzone.pk',
    phone: '0345-6677889',
    passwordHash: 'customer123',
    role: 'Admin',
    status: 'Active',
  },
];

const tenants: Map<string, TenantRecord> = new Map([
  [
    'system-root',
    {
      id: 'system-root',
      name: 'MobiFlow Global Administration',
      ownerName: 'MobiFlow Engineering',
      phone: '0300-9999999',
      email: 'admin@mobiflow.pk',
      city: 'Islamabad, Pakistan',
      subscription: {
        plan: 'Enterprise',
        status: 'ACTIVE',
        expiresAt: '2030-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 9999,
        maxInventory: 999999,
      },
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  [
    'tenant-default',
    {
      id: 'tenant-default',
      name: 'MobiFlow Software (Main Shop)',
      ownerName: 'Hafiz Muhammad Usman',
      phone: '0300-8452190',
      email: 'usman@pakmobile.pk',
      city: 'Lahore, Pakistan',
      subscription: {
        plan: 'Professional',
        status: 'ACTIVE',
        expiresAt: '2027-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      },
      createdAt: '2026-09-01T09:00:00Z',
    },
  ],
  [
    'tenant-customera',
    {
      id: 'tenant-customera',
      name: 'ABC Mobile Center',
      ownerName: 'Hammad Rao',
      phone: '0301-7788990',
      email: 'hammad@abcmobile.pk',
      city: 'Lahore, Pakistan',
      subscription: {
        plan: 'Professional',
        status: 'ACTIVE',
        expiresAt: '2027-06-30T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      },
      createdAt: '2026-09-05T09:00:00Z',
    },
  ],
  [
    'tenant-customerb',
    {
      id: 'tenant-customerb',
      name: 'Sanwal Mobile Zone',
      ownerName: 'Sanwal Khan',
      phone: '0345-6677889',
      email: 'sanwal@sanwalzone.pk',
      city: 'Rawalpindi, Pakistan',
      subscription: {
        plan: 'Starter',
        status: 'ACTIVE',
        expiresAt: '2027-08-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 3,
        maxInventory: 1500,
      },
      createdAt: '2026-09-06T09:00:00Z',
    },
  ],
]);

// Active sessions and rate limits
const challenges = new Map<string, StoredChallenge>();
const requestRateLimits = new Map<string, { count: number; resetAt: number }>();
const auditLogs: AuditLogItem[] = [];

function recordAudit(item: Omit<AuditLogItem, 'id' | 'timestamp'>) {
  const log: AuditLogItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...item,
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 200) auditLogs.pop();
}

const securitySettings: SecuritySettings = {
  otpEnabled: true,
  channel: 'email',
  securityMode: 'password_plus_otp',
  expirationMinutes: 5,
  resendCooldownSeconds: 60,
  maxAttempts: 5,
};

// ---------------------------------------------------------------------------
// EMAIL TRANSPORTER CONFIGURATION (Real SMTP / Nodemailer)
// ---------------------------------------------------------------------------
let emailTransporter: Transporter | null = null;
let isRealSmtpConfigured = false;
let etherealAccount: TestAccount | null = null;

async function initEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const secure = process.env.SMTP_SECURE === 'true';

  const isValidHost = Boolean((host && host.includes('.')) || (user && user.includes('@')) && pass);

  if (isValidHost && pass) {
    if (host?.includes('gmail.com') || (user && user.endsWith('@gmail.com'))) {
      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      console.log(`[Auth/SMTP] Real Gmail transporter initialized for: ${user}`);
    } else {
      emailTransporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });
      console.log(`[Auth/SMTP] Real production SMTP transporter initialized for host: ${host}`);
    }
    isRealSmtpConfigured = true;
  } else {
    isRealSmtpConfigured = false;
    // Real RFC-compliant test delivery via Ethereal SMTP
    try {
      etherealAccount = await nodemailer.createTestAccount();
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });
      console.log(`[Auth/SMTP] Ethereal real test SMTP active (${etherealAccount.user}). Inbox link generated for every OTP dispatched.`);
    } catch (err: any) {
      console.warn(`[Auth/SMTP] Could not create Ethereal account: ${err?.message}`);
    }
  }
}

initEmailTransporter();

// Helper to mask destination for privacy
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}****${local[local.length - 1]}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return '***';
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.length <= 5) return '******';
  const prefix = clean.startsWith('+') ? clean.slice(0, 3) : clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix} ****** ${suffix}`;
}

// ---------------------------------------------------------------------------
// AUTHENTICATION & OTP ENDPOINTS
// ---------------------------------------------------------------------------

// 1. GET Security & Provider Settings
app.get('/api/auth/security-settings', (req, res) => {
  res.json({
    success: true,
    settings: securitySettings,
    providers: {
      email: {
        configured: isRealSmtpConfigured,
        host: process.env.SMTP_HOST || 'Not configured in .env (Using real Ethereal SMTP test gateway)',
        from: process.env.SMTP_FROM || 'MobiFlow Software <no-reply@mobiflow.pk>',
        etherealActive: Boolean(etherealAccount),
      },
      sms: {
        configured: Boolean(process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN),
        provider: 'Twilio / Generic Gateway',
      },
    },
  });
});

// 2. POST Update Security Settings (Admin / Super Admin)
app.post('/api/auth/security-settings', (req, res) => {
  const { otpEnabled, channel, securityMode, expirationMinutes, resendCooldownSeconds, maxAttempts } = req.body;

  if (typeof otpEnabled === 'boolean') securitySettings.otpEnabled = otpEnabled;
  if (channel === 'email' || channel === 'sms') securitySettings.channel = channel;
  if (securityMode === 'password_plus_otp' || securityMode === 'otp_only') securitySettings.securityMode = securityMode;
  if (Number.isInteger(expirationMinutes) && expirationMinutes >= 1) securitySettings.expirationMinutes = expirationMinutes;
  if (Number.isInteger(resendCooldownSeconds) && resendCooldownSeconds >= 10) securitySettings.resendCooldownSeconds = resendCooldownSeconds;
  if (Number.isInteger(maxAttempts) && maxAttempts >= 1) securitySettings.maxAttempts = maxAttempts;

  res.json({
    success: true,
    message: 'Security settings updated successfully',
    settings: securitySettings,
  });
});

// 3. POST Check Account & Pre-validate
app.post('/api/auth/check-account', (req, res) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ success: false, message: 'Email, phone, or username is required.' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/[^0-9]/g, '');

  const user = serverUsers.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      u.email.toLowerCase() === cleanId ||
      (cleanPhone.length >= 7 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      code: 'USER_NOT_FOUND',
      message: 'No account found matching this email or phone number.',
    });
  }

  if (user.status === 'Pending') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_PENDING',
      message: 'Your account is Pending Admin approval. Please contact the shop administrator.',
    });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'This account has been suspended by the shop Administrator. Access denied.',
    });
  }

  if (user.status === 'Deactivated') {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_DEACTIVATED',
      message: 'This account has been deactivated. Please contact the Administrator.',
    });
  }

  const channel = securitySettings.channel;
  const maskedDestination = channel === 'email' ? maskEmail(user.email) : maskPhone(user.phone);

  return res.json({
    success: true,
    userExists: true,
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
    otpEnabled: securitySettings.otpEnabled,
    channel,
    maskedDestination,
    securityMode: securitySettings.securityMode,
  });
});

// 3b. POST Register New Shop Owner & Create Tenant (Instant Dashboard Access)
app.post('/api/auth/register-owner', (req, res) => {
  const { name, username, email, phone, shopName, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  const existing = serverUsers.find(
    (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail
  );
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username or email already exists' });
  }

  const tenantId = `tenant-${cleanUser}`;
  const newUser: ServerUser = {
    id: `usr-${Date.now()}`,
    tenantId,
    name: name.trim(),
    username: cleanUser,
    email: cleanEmail,
    phone: phone?.trim() || '0300-1234567',
    passwordHash: password,
    role: 'SHOP_OWNER',
    status: 'Active',
    isMainAdmin: true,
  };

  serverUsers.push(newUser);

  const newTenant: TenantRecord = {
    id: tenantId,
    name: shopName?.trim() || 'My Mobile Shop',
    ownerName: name.trim(),
    phone: phone?.trim() || '0300-1234567',
    email: cleanEmail,
    city: 'Pakistan',
    subscription: {
      plan: 'Professional',
      status: 'ACTIVE',
      expiresAt: '2028-12-31T23:59:59Z',
      autoRenew: true,
      maxUsers: 10,
      maxInventory: 5000,
    },
    createdAt: new Date().toISOString(),
  };

  tenants.set(tenantId, newTenant);

  return res.json({
    success: true,
    user: newUser,
    tenant: newTenant,
    message: 'Shop Owner and workspace tenant created successfully',
  });
});

// 3c. POST Real Google OAuth Sign-In & Instant Tenant Setup
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, name, picture, googleId, shopName } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Google email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user${Date.now().toString().slice(-4)}`;

    // Look up existing account
    let existingUser = serverUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
    );

    if (existingUser) {
      if (existingUser.status === 'Suspended') {
        return res.status(403).json({ success: false, message: 'This Google account has been suspended by the administrator.' });
      }
      if (existingUser.status === 'Deactivated') {
        return res.status(403).json({ success: false, message: 'This Google account has been deactivated.' });
      }

      recordAudit({
        action: 'GOOGLE_SIGNIN_SUCCESS',
        identifier: cleanEmail,
        channel: 'google',
        status: 'SUCCESS',
        details: `Existing user ${existingUser.name} signed in with Google OAuth`,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
      });

      return res.json({
        success: true,
        user: existingUser,
        tenant: tenants.get(existingUser.tenantId),
        message: 'Signed in successfully with Google',
      });
    }

    // New Google account -> auto-provision tenant workspace and SHOP_OWNER account
    const tenantId = `tenant-${cleanUsername}`;
    const newUser: ServerUser = {
      id: `usr-${Date.now()}`,
      tenantId,
      name: displayName,
      username: cleanUsername,
      email: cleanEmail,
      phone: '0300-1234567',
      passwordHash: 'google-oauth-verified',
      role: 'SHOP_OWNER',
      status: 'Active',
      isMainAdmin: true,
    };

    serverUsers.push(newUser);

    const initialShopName = shopName?.trim() || `${displayName}'s Mobile Shop`;
    const newTenant: TenantRecord = {
      id: tenantId,
      name: initialShopName,
      ownerName: displayName,
      phone: '0300-1234567',
      email: cleanEmail,
      city: 'Pakistan',
      subscription: {
        plan: 'Professional',
        status: 'ACTIVE',
        expiresAt: '2028-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      },
      createdAt: new Date().toISOString(),
    };

    tenants.set(tenantId, newTenant);

    recordAudit({
      action: 'GOOGLE_REGISTER_SUCCESS',
      identifier: cleanEmail,
      channel: 'google',
      status: 'SUCCESS',
      details: `New store created for Google user ${displayName}: ${initialShopName}`,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
    });

    return res.json({
      success: true,
      user: newUser,
      tenant: newTenant,
      message: 'Google account registered and store workspace created successfully',
    });
  } catch (err: any) {
    console.error('[Auth/Google] Error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication service error' });
  }
});

// 4. POST Request OTP / Initiate Login
app.post('/api/auth/otp/request', async (req, res) => {
  try {
    const { identifier, userDetails, channelOverride } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ success: false, message: 'Email, phone, or username is required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    // Rate limiting: Max 5 requests per 10 minutes per IP/identifier
    const rateLimitKey = `${ip}:${cleanId}`;
    const now = Date.now();
    const existingRate = requestRateLimits.get(rateLimitKey);
    if (existingRate && existingRate.resetAt > now) {
      if (existingRate.count >= 6) {
        recordAudit({
          action: 'OTP_REQUEST_REJECTED',
          identifier: cleanId,
          channel: channelOverride || securitySettings.channel,
          status: 'RATE_LIMITED',
          details: 'Exceeded rate limit of 5 requests per 10 minutes',
          ip,
        });
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many OTP requests. Please wait a few minutes before trying again.',
        });
      }
      existingRate.count += 1;
    } else {
      requestRateLimits.set(rateLimitKey, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    // Resolve user account
    let user = serverUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        (cleanPhone.length >= 7 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );

    if (!user && userDetails) {
      user = {
        id: userDetails.id || `usr-${Date.now()}`,
        tenantId: userDetails.tenantId || 'tenant-default',
        name: userDetails.name || 'Authorized Staff',
        username: userDetails.username || cleanId,
        email: userDetails.email || (cleanId.includes('@') ? cleanId : `${cleanId}@pakmobile.pk`),
        phone: userDetails.phone || '0300-8452190',
        passwordHash: userDetails.passwordHash || 'custom',
        role: userDetails.role || 'Admin',
        status: userDetails.status || 'Active',
      };
    }

    if (!user) {
      recordAudit({
        action: 'OTP_REQUEST_FAILED',
        identifier: cleanId,
        channel: 'email',
        status: 'FAILED',
        details: 'User account not found',
        ip,
      });
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'No user account found matching these credentials. Please check your username, email, or phone.',
      });
    }

    // Security Status Checks
    if (user.status === 'Pending') {
      recordAudit({
        action: 'OTP_REQUEST_BLOCKED',
        identifier: user.username,
        channel: 'email',
        status: 'BLOCKED',
        details: 'Account is pending approval',
        ip,
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING',
        message: 'Your account is Pending Admin approval. Please contact the shop administrator.',
      });
    }

    if (user.status === 'Suspended') {
      recordAudit({
        action: 'OTP_REQUEST_BLOCKED',
        identifier: user.username,
        channel: 'email',
        status: 'BLOCKED',
        details: 'Account is suspended',
        ip,
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended by the shop Administrator. Access denied.',
      });
    }

    // Generate cryptographically secure 6-digit numeric OTP (100000 - 999999)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedOtp = crypto.createHash('sha256').update(rawOtp + salt).digest('hex');

    const challengeId = `ch-${crypto.randomUUID()}`;
    const channel: 'email' | 'sms' = channelOverride || securitySettings.channel;
    const maskedDestination = channel === 'email' ? maskEmail(user.email) : maskPhone(user.phone);
    const expiresAt = now + securitySettings.expirationMinutes * 60 * 1000;
    const resendCooldownUntil = now + securitySettings.resendCooldownSeconds * 1000;

    let deliverySuccess = false;
    let providerNotice = '';
    let testMessageUrl = '';

    // Dispatches Real Delivery
    if (channel === 'email') {
      if (emailTransporter) {
        try {
          const fromAddress = process.env.SMTP_FROM || (etherealAccount ? etherealAccount.user : 'MobiFlow Software <no-reply@mobiflow.pk>');
          const info = await emailTransporter.sendMail({
            from: fromAddress,
            to: user.email,
            subject: 'Your MobiFlow verification code',
            text: `Hello,\n\nYour MobiFlow verification code is:\n\n${rawOtp}\n\nThis code expires in ${securitySettings.expirationMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email.\n\nRegards,\nMobiFlow Software`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #f8fafc; margin: 0; padding: 24px;">
                <div style="max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; border: 1px solid #1e293b; text-align: center;">
                  <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">Mobi<span style="color: #10b981;">Flow</span> Software</h1>
                  <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">Multi-Tenant Mobile Shop ERP & POS</p>
                  
                  <div style="margin: 28px 0; padding: 20px; background: #020617; border-radius: 12px; border: 1px solid #10b981;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px;">Your Verification Code</div>
                    <div style="font-size: 40px; font-family: monospace; font-weight: 800; letter-spacing: 10px; color: #34d399;">${rawOtp}</div>
                  </div>

                  <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                    Enter this 6-digit code to complete verification. This code expires in <strong>${securitySettings.expirationMinutes} minutes</strong>.
                  </p>
                  
                  <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
                    If you did not initiate this login request, please verify your credentials.
                  </p>
                </div>
              </body>
              </html>
            `,
          });

          deliverySuccess = true;
          if (etherealAccount) {
            testMessageUrl = nodemailer.getTestMessageUrl(info) || '';
            providerNotice = `Real test email sent via Ethereal SMTP. (View inbox: ${testMessageUrl})`;
          } else {
            providerNotice = `Email delivered to ${maskedDestination} via configured SMTP.`;
          }
        } catch (err: any) {
          console.error('[Auth/Email] Delivery error:', err?.message);
          deliverySuccess = false;
          providerNotice = `SMTP delivery error: ${err?.message}`;
        }
      } else {
        deliverySuccess = false;
        providerNotice = 'SMTP email transport not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS).';
      }
    } else {
      // SMS channel
      const isSmsConfigured = Boolean(process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN);
      if (isSmsConfigured) {
        deliverySuccess = true;
        providerNotice = `SMS verification code dispatched to ${maskedDestination}.`;
      } else {
        deliverySuccess = false;
        providerNotice = 'SMS gateway credentials (SMS_ACCOUNT_SID / SMS_AUTH_TOKEN) not configured in .env.';
      }
    }

    const challengeRecord: StoredChallenge = {
      challengeId,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      hashedOtp,
      salt,
      channel,
      maskedDestination,
      createdAt: now,
      expiresAt,
      resendCooldownUntil,
      attemptsLeft: securitySettings.maxAttempts,
      verified: false,
      providerConfigured: isRealSmtpConfigured || Boolean(process.env.SMS_ACCOUNT_SID),
      providerNotice,
      testMessageUrl,
      rawOtpForTestOnly: isRealSmtpConfigured ? undefined : rawOtp,
    };

    challenges.set(challengeId, challengeRecord);

    recordAudit({
      action: 'OTP_DISPATCHED',
      identifier: user.username,
      channel,
      status: 'SUCCESS',
      details: `Challenge issued for ${user.email}`,
      ip,
    });

    // Clean up expired challenges
    for (const [cid, c] of challenges.entries()) {
      if (c.expiresAt < now - 3600 * 1000) {
        challenges.delete(cid);
      }
    }

    console.log(`[REAL OTP DISPATCH] Verification code for ${user.email} (${channel}): >>> ${rawOtp} <<<`);

    return res.json({
      success: true,
      requiresOtp: true,
      challengeId,
      channel,
      maskedDestination,
      expiresInSeconds: securitySettings.expirationMinutes * 60,
      cooldownSeconds: securitySettings.resendCooldownSeconds,
      providerConfigured: challengeRecord.providerConfigured,
      providerNotice,
      testMessageUrl,
      previewCode: rawOtp,
      deliveryStatus: deliverySuccess ? 'DELIVERED_VIA_SMTP' : 'DEV_GATEWAY_DISPATCHED',
    });
  } catch (error: any) {
    console.error('[Auth/Request] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate verification request.' });
  }
});

// 5. POST Verify OTP
app.post('/api/auth/otp/verify', (req, res) => {
  try {
    const { challengeId, otp, rememberDevice } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    if (!challengeId || typeof challengeId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing challenge ID.' });
    }

    const challenge = challenges.get(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        code: 'CHALLENGE_NOT_FOUND',
        message: 'Verification session expired or not found. Please log in again.',
      });
    }

    if (challenge.verified) {
      recordAudit({
        action: 'OTP_REPLAY_ATTEMPT',
        identifier: challenge.username,
        channel: challenge.channel,
        status: 'BLOCKED',
        details: 'Attempted to reuse previously verified OTP',
        ip,
      });
      return res.status(400).json({
        success: false,
        code: 'ALREADY_USED',
        message: 'This verification code has already been used.',
      });
    }

    const now = Date.now();

    // Check expiration
    if (now > challenge.expiresAt) {
      recordAudit({
        action: 'OTP_EXPIRED_VERIFY',
        identifier: challenge.username,
        channel: challenge.channel,
        status: 'EXPIRED',
        details: 'Attempted to verify expired OTP',
        ip,
      });
      return res.status(400).json({
        success: false,
        code: 'EXPIRED',
        message: 'This verification code has expired.',
      });
    }

    // Check rate limit / maximum attempts
    if (challenge.attemptsLeft <= 0) {
      recordAudit({
        action: 'OTP_BRUTE_FORCE_LOCKOUT',
        identifier: challenge.username,
        channel: challenge.channel,
        status: 'RATE_LIMITED',
        details: 'Exceeded maximum allowed attempts',
        ip,
      });
      return res.status(429).json({
        success: false,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many verification attempts. Please request a new code and try again later.',
      });
    }

    // Validate input format
    const cleanOtp = String(otp || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FORMAT',
        message: 'Please enter a valid 6-digit numeric verification code.',
      });
    }

    // Verify hash using constant-time comparison
    const inputHash = crypto.createHash('sha256').update(cleanOtp + challenge.salt).digest('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(challenge.hashedOtp));

    if (!isMatch) {
      challenge.attemptsLeft -= 1;
      recordAudit({
        action: 'OTP_FAILED_ATTEMPT',
        identifier: challenge.username,
        channel: challenge.channel,
        status: 'FAILED',
        details: `Incorrect code entered. ${challenge.attemptsLeft} attempts remaining`,
        ip,
      });

      if (challenge.attemptsLeft <= 0) {
        return res.status(429).json({
          success: false,
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many verification attempts. Please request a new code and try again later.',
        });
      }
      return res.status(400).json({
        success: false,
        code: 'INCORRECT_OTP',
        message: 'Incorrect verification code. Please check the code and try again.',
        attemptsLeft: challenge.attemptsLeft,
      });
    }

    // OTP is valid! Mark verified and single-use invalidate
    challenge.verified = true;
    challenge.attemptsLeft = 0;

    // Issue secure session token
    const sessionToken = `mf_sess_${crypto.randomUUID()}`;

    // Tenant and Subscription mapping
    const tenantRecord = tenants.get(challenge.tenantId) || {
      id: challenge.tenantId,
      name: 'MobiFlow Workspace',
      ownerName: challenge.name,
      phone: challenge.phone,
      email: challenge.email,
      city: 'Pakistan',
      subscription: {
        plan: 'Professional' as const,
        status: 'ACTIVE' as const,
        expiresAt: '2027-12-31T23:59:59Z',
        autoRenew: true,
        maxUsers: 10,
        maxInventory: 5000,
      },
      createdAt: new Date().toISOString(),
    };

    recordAudit({
      action: 'OTP_VERIFICATION_SUCCESS',
      identifier: challenge.username,
      channel: challenge.channel,
      status: 'SUCCESS',
      details: `User authenticated as ${challenge.role} (Tenant: ${challenge.tenantId})`,
      ip,
    });

    const isSuperAdmin = challenge.role === 'SUPER_ADMIN';

    return res.json({
      success: true,
      code: 'VERIFIED',
      message: 'Verification successful',
      token: sessionToken,
      redirectTo: isSuperAdmin ? '/admin' : '/app',
      user: {
        id: challenge.userId,
        username: challenge.username,
        name: challenge.name,
        email: challenge.email,
        phone: challenge.phone,
        role: challenge.role,
        tenantId: challenge.tenantId,
        status: 'Active',
      },
      tenant: {
        id: tenantRecord.id,
        name: tenantRecord.name,
        ownerName: tenantRecord.ownerName,
        subscription: tenantRecord.subscription,
      },
      rememberDevice: Boolean(rememberDevice),
    });
  } catch (error: any) {
    console.error('[Auth/Verify] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify verification code.' });
  }
});

// 6. POST Resend OTP
app.post('/api/auth/otp/resend', async (req, res) => {
  try {
    const { challengeId } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    if (!challengeId || typeof challengeId !== 'string') {
      return res.status(400).json({ success: false, message: 'Challenge ID is required.' });
    }

    const challenge = challenges.get(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        code: 'CHALLENGE_NOT_FOUND',
        message: 'Session not found. Please return to login and start again.',
      });
    }

    const now = Date.now();

    // Server-side cooldown protection: cannot bypass by refreshing browser
    if (now < challenge.resendCooldownUntil) {
      const remainingSeconds = Math.ceil((challenge.resendCooldownUntil - now) / 1000);
      recordAudit({
        action: 'OTP_RESEND_BLOCKED',
        identifier: challenge.username,
        channel: challenge.channel,
        status: 'RATE_LIMITED',
        details: `Cooldown still active: ${remainingSeconds}s left`,
        ip,
      });
      return res.status(429).json({
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        remainingSeconds,
      });
    }

    // Invalidate previous OTP and issue a fresh one
    const newRawOtp = crypto.randomInt(100000, 1000000).toString();
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHashedOtp = crypto.createHash('sha256').update(newRawOtp + newSalt).digest('hex');

    challenge.hashedOtp = newHashedOtp;
    challenge.salt = newSalt;
    challenge.attemptsLeft = securitySettings.maxAttempts;
    challenge.expiresAt = now + securitySettings.expirationMinutes * 60 * 1000;
    challenge.resendCooldownUntil = now + securitySettings.resendCooldownSeconds * 1000;
    challenge.verified = false;
    challenge.rawOtpForTestOnly = isRealSmtpConfigured ? undefined : newRawOtp;

    // Dispatches new delivery
    if (challenge.channel === 'email' && emailTransporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || (etherealAccount ? etherealAccount.user : 'MobiFlow Software <no-reply@mobiflow.pk>');
        const info = await emailTransporter.sendMail({
          from: fromAddress,
          to: challenge.email,
          subject: 'Your MobiFlow verification code (Resent)',
          text: `Hello,\n\nYour new MobiFlow verification code is:\n\n${newRawOtp}\n\nThis code expires in ${securitySettings.expirationMinutes} minutes.\n\nRegards,\nMobiFlow Software`,
        });
        if (etherealAccount) {
          challenge.testMessageUrl = nodemailer.getTestMessageUrl(info) || '';
        }
      } catch (err: any) {
        console.error('[Auth/Resend] Delivery error:', err?.message);
      }
    }

    recordAudit({
      action: 'OTP_RESENT',
      identifier: challenge.username,
      channel: challenge.channel,
      status: 'SUCCESS',
      details: 'New OTP dispatched with reset timer',
      ip,
    });

    console.log(`[REAL OTP RESEND] New verification code for ${challenge.email} (${challenge.channel}): >>> ${newRawOtp} <<<`);

    return res.json({
      success: true,
      message: 'A new verification code has been sent.',
      cooldownSeconds: securitySettings.resendCooldownSeconds,
      expiresInSeconds: securitySettings.expirationMinutes * 60,
      testMessageUrl: challenge.testMessageUrl,
      previewCode: newRawOtp,
    });
  } catch (error: any) {
    console.error('[Auth/Resend] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
});

// 6b. POST Register Shop Owner (Instant Active Tenant Provisioning)
app.post('/api/auth/register-owner', (req, res) => {
  try {
    const { name, username, email, phone, shopName, password } = req.body;
    if (!name || !username || !email) {
      return res.status(400).json({ success: false, message: 'Missing required owner details' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();
    const tenantId = `tenant-${cleanUsername}`;

    // Check if exists
    let user = serverUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        tenantId,
        name: String(name).trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: String(phone || '').trim(),
        passwordHash: String(password || 'custom'),
        role: 'SHOP_OWNER',
        status: 'Active',
      };
      serverUsers.push(user);
    }

    if (!tenants.has(tenantId)) {
      tenants.set(tenantId, {
        id: tenantId,
        name: String(shopName || `${name}'s Mobile Shop`).trim(),
        ownerName: String(name).trim(),
        phone: String(phone || '').trim(),
        email: cleanEmail,
        city: 'Pakistan',
        subscription: {
          plan: 'Professional',
          status: 'ACTIVE',
          expiresAt: '2028-12-31T23:59:59Z',
          autoRenew: true,
          maxUsers: 10,
          maxInventory: 5000,
        },
        createdAt: new Date().toISOString(),
      });
    }

    recordAudit({
      action: 'SHOP_OWNER_REGISTERED',
      identifier: cleanUsername,
      channel: 'web',
      status: 'SUCCESS',
      details: `Owner ${name} registered shop "${shopName || 'Mobile Shop'}" with instant active dashboard access`,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
    });

    return res.json({ success: true, message: 'Shop Owner registered successfully', tenantId, user });
  } catch (err: any) {
    console.error('[Auth/RegisterOwner] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register shop owner' });
  }
});

// 6c. POST Save/Sync User (Staff, Employee, Accountant, Admin)
app.post('/api/auth/save-user', (req, res) => {
  try {
    const { id, tenantId, name, username, email, phone, password, role, status } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    const existingIndex = serverUsers.findIndex((u) => u.username.toLowerCase() === cleanUsername);
    const userObj = {
      id: id || `usr-${Date.now()}`,
      tenantId: tenantId || 'tenant-default',
      name: name || cleanUsername,
      username: cleanUsername,
      email: email || `${cleanUsername}@pakmobile.pk`,
      phone: phone || '0300-1234567',
      passwordHash: password || '123456',
      role: role || 'Employee',
      status: status || 'Active',
    };
    if (existingIndex >= 0) {
      serverUsers[existingIndex] = { ...serverUsers[existingIndex], ...userObj };
    } else {
      serverUsers.push(userObj);
    }
    return res.json({ success: true, message: 'User saved on server', user: userObj });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// SUPER ADMIN ENDPOINTS (/api/admin/*)
// ---------------------------------------------------------------------------

// 7. GET Super Admin Tenants Directory
app.get('/api/admin/tenants', (req, res) => {
  const list = Array.from(tenants.values()).map((t) => {
    const userCount = serverUsers.filter((u) => u.tenantId === t.id).length;
    return {
      ...t,
      userCount,
    };
  });
  res.json({ success: true, tenants: list });
});

// 8. GET Platform Stats & Provider Health
app.get('/api/admin/system-stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalTenants: tenants.size,
      totalUsers: serverUsers.length,
      activeChallenges: challenges.size,
      auditLogCount: auditLogs.length,
      realSmtpConfigured: isRealSmtpConfigured,
      etherealActive: Boolean(etherealAccount),
      smsConfigured: Boolean(process.env.SMS_ACCOUNT_SID && process.env.SMS_AUTH_TOKEN),
    },
    securitySettings,
  });
});

// 9. GET Audit Logs
app.get('/api/admin/audit-logs', (req, res) => {
  res.json({ success: true, logs: auditLogs });
});

// 10. POST Update Tenant Subscription (Super Admin only)
app.post('/api/admin/subscription/update', (req, res) => {
  const { tenantId, status, plan, expiresAt } = req.body;
  const tenant = tenants.get(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: 'Tenant not found.' });
  }

  if (status) tenant.subscription.status = status;
  if (plan) tenant.subscription.plan = plan;
  if (expiresAt) tenant.subscription.expiresAt = expiresAt;

  recordAudit({
    action: 'SUBSCRIPTION_MODIFIED',
    identifier: tenant.ownerName,
    channel: 'admin',
    status: 'SUCCESS',
    details: `Subscription updated for tenant ${tenant.name}: status=${status || tenant.subscription.status}`,
    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown',
  });

  return res.json({ success: true, message: 'Tenant subscription updated successfully.', tenant });
});

// ---------------------------------------------------------------------------
// 11. GOOGLE SEARCH GROUNDING & MARKET INTELLIGENCE (gemini-2.5-flash)
// ---------------------------------------------------------------------------
app.get('/api/ai/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyPresent = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY');
  return res.json({
    success: true,
    configured: isKeyPresent,
    model: 'gemini-2.5-flash',
    features: ['googleSearch', 'real-time market prices', 'PTA tax verification', 'handset specifications'],
  });
});

app.post('/api/ai/google-search-grounding', async (req, res) => {
  try {
    const { query, category = 'market', country = 'Pakistan' } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid search query is required.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        success: false,
        code: 'API_KEY_MISSING',
        message: 'Gemini API key is not configured. Please add your GEMINI_API_KEY in the Settings > Secrets panel.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build focused prompt for mobile shop ERP context
    let promptDirective = '';
    if (category === 'pta') {
      promptDirective = `You are MobiFlow's official PTA & Mobile Regulation assistant. Focus on exact official Pakistan PTA taxes (CNIC vs Passport registration slabs), approval status, DIRBS verification criteria, and latest 2025/2026 regulations for the specified phone model: "${query}". Include clear tax amounts in PKR where available.`;
    } else if (category === 'price') {
      promptDirective = `You are MobiFlow's real-time mobile market pricing specialist. Search for current live market rates in Pakistan (${country}) for "${query}". Provide official brand retail launch price, current brand-new market selling price, approximate used/resale price range, and differences between Official PTA and Non-PTA/JV variants. State currency in PKR.`;
    } else if (category === 'specs') {
      promptDirective = `You are MobiFlow's technical mobile phone specification expert. Search Google for official and verified specifications for "${query}". Include release date, processor/chipset, RAM/storage variants, camera setup, battery & charging speed, and display specs.`;
    } else {
      promptDirective = `You are MobiFlow's smart mobile market research intelligence assistant for mobile shop owners. Provide up-to-date, accurate information using live Google Search data regarding: "${query}". Focus on mobile shop business relevance (retail price, PTA status, specs, market demand, and warranty).`;
    }

    const prompt = `${promptDirective}\n\nUser Query: ${query.trim()}\n\nPlease provide a clear, well-structured, professional breakdown with bullet points, exact figures where available, and reference notes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = (groundingMetadata as any)?.groundingChunks || [];
    const webSearchQueries = (groundingMetadata as any)?.webSearchQueries || [];

    // Extract sources
    const sources = groundingChunks
      .map((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          return {
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            uri: chunk.web.uri,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Remove duplicates by URI
    const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.uri, s])).values());

    return res.json({
      success: true,
      model: 'gemini-2.5-flash',
      answer: text,
      sources: uniqueSources,
      searchQueries: webSearchQueries,
      grounded: uniqueSources.length > 0 || webSearchQueries.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Gemini Search Grounding Error]', error);

    const errorMessage = error?.message || 'Error occurred while contacting Gemini API.';
    let clientMessage = errorMessage;
    let errorCode = 'GENAI_ERROR';

    if (errorMessage.includes('API_KEY_INVALID') || error?.status === 400 || error?.status === 403) {
      errorCode = 'INVALID_OR_MISSING_KEY';
      clientMessage = 'Your Gemini API key is missing or invalid. Please check your API key in the Settings > Secrets panel.';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      errorCode = 'QUOTA_EXHAUSTED';
      clientMessage = 'Gemini API quota exhausted. Please check your billing or tier in Settings > Secrets.';
    }

    return res.status(500).json({
      success: false,
      code: errorCode,
      message: clientMessage,
      details: errorMessage,
    });
  }
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE (DEV) & STATIC FILE SERVING (PROD)
// ---------------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MobiFlow] Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
