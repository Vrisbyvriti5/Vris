import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Navbar from '@/components/Navbar';
import { AnimatePresence, motion } from 'framer-motion';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,18}$/;

const validateLoginFields = (values) => {
  const nextErrors = {
    email: '',
    password: '',
  };

  const normalizedEmail = String(values.email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    nextErrors.email = 'Please enter your email address.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    nextErrors.email = 'Please enter a valid email address.';
  }

  if (!String(values.password || '').trim()) {
    nextErrors.password = 'Please enter your password.';
  }

  return nextErrors;
};

const validateSignupFields = (values) => {
  const nextErrors = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const normalizedName = String(values.name || '').trim();
  const normalizedEmail = String(values.email || '').trim().toLowerCase();
  const normalizedPhone = String(values.phone || '').trim();

  if (!normalizedName) {
    nextErrors.name = 'Please enter your full name.';
  }

  if (!normalizedEmail) {
    nextErrors.email = 'Please enter your email address.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    nextErrors.email = 'Please enter a valid email address.';
  }

  if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
    nextErrors.phone = 'Please enter a valid mobile number.';
  }

  if (!values.password) {
    nextErrors.password = 'Please enter a password.';
  } else if (values.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = 'Please confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
};

const Login = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const startsInSignupMode = searchParams.get('mode') === 'signup';

  const [isLogin, setIsLogin] = useState(!startsInSignupMode);
  const [loginValues, setLoginValues] = useState({ email: '', password: '' });
  const [signupValues, setSignupValues] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [signupErrors, setSignupErrors] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [signupTouched, setSignupTouched] = useState({ name: false, email: false, phone: false, password: false, confirmPassword: false });
  const [authError, setAuthError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [oauthRedirecting, setOauthRedirecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || '/';
  const checkoutPayload = location.state?.checkoutPayload;
  const envOauthBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const rawOauthBase = (() => {
    if (!envOauthBase) {
      return '/api';
    }

    // Prevent mixed-content failures if a stale http:// base is configured in prod.
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && /^http:\/\//i.test(envOauthBase)) {
      return '/api';
    }

    return envOauthBase;
  })();
  const oauthBase = rawOauthBase.endsWith('/api') ? rawOauthBase : `${rawOauthBase}/api`;

  const handleGoogleOAuth = () => {
    if (oauthRedirecting) {
      return;
    }

    setOauthRedirecting(true);
    window.location.href = `${oauthBase}/auth/google`;
  };

  useEffect(() => {
    const currentMode = new URLSearchParams(location.search).get('mode');
    if (currentMode === 'signup') {
      setIsLogin(false);
    } else if (currentMode === 'login') {
      setIsLogin(true);
    }
  }, [location.search]);

  const switchMode = (nextModeIsLogin) => {
    setIsLogin(nextModeIsLogin);
    setAuthError('');
  };

  const validateLogin = (nextValues = loginValues) => {
    const nextErrors = validateLoginFields(nextValues);
    setLoginErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const validateSignup = (nextValues = signupValues) => {
    const nextErrors = validateSignupFields(nextValues);
    setSignupErrors(nextErrors);
    return !nextErrors.name && !nextErrors.email && !nextErrors.phone && !nextErrors.password && !nextErrors.confirmPassword;
  };

  const handleLoginChange = (field) => (event) => {
    const nextValue = event.target.value;
    const nextForm = { ...loginValues, [field]: nextValue };
    setLoginValues(nextForm);
    setAuthError('');

    if (loginTouched[field]) {
      validateLogin(nextForm);
    }
  };

  const handleSignupChange = (field) => (event) => {
    const nextValue = event.target.value;
    const nextForm = { ...signupValues, [field]: nextValue };
    setSignupValues(nextForm);
    setAuthError('');

    if (signupTouched[field]) {
      validateSignup(nextForm);
    }
  };

  const touchLoginField = (field) => () => {
    setLoginTouched((current) => ({ ...current, [field]: true }));
    validateLogin(loginValues);
  };

  const touchSignupField = (field) => () => {
    setSignupTouched((current) => ({ ...current, [field]: true }));
    validateSignup(signupValues);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    setLoginTouched({ email: true, password: true });
    if (!validateLogin(loginValues)) {
      return;
    }

    setSubmitting(true);
    const result = await login(loginValues.email.trim(), loginValues.password);
    setSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { state: checkoutPayload ? { checkoutPayload } : undefined, replace: true });
    } else {
      setAuthError(result.message || 'Login failed. Please try again.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    setSignupTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    if (!validateSignup(signupValues)) {
      return;
    }

    setSubmitting(true);
    const result = await signup(
      signupValues.name.trim(),
      signupValues.email.trim(),
      signupValues.password,
      signupValues.phone.trim(),
    );
    setSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { state: checkoutPayload ? { checkoutPayload } : undefined, replace: true });
    } else {
      setAuthError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex min-h-[84vh] w-full items-center justify-center px-4 pb-16 pt-[96px] md:pt-[104px] sm:px-8 lg:px-14 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white shadow-lg"
        >
          <div className="grid md:grid-cols-[0.92fr_1.18fr]">
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#48c7b2] via-[#3fb9b1] to-[#37a7c1] px-6 py-8 text-white sm:px-8 md:flex md:min-h-[640px]">
              <div className="absolute left-[-58px] top-[72%] h-44 w-44 rounded-full bg-white/15" />
              <div className="absolute right-[-28px] top-[-28px] h-28 w-28 rounded-full bg-white/20" />
              <div className="absolute right-9 top-20 h-6 w-6 rotate-45 rounded-sm bg-white/12" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="inline-flex max-w-fit items-center rounded-xl bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <img
                    src="/Navbar_logo.png"
                    alt="VRIS"
                    className="h-16 w-auto object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                <motion.div
                  key={isLogin ? 'login-copy' : 'signup-copy'}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.38, ease: 'easeOut' } }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.3, ease: 'easeIn' } }}
                  className="my-auto"
                >
                  <h2 className="font-display text-4xl font-bold leading-tight text-white">
                    {isLogin ? 'Welcome Back!' : 'Create Account'}
                  </h2>
                  <p className="mt-4 max-w-[19rem] text-base leading-relaxed text-white/90 font-body">
                    {isLogin
                      ? 'To keep connected with us, please login with your personal information.'
                      : 'Join VRIS to save favorites, track orders, and checkout faster.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode(!isLogin)}
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-white/80 px-10 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#3fb9b1]"
                  >
                    {isLogin ? 'SIGN UP' : 'LOGIN'}
                  </button>
                </motion.div>
              </div>
            </aside>

            <section className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
              <div className="mx-auto w-full max-w-md">
                <h1 className="text-center font-display text-4xl font-bold text-[#39b9b5]">
                  {isLogin ? 'Login' : 'Create Account'}
                </h1>
                <p className="mt-3 text-center text-sm text-[#9ca3af] font-body">
                  {isLogin ? 'Access your VRIS account.' : 'Sign up and start your premium shopping experience.'}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[#f4f5f7] p-1">
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className={[
                      'rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300',
                      isLogin ? 'bg-white text-[#e0b090] shadow-sm' : 'text-[#7b7b85] hover:text-[#e0b090]',
                    ].join(' ')}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className={[
                      'rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300',
                      !isLogin ? 'bg-white text-[#e0b090] shadow-sm' : 'text-[#7b7b85] hover:text-[#e0b090]',
                    ].join(' ')}
                  >
                    Sign Up
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {isLogin ? (
                    <motion.form
                      key="login-form"
                      onSubmit={handleLoginSubmit}
                      noValidate
                      initial={{ opacity: 0, x: -24, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
                      exit={{ opacity: 0, x: 24, scale: 0.98, transition: { duration: 0.32, ease: 'easeIn' } }}
                      className="mt-8 space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="login-email" className="sr-only">Email</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Mail size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="login-email"
                            type="email"
                            placeholder="Email"
                            value={loginValues.email}
                            onChange={handleLoginChange('email')}
                            onBlur={touchLoginField('email')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="email"
                          />
                        </div>
                        {loginTouched.email && loginErrors.email ? <p className="text-xs text-[#ef4444] font-body">{loginErrors.email}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="login-password" className="sr-only">Password</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Lock size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="login-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={loginValues.password}
                            onChange={handleLoginChange('password')}
                            onBlur={touchLoginField('password')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((current) => !current)}
                            className="text-[#9ca3af] transition-colors hover:text-[#e0b090]"
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          >
                            {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        {loginTouched.password && loginErrors.password ? <p className="text-xs text-[#ef4444] font-body">{loginErrors.password}</p> : null}
                      </div>

                      <div className="text-right">
                        <Link
                          to="/forgot-password"
                          state={{ email: loginValues.email }}
                          className="text-xs font-semibold uppercase tracking-[0.13em] text-[#7b7b85] transition-colors hover:text-[#e0b090]"
                        >
                          Forgot Password?
                        </Link>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={submitting || oauthRedirecting}
                        whileHover={submitting || oauthRedirecting ? undefined : { scale: 1.01 }}
                        whileTap={submitting || oauthRedirecting ? undefined : { scale: 0.99 }}
                        className="w-full rounded-xl bg-[#e0b090] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-[#d6a382] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'LOGGING IN...' : 'LOGIN'}
                      </motion.button>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-px flex-1 bg-gray-200" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a1aa]">OR continue with</p>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleGoogleOAuth}
                        disabled={submitting || oauthRedirecting}
                        whileHover={submitting || oauthRedirecting ? undefined : { scale: 1.01 }}
                        whileTap={submitting || oauthRedirecting ? undefined : { scale: 0.99 }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-[#27272a] shadow-sm transition-all hover:border-[#ffccd9] hover:bg-[#fff4f8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.9 2.5 14.7 1.6 12 1.6 6.9 1.6 2.8 5.9 2.8 11s4.1 9.4 9.2 9.4c5.3 0 8.9-3.8 8.9-9.1 0-.6-.1-1-.1-1.1H12z" />
                          <path fill="#34A853" d="M3.9 7.3l3.2 2.3C7.9 7.9 9.8 6.5 12 6.5c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.9 2.5 14.7 1.6 12 1.6 8 1.6 4.6 3.9 3 7.3z" />
                          <path fill="#FBBC05" d="M12 20.4c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1.1-3.4 1.1-3.9 0-5.2-2.6-5.4-3.8l-3.2 2.5c1.6 3.5 5 5 8.6 5z" />
                          <path fill="#4285F4" d="M21 11c0-.6-.1-1-.1-1.1H12v3.9h5.5c-.3 1.4-1.2 2.6-2.1 3.2l3 2.4C20.2 17.7 21 14.8 21 11z" />
                        </svg>
                        {oauthRedirecting ? 'Redirecting...' : 'Continue with Google'}
                      </motion.button>

                      <p className="pt-1 text-center text-sm text-[#71717a] font-body">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode(false)}
                          className="font-semibold text-[#e0b090] transition-colors hover:text-[#d6a382]"
                        >
                          Sign Up
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup-form"
                      onSubmit={handleSignupSubmit}
                      noValidate
                      initial={{ opacity: 0, x: 24, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
                      exit={{ opacity: 0, x: -24, scale: 0.98, transition: { duration: 0.32, ease: 'easeIn' } }}
                      className="mt-8 space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="signup-name" className="sr-only">Full Name</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <UserRound size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="signup-name"
                            type="text"
                            placeholder="Full Name"
                            value={signupValues.name}
                            onChange={handleSignupChange('name')}
                            onBlur={touchSignupField('name')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="name"
                          />
                        </div>
                        {signupTouched.name && signupErrors.name ? <p className="text-xs text-[#ef4444] font-body">{signupErrors.name}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-email" className="sr-only">Email</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Mail size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="signup-email"
                            type="email"
                            placeholder="Email"
                            value={signupValues.email}
                            onChange={handleSignupChange('email')}
                            onBlur={touchSignupField('email')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="email"
                          />
                        </div>
                        {signupTouched.email && signupErrors.email ? <p className="text-xs text-[#ef4444] font-body">{signupErrors.email}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-phone" className="sr-only">Mobile Number (Optional)</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Phone size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="signup-phone"
                            type="tel"
                            placeholder="Mobile Number (Optional)"
                            value={signupValues.phone}
                            onChange={handleSignupChange('phone')}
                            onBlur={touchSignupField('phone')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="tel"
                          />
                        </div>
                        {signupTouched.phone && signupErrors.phone ? <p className="text-xs text-[#ef4444] font-body">{signupErrors.phone}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-password" className="sr-only">Password</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Lock size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="signup-password"
                            type={showSignupPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={signupValues.password}
                            onChange={handleSignupChange('password')}
                            onBlur={touchSignupField('password')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword((current) => !current)}
                            className="text-[#9ca3af] transition-colors hover:text-[#e0b090]"
                            aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSignupPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        {signupTouched.password && signupErrors.password ? <p className="text-xs text-[#ef4444] font-body">{signupErrors.password}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-confirm-password" className="sr-only">Confirm Password</label>
                        <div className="flex items-center rounded-lg border border-gray-300 bg-[#f9fafb] px-3 transition-colors focus-within:border-[#e0b090] focus-within:ring-2 focus-within:ring-[#ebd1c1]">
                          <Lock size={16} className="text-[#a1a1aa]" aria-hidden="true" />
                          <input
                            id="signup-confirm-password"
                            type={showSignupConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            value={signupValues.confirmPassword}
                            onChange={handleSignupChange('confirmPassword')}
                            onBlur={touchSignupField('confirmPassword')}
                            disabled={submitting}
                            className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-[#a3a3a3] disabled:opacity-60"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupConfirmPassword((current) => !current)}
                            className="text-[#9ca3af] transition-colors hover:text-[#e0b090]"
                            aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {showSignupConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        {signupTouched.confirmPassword && signupErrors.confirmPassword ? <p className="text-xs text-[#ef4444] font-body">{signupErrors.confirmPassword}</p> : null}
                      </div>

                      <motion.button
                        type="submit"
                        disabled={submitting || oauthRedirecting}
                        whileHover={submitting || oauthRedirecting ? undefined : { scale: 1.01 }}
                        whileTap={submitting || oauthRedirecting ? undefined : { scale: 0.99 }}
                        className="w-full rounded-xl bg-[#e0b090] px-4 py-3 text-sm font-extrabold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-[#d6a382] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                      </motion.button>

                      <p className="pt-1 text-center text-sm text-[#71717a] font-body">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode(true)}
                          className="font-semibold text-[#e0b090] transition-colors hover:text-[#d6a382]"
                        >
                          Login
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>

                {authError ? <p className="mt-4 text-sm text-[#ef4444] font-body">{authError}</p> : null}

                {isAdminAuthenticated && (
                  <div className="mt-5 rounded-2xl border border-[#ffd6e1] bg-[#fff2f6] px-4 py-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e0b090]">Admin Access</p>
                    <p className="mt-2 text-sm text-[#71717a] font-body">Your admin session is active.</p>
                    <Link
                      to="/admin"
                      className="mt-3 inline-flex items-center justify-center rounded-full border border-[#e0b090] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e0b090] transition-colors hover:bg-[#e0b090] hover:text-white"
                    >
                      Go to Admin Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
