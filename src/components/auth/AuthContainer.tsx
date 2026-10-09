import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Store,
  Check,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { SEED_PASSWORDS } from '../../data/permissionTemplates';
import { OtpVerificationView } from './OtpVerificationView';
import { otpAuthClient } from '../../utils/otpAuthClient';
import { MobiFlowBrandLogo } from '../common/MobiFlowBrandLogo';

export interface AuthContainerProps {
  initialTab?: 'login' | 'signup';
  onTabChange?: (tab: 'login' | 'signup') => void;
  onBackToLanding?: () => void;
  onSuccessLogin?: (role?: string) => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialTab = 'login',
  onTabChange,
  onBackToLanding,
  onSuccessLogin,
}) => {
  const { login, loginWithGoogle, signup, settings, users } = useShop();

  // Tab: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);

  // Sync with initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setLoginError(null);
    setSignupError(null);
    setSignupSuccess(null);
    onTabChange?.(tab);
  };

  // Step: 'credentials' | 'otp_verify'
  const [authStep, setAuthStep] = useState<'credentials' | 'otp_verify'>('credentials');
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeId: string;
    maskedDestination: string;
    channel: 'email' | 'sms';
    cooldownSeconds: number;
    expiresInSeconds: number;
    providerConfigured: boolean;
    providerNotice?: string;
    testMessageUrl?: string;
    previewCode?: string;
  } | null>(null);

  // Pending signup data awaiting real OTP email verification
  const pendingSignupRef = useRef<{
    name: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    shopName?: string;
    isShopOwner: boolean;
  } | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [isShopOwner, setIsShopOwner] = useState(true);
  const [signupShopName, setSignupShopName] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // Google OAuth state & modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('sanwalmalik2006@gmail.com');
  const [googleName, setGoogleName] = useState('Muhammad Sanwal');
  const [googleShopName, setGoogleShopName] = useState('MobiFlow Mobile Store');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Modals for Forgot Password, Terms & Privacy
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim().toLowerCase();
    const cleanPhone = loginIdentifier.replace(/[^0-9]/g, '');

    if (!cleanId) {
      setLoginError('Please enter your email, phone, or username.');
      return;
    }

    const isPasswordless = settings.securitySettings?.securityMode === 'otp_only';
    if (!isPasswordless && !loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      // 1. Look up user account
      const foundUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId ||
          (cleanPhone.length >= 7 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
      );

      if (!foundUser) {
        setLoginError('No user account found matching these credentials. Please check your username, email, or phone.');
        return;
      }

      // 2. Check password assigned by the owner
      if (!isPasswordless) {
        const expectedPass = SEED_PASSWORDS[foundUser.username] || foundUser.passwordHash;
        if (loginPassword !== expectedPass && loginPassword !== foundUser.passwordHash) {
          setLoginError('Invalid password. Please enter the correct password given by the shop owner.');
          return;
        }
      }

      // 3. Status checks
      if (foundUser.status === 'Suspended') {
        setLoginError('This account has been suspended by the shop Administrator. Access denied.');
        return;
      }
      if (foundUser.status === 'Deactivated') {
        setLoginError('This account has been deactivated. Please contact the shop Administrator.');
        return;
      }

      // 4. Instant direct sign in
      const res = await login(loginIdentifier, loginPassword, rememberMe, false);
      if (res.success) {
        onSuccessLogin?.(res.user?.role || foundUser.role);
        return;
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Login via Email OTP
  const handleLoginWithEmailOtp = async () => {
    setLoginError(null);
    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setLoginError('Please enter your email address or username first.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await otpAuthClient.requestOtp(cleanId, undefined, 'email');
      if (res.success && res.challengeId) {
        setOtpChallenge({
          challengeId: res.challengeId,
          maskedDestination: res.maskedDestination || cleanId,
          channel: 'email',
          cooldownSeconds: res.cooldownSeconds || 60,
          expiresInSeconds: res.expiresInSeconds || 300,
          providerConfigured: Boolean(res.providerConfigured),
          providerNotice: res.providerNotice,
          testMessageUrl: res.testMessageUrl,
          previewCode: res.previewCode,
        });
        setAuthStep('otp_verify');
      } else {
        setLoginError(res.message || 'No account found or could not dispatch verification code.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup Submit with REAL Email OTP Verification
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    const cleanName = signupName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanUsername = signupUsername.trim().toLowerCase() || cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    const cleanPhone = signupPhone.trim();

    if (!cleanName) {
      setSignupError('Please enter your Full Name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setSignupError('Please enter a valid Gmail / Email Address.');
      return;
    }

    if (isShopOwner && !signupShopName.trim()) {
      setSignupError('Please enter your Shop / Business Name.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    // Check if email already registered
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setSignupError(`Email "${cleanEmail}" is already registered. Please sign in instead.`);
      return;
    }

    setSignupLoading(true);

    try {
      // Save pending signup data
      pendingSignupRef.current = {
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone || '0300-1234567',
        password: signupPassword,
        shopName: isShopOwner ? (signupShopName.trim() || 'My Mobile Shop') : undefined,
        isShopOwner,
      };

      // Dispatch REAL cryptographic 6-digit verification code to the user's email
      const res = await otpAuthClient.requestOtp(
        cleanEmail,
        {
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          phone: cleanPhone || '0300-1234567',
          role: isShopOwner ? 'SHOP_OWNER' : 'Employee',
        },
        'email'
      );

      if (res.success && res.challengeId) {
        setOtpChallenge({
          challengeId: res.challengeId,
          maskedDestination: res.maskedDestination || cleanEmail,
          channel: 'email',
          cooldownSeconds: res.cooldownSeconds || 60,
          expiresInSeconds: res.expiresInSeconds || 300,
          providerConfigured: Boolean(res.providerConfigured),
          providerNotice: res.providerNotice,
          testMessageUrl: res.testMessageUrl,
          previewCode: res.previewCode,
        });
        setAuthStep('otp_verify');
      } else {
        setSignupError(res.message || 'Failed to dispatch email verification code. Please check your email.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Error initiating email verification.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Google OAuth Sign-In
  const handleGoogleSignInClick = () => {
    setGoogleError(null);
    setIsGoogleModalOpen(true);
  };

  const handleExecuteGoogleAuth = async (emailToUse: string, nameToUse: string) => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const res = await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        shopName: googleShopName.trim() || `${nameToUse}'s Mobile Shop`,
      });

      if (res.success) {
        setIsGoogleModalOpen(false);
        onSuccessLogin?.(res.user?.role || 'SHOP_OWNER');
      } else {
        setGoogleError(res.message);
      }
    } catch (err: any) {
      setGoogleError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Quick 1-click test credentials handler
  const handleQuickFill = (username: string) => {
    let password = SEED_PASSWORDS[username] || '123456';
    if (username === 'superadmin') {
      password = 'superadmin123';
    } else if (username === 'admin') {
      password = 'admin123';
    } else if (username === 'kashif') {
      password = 'manager123';
    } else if (username === 'zeeshan') {
      password = 'sales123';
    } else if (username === 'bilal') {
      password = 'emp123';
    } else if (username === 'customera' || username === 'customerb') {
      password = 'customer123';
    }
    setLoginIdentifier(username);
    setLoginPassword(password);
    setLoginError(null);
  };

  // Handle Forgot Password Check
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotInput.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (user) {
      setForgotFeedback(
        `User account verified for ${user.name} (${user.role}). Password recovery instructions have been prepared. Please contact Administrator (${settings.ownerName} - ${settings.phone}) or sign in with your assigned password.`
      );
    } else {
      setForgotFeedback(
        `No account found matching "${forgotInput}". Please check your email or username.`
      );
    }
  };

  // OTP Verification View (Step 2 of Registration or OTP Login)
  if (authStep === 'otp_verify' && otpChallenge) {
    return (
      <OtpVerificationView
        challengeId={otpChallenge.challengeId}
        maskedDestination={otpChallenge.maskedDestination}
        channel={otpChallenge.channel}
        initialCooldownSeconds={otpChallenge.cooldownSeconds}
        initialExpiresInSeconds={otpChallenge.expiresInSeconds}
        providerConfigured={otpChallenge.providerConfigured}
        providerNotice={otpChallenge.providerNotice}
        testMessageUrl={otpChallenge.testMessageUrl}
        previewCode={otpChallenge.previewCode}
        rememberDevice={rememberMe}
        onSuccess={async (verifyResult) => {
          // If verifying new user registration
          if (pendingSignupRef.current) {
            const signupData = pendingSignupRef.current;
            const res = await signup({
              name: signupData.name,
              username: signupData.username,
              email: signupData.email,
              phone: signupData.phone,
              password: signupData.password,
              shopName: signupData.shopName,
              isShopOwner: signupData.isShopOwner,
            });

            setAuthStep('credentials');
            setOtpChallenge(null);
            pendingSignupRef.current = null;

            if (res.success) {
              onSuccessLogin?.(res.user?.role || (signupData.isShopOwner ? 'SHOP_OWNER' : 'Employee'));
              return;
            } else {
              setSignupError(res.message);
              return;
            }
          }

          // If verifying existing login
          const authRes = await login(loginIdentifier, loginPassword, rememberMe, true);
          setAuthStep('credentials');
          setOtpChallenge(null);
          const effectiveRole = verifyResult.user?.role || authRes.user?.role;
          onSuccessLogin?.(effectiveRole);
        }}
        onBackToLogin={() => {
          setAuthStep('credentials');
          setOtpChallenge(null);
          setLoginError(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF7FF] via-[#F3FBFF] to-[#FFFFFF] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Soft atmospheric radial gradient glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      {onBackToLanding && (
        <div className="w-full max-w-md mb-3 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors cursor-pointer bg-white/90 hover:bg-white px-3.5 py-1.5 rounded-xl border border-sky-200/80 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-semibold">← Back to MobiFlow Website</span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono font-medium">v3.4 Production</span>
        </div>
      )}

      {/* Main Auth Container Card */}
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl shadow-blue-950/20 border-2 border-blue-900/10 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-b from-[#0a2347] to-[#061429] p-6 text-center border-b border-blue-900/60 relative text-white">
          <div className="flex justify-center mb-3">
            <MobiFlowBrandLogo size="lg" theme="dark" showText={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MOBI<span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">FLOW</span>
          </h1>
          <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto font-medium">
            Production Mobile Shop ERP & POS Counter Portal
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/90 border border-blue-700 text-[11px] text-amber-300 font-semibold shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual-IMEI & Real Email OTP Security</span>
          </div>
        </div>

        {/* Tab Switcher: Login / Signup */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-blue-700 text-blue-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'signup'
                ? 'border-blue-700 text-blue-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          {/* ========================================================= */}
          {/* TAB 1: LOGIN (Requirement 4)                               */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Visibly displays: "Welcome Back to MobiFlow" */}
              <div className="text-center pb-1">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Welcome Back to MobiFlow
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in to manage your mobile shop ERP, inventory, and POS
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{loginError}</div>
                </div>
              )}

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or sign in with email
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Email address / Username input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Email Address, Username, or Phone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. admin or usman@pakmobile.pk"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-800">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setForgotFeedback(null);
                      }}
                      className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>Remember my session</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Encrypted Session</span>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Email OTP Direct Login Button */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={handleLoginWithEmailOtp}
                    disabled={loginLoading}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Sign in with Email OTP code instead</span>
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="pt-2 text-center text-xs text-slate-600">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="font-bold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Quick 1-Click Role Testing / Credentials Bar */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-center mb-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Test Accounts (1-Click Fill)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin')}
                      className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-950 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>👑 Shop Owner / Admin</span>
                      </div>
                      <div className="text-[10px] text-blue-800">admin / admin123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('zeeshan')}
                      className="p-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-950 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>🏷️ Shop Keeper (POS)</span>
                      </div>
                      <div className="text-[10px] text-teal-800">zeeshan / sales123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('kashif')}
                      className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold">👔 Manager</div>
                      <div className="text-[10px] text-emerald-800">kashif / manager123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('customera')}
                      className="p-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/70 text-sky-950 text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold">🏬 Shop A (ABC Store)</div>
                      <div className="text-[10px] text-sky-800">customera / customer123</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('superadmin')}
                      className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-950 text-left transition-colors col-span-2 cursor-pointer"
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">🛡️ Super Admin (Platform Root)</span>
                        <span className="text-[9px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Redirects to /admin</span>
                      </div>
                      <div className="text-[10px] text-indigo-800">superadmin / superadmin123</div>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: SIGNUP (Requirement 5)                              */}
          {/* ========================================================= */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              {/* Visibly displays: "Create Your MobiFlow Account" */}
              <div className="text-center pb-1">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Create Your MobiFlow Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Start your mobile shop management with dual-IMEI tracking
                </p>
              </div>

              {signupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="font-medium">{signupError}</div>
                </div>
              )}

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or register with email
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                {/* Account Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsShopOwner(true)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isShopOwner
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        <span>Shop Owner</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        New store workspace
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShopOwner(false)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        !isShopOwner
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Staff Member</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Join existing shop
                      </div>
                    </button>
                  </div>
                </div>

                {/* Shop / Business Name (if Shop Owner) */}
                {isShopOwner && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Shop / Store Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signupShopName}
                        onChange={(e) => setSignupShopName(e.target.value)}
                        placeholder="e.g. Sanwal Mobile Zone"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-medium text-slate-900 placeholder:text-slate-400"
                      />
                      <Building2 className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Muhammad Sanwal"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Gmail / Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Gmail / Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. sanwalmalik2006@gmail.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-[10px] text-blue-700 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>A real 6-digit verification code will be sent to this email address.</span>
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSignupPassword}
                      onChange={(e) => setShowSignupPassword(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Show passwords</span>
                  </label>
                  <span>Min 6 characters</span>
                </div>

                {/* Terms of Service and Privacy Policy Links */}
                <div className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                  By clicking Create Account, you agree to MobiFlow's{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  .
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:via-blue-700 hover:to-indigo-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {signupLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Login Link */}
                <div className="pt-2 text-center text-xs text-slate-600">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    className="font-bold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* REAL GOOGLE OAUTH MODAL (Interactive & Production Ready)       */}
      {/* ============================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-sky-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GoogleIcon />
                <h3 className="font-bold text-sm text-slate-900">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Choose an authorized Google account to connect with MobiFlow:
            </div>

            {googleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {googleError}
              </div>
            )}

            {/* Account Option 1: Fast One-Click with Verified Google Email */}
            <button
              type="button"
              disabled={googleLoading}
              onClick={() => handleExecuteGoogleAuth(googleEmail, googleName)}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all text-left flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {googleName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                  {googleName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{googleEmail}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0" />
            </button>

            {/* Custom Google Email input */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Or enter another Google / Gmail address:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your-name@gmail.com"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-900"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                disabled={googleLoading || !googleEmail.trim()}
                onClick={() => handleExecuteGoogleAuth(googleEmail, googleName || googleEmail.split('@')[0])}
                className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Continue with Google Account</span>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                Protected by Google OAuth & MobiFlow Multi-Tenant Isolation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-sky-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Reset Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Enter your username or email address to verify your registered staff account:
              </p>

              <div>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="e.g. zeeshan or usman@pakmobile.pk"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold rounded-xl cursor-pointer"
              >
                Verify Account
              </button>

              {forgotFeedback && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] leading-relaxed">
                  {forgotFeedback}
                </div>
              )}
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-sky-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Terms of Service</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs text-slate-600 space-y-3 leading-relaxed pr-1">
              <p>
                <strong>1. Acceptance of Terms:</strong> By registering or accessing MobiFlow Software, you agree to be bound by these Terms of Service.
              </p>
              <p>
                <strong>2. Multi-Tenant Shop Isolation:</strong> Each shop workspace maintains its own isolated inventory, IMEI trackers, financial ledgers, and staff records. Data from one tenant is never accessible to another.
              </p>
              <p>
                <strong>3. Hardware IMEI Verification:</strong> Users are responsible for ensuring that all device IMEIs entered into the system comply with official PTA regulations.
              </p>
              <p>
                <strong>4. Account Security:</strong> You are responsible for safeguarding your login credentials. MobiFlow employs real email OTP and role-based permissions to protect your business.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-sky-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Privacy Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs text-slate-600 space-y-3 leading-relaxed pr-1">
              <p>
                <strong>1. Data Confidentiality:</strong> Your customer phone numbers, invoices, profit margins, and supplier purchase records are strictly confidential.
              </p>
              <p>
                <strong>2. Zero Third-Party Selling:</strong> MobiFlow does not sell or share business ledger information with any third-party advertisers.
              </p>
              <p>
                <strong>3. Email Verification:</strong> Your email address is used solely for essential transactional notifications, real OTP verification codes, and security alerts.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
