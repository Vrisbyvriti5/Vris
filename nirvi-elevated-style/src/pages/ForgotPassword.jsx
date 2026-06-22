import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { authAPI } from '@/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = [
  { key: 'email', label: 'Email' },
  { key: 'otp', label: 'OTP' },
  { key: 'password', label: 'Reset' },
];

const stepCardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

const ForgotPassword = () => {
  const location = useLocation();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(String(location.state?.email || ''));
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);

  const currentStepIndex = completed ? 3 : STEPS.findIndex((item) => item.key === step) + 1;

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError('');
    setMessage('');
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.sendOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setStep('otp');
      setResendCooldown(30);
      setMessage('OTP sent. Please check your inbox.');
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError('');
    setMessage('');
    const normalizedOtp = String(otp || '').trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.verifyOtp(email, normalizedOtp);
      setStep('password');
      setMessage('OTP verified. Set your new password.');
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to verify OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError('');
    setMessage('');

    if (!password || !confirmPassword) {
      setError('Please fill both password fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Confirm password must match.');
      return;
    }

    setSubmitting(true);
    try {
      await authAPI.resetPassword(email, password, confirmPassword);
      setCompleted(true);
      setMessage('Password reset successful. You can now login with your new password.');
      setOtp('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex items-center justify-center min-h-[80vh]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">Account Recovery</p>
              <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Forgot Password</h1>
              <p className="mt-2 text-sm text-muted-foreground font-body">
                Complete the steps below to securely reset your password.
              </p>
            </div>

            <div className="mb-7 grid grid-cols-3 gap-2">
              {STEPS.map((item, index) => {
                const stepNumber = index + 1;
                const isPassed = currentStepIndex > stepNumber;
                const isActive = currentStepIndex === stepNumber;

                return (
                  <div key={item.key} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        isPassed || isActive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      {stepNumber}
                    </span>
                    <span className={isActive ? 'text-xs font-bold uppercase tracking-wide text-foreground' : 'text-xs font-bold uppercase tracking-wide text-muted-foreground'}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div key="success" {...stepCardMotion} className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-700" />
                      <p className="text-sm font-semibold text-emerald-900">Password Updated</p>
                    </div>
                    <p className="mt-2 text-sm text-emerald-800 font-body">
                      Your password has been reset successfully.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-foreground py-3 text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/90"
                  >
                    Back to Login
                  </Link>
                </motion.div>
              ) : null}

              {!completed && step === 'email' ? (
                <motion.form key="email" {...stepCardMotion} onSubmit={handleSendOtp} className="space-y-4" noValidate>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Email Address</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError('');
                        setMessage('');
                      }}
                      disabled={submitting}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-foreground py-3 text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {submitting ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </motion.form>
              ) : null}

              {!completed && step === 'otp' ? (
                <motion.form key="otp" {...stepCardMotion} onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Enter OTP</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value);
                        setError('');
                        setMessage('');
                      }}
                      disabled={submitting}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm tracking-[0.22em] text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-foreground py-3 text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {submitting ? 'Verifying OTP...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting || resendCooldown > 0}
                    className="w-full rounded-xl border border-border py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError('');
                      setMessage('');
                    }}
                    className="w-full text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Change Email
                  </button>
                </motion.form>
              ) : null}

              {!completed && step === 'password' ? (
                <motion.form key="password" {...stepCardMotion} onSubmit={handleResetPassword} className="space-y-4" noValidate>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">New Password</span>
                    <div className="flex items-center rounded-xl border border-border bg-background px-4 transition-colors focus-within:border-foreground">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError('');
                          setMessage('');
                        }}
                        disabled={submitting}
                        className="w-full bg-transparent py-3 text-sm text-foreground outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="ml-3 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Confirm Password</span>
                    <div className="flex items-center rounded-xl border border-border bg-background px-4 transition-colors focus-within:border-foreground">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setError('');
                          setMessage('');
                        }}
                        disabled={submitting}
                        className="w-full bg-transparent py-3 text-sm text-foreground outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="ml-3 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-foreground py-3 text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {submitting ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </motion.form>
              ) : null}
            </AnimatePresence>

            {error ? <p className="mt-4 text-sm text-destructive font-body">{error}</p> : null}
            {!error && message ? <p className="mt-4 text-sm text-foreground font-body">{message}</p> : null}

            {!completed ? (
              <p className="mt-6 text-center text-sm text-muted-foreground font-body">
                Remember your password?{' '}
                <Link to="/login" className="text-foreground hover:underline">Login</Link>
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
