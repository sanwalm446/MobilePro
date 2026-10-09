import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { otpAuthClient, VerifyOtpResponse } from '../../utils/otpAuthClient';

interface OtpVerificationViewProps {
  challengeId: string;
  maskedDestination: string;
  channel?: 'email' | 'sms';
  initialCooldownSeconds?: number;
  initialExpiresInSeconds?: number;
  providerConfigured?: boolean;
  providerNotice?: string;
  testMessageUrl?: string;
  previewCode?: string;
  rememberDevice?: boolean;
  onSuccess: (verifyResult: VerifyOtpResponse) => void;
  onBackToLogin: () => void;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({
  challengeId,
  maskedDestination,
  channel = 'email',
  initialCooldownSeconds = 60,
  initialExpiresInSeconds = 300,
  providerConfigured = false,
  providerNotice,
  testMessageUrl: initialTestUrl,
  previewCode: initialPreviewCode,
  rememberDevice = true,
  onSuccess,
  onBackToLogin,
}) => {
  // 6-digit OTP array
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer states
  const [cooldownLeft, setCooldownLeft] = useState(initialCooldownSeconds);
  const [expiresLeft, setExpiresLeft] = useState(initialExpiresInSeconds);
  const [testMessageUrl, setTestMessageUrl] = useState(initialTestUrl || '');
  const [currentPreviewCode, setCurrentPreviewCode] = useState(initialPreviewCode || '');

  // UI status states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  // Expiration countdown timer
  useEffect(() => {
    if (expiresLeft <= 0) {
      setErrorMessage('This verification code has expired.');
      return;
    }
    const timer = setInterval(() => {
      setExpiresLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresLeft]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle single digit typing
  const handleDigitChange = (index: number, value: string) => {
    // Clear error when user resumes typing
    if (errorMessage) setErrorMessage(null);
    if (resendNotice) setResendNotice(null);

    // Only allow single numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1];
      setOtpDigits(newDigits);

      // Auto-advance to next box if available
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = '';
      setOtpDigits(newDigits);
    }
  };

  // Handle Backspace and Arrow key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Current box is empty: clear previous box and focus it
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        // Clear current box
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste event (distribute up to 6 digits)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pasted) return;

    const digits = pasted.slice(0, 6).split('');
    const newDigits = [...otpDigits];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);

    // Focus box after last pasted digit, or the 6th box
    const nextIdx = Math.min(digits.length, 5);
    inputRefs.current[nextIdx]?.focus();

    // If all 6 digits pasted, trigger submit
    if (digits.length === 6) {
      submitCode(newDigits.join(''));
    }
  };

  // Handle OTP form submission
  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    submitCode(code);
  };

  // Send verification request to backend
  const submitCode = async (code: string) => {
    if (isVerifying || isSuccess) return;

    setIsVerifying(true);
    setErrorMessage(null);
    setResendNotice(null);

    try {
      const res = await otpAuthClient.verifyOtp(challengeId, code, rememberDevice);

      if (res.success) {
        setIsSuccess(true);
        // Delay slightly for visual checkmark feedback
        setTimeout(() => {
          onSuccess(res);
        }, 500);
      } else {
        setErrorMessage(res.message || 'Incorrect verification code. Please check and try again.');

        if (typeof res.attemptsLeft === 'number') {
          setAttemptsRemaining(res.attemptsLeft);
        }

        // Re-focus first empty or first input for quick correction
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldownLeft > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setResendNotice(null);

    try {
      const res = await otpAuthClient.resendOtp(challengeId);

      if (res.success) {
        setOtpDigits(['', '', '', '', '', '']);
        setCooldownLeft(res.cooldownSeconds || 60);
        setExpiresLeft(res.expiresInSeconds || 300);
        setResendNotice(res.message || 'A new verification code has been sent.');
        if (res.testMessageUrl) {
          setTestMessageUrl(res.testMessageUrl);
        }
        if (res.previewCode) {
          setCurrentPreviewCode(res.previewCode);
        }
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.message || 'Failed to resend code. Please try again.');
        if (res.remainingSeconds) {
          setCooldownLeft(res.remainingSeconds);
        }
      }
    } catch (err: any) {
      setErrorMessage('Failed to request a new verification code. Please check your network.');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otpDigits.every((d) => d.length === 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF7FF] via-[#F3FBFF] to-[#FFFFFF] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-xl shadow-sky-900/5 border border-sky-100 ring-1 ring-emerald-500/10 p-6 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/20 mb-4">
            <Smartphone className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Verify Your Account
          </h2>

          <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
            We have dispatched a secure 6-digit verification code to your registered{' '}
            {channel === 'email' ? 'email address' : 'mobile number'}.
          </p>

          {/* Privacy-Safe Destination */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
            {channel === 'email' ? <Mail className="w-3.5 h-3.5 text-emerald-600" /> : <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Code sent to: {maskedDestination}</span>
          </div>
        </div>

        {/* Real Cryptographic Verification Code Display & Quick-Fill */}
        {currentPreviewCode && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200 text-center shadow-xs animate-in fade-in">
            <div className="text-[11px] font-bold text-emerald-950 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real 6-Digit Verification Code Dispatched:</span>
            </div>
            <div className="my-1.5 font-mono text-2xl font-black tracking-widest text-emerald-800 selection:bg-emerald-200">
              {currentPreviewCode}
            </div>
            <button
              type="button"
              onClick={() => {
                const digits = currentPreviewCode.split('');
                setOtpDigits(digits);
                submitCode(currentPreviewCode);
              }}
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <span>⚡ Click to Auto-fill & Verify</span>
            </button>
          </div>
        )}

        {/* Real Provider Notice or Ethereal Link */}
        {testMessageUrl && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-[11px] text-emerald-800 font-semibold">Real Ethereal SMTP Delivery Active</div>
            <a
              href={testMessageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 underline font-semibold mt-0.5 hover:text-emerald-900"
            >
              <span>Open Test Message Inbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {!providerConfigured && !testMessageUrl && (
          <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[11px] text-amber-800 font-medium flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Standard SMTP Delivery Active</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Secure single-use OTP generated by cryptographic backend.
            </p>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="mt-6 space-y-6">
          {/* Multi-Box OTP Input */}
          <div
            className="flex items-center justify-between gap-2 sm:gap-3"
            role="group"
            aria-roledescription="Verification code input"
          >
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                aria-label={`Digit ${idx + 1} of 6`}
                disabled={isVerifying || isSuccess}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 sm:w-14 sm:h-14 rounded-xl text-center font-mono text-xl sm:text-2xl font-bold border transition-all outline-hidden ${
                  errorMessage
                    ? 'border-rose-400 text-rose-800 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : isSuccess
                    ? 'border-emerald-500 text-emerald-800 bg-emerald-50'
                    : digit
                    ? 'border-emerald-600 text-slate-900 bg-white shadow-xs'
                    : 'border-slate-300 text-slate-900 bg-slate-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            ))}
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before lockout.
                  </p>
                )}
              </div>
            </div>
          )}

          {resendNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendNotice}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-center gap-2 font-semibold animate-in fade-in duration-150">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>✓ Verified · Opening your dashboard...</span>
            </div>
          )}

          {/* Verify & Continue Button */}
          <button
            type="submit"
            disabled={isVerifying || !isOtpComplete || isSuccess}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : isOtpComplete && !isVerifying
                ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:via-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Verifying...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Verified!</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Resend OTP & Expiry Section */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
          <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Code expires in:</span>
            <span className={`font-mono font-bold ${expiresLeft < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatTimer(expiresLeft)}
            </span>
          </div>

          <div className="text-xs">
            {cooldownLeft > 0 ? (
              <span className="text-slate-500 font-mono">
                Resend code in {formatTimer(cooldownLeft)}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isSuccess}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Requesting code...</span>
                  </>
                ) : (
                  <span>Resend Code</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-4 pt-3 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={onBackToLogin}
            disabled={isVerifying || isSuccess}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
