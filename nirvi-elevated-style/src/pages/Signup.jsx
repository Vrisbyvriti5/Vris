import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,18}$/;

const getValidationErrors = (values) => {
  const errors = {
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
    errors.name = 'Please enter your full name.';
  }

  if (!normalizedEmail) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'Please enter a valid email format.';
  }

  if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!values.password) {
    errors.password = 'Please enter a password.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Confirm password must match.';
  }

  return errors;
};

const Signup = () => {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';
  const checkoutPayload = location.state?.checkoutPayload;
  const validationErrors = useMemo(() => getValidationErrors(formValues), [formValues]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setFormValues((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const touchField = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const shouldShowFieldError = (field) => (submitAttempted || touched[field]) && validationErrors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setSubmitAttempted(true);
    const hasValidationError = Object.values(validationErrors).some(Boolean);
    if (hasValidationError) {
      return;
    }

    setSubmitting(true);
    const result = await signup(
      formValues.name.trim(),
      formValues.email.trim(),
      formValues.password,
      formValues.phone.trim(),
    );
    setSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { state: checkoutPayload ? { checkoutPayload } : undefined, replace: true });
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[96px] md:pt-[104px] pb-20 w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex items-center justify-center min-h-[80vh]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">Join VRIS</p>
              <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Create Account</h1>
              <p className="mt-2 text-sm text-muted-foreground font-body">
                Start shopping handcrafted pieces with a faster checkout and order tracking.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="block text-sm font-semibold text-foreground">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formValues.name}
                  onChange={updateField('name')}
                  onBlur={touchField('name')}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
                />
                {shouldShowFieldError('name') ? <p className="text-xs text-destructive font-body">{validationErrors.name}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="block text-sm font-semibold text-foreground">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formValues.email}
                  onChange={updateField('email')}
                  onBlur={touchField('email')}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
                />
                {shouldShowFieldError('email') ? <p className="text-xs text-destructive font-body">{validationErrors.email}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-phone" className="block text-sm font-semibold text-foreground">Phone Number <span className="font-normal text-muted-foreground">(Optional)</span></label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="e.g. +91 96713 00024"
                  value={formValues.phone}
                  onChange={updateField('phone')}
                  onBlur={touchField('phone')}
                  disabled={submitting}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-50"
                />
                {shouldShowFieldError('phone') ? <p className="text-xs text-destructive font-body">{validationErrors.phone}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-sm font-semibold text-foreground">Password</label>
                <div className="flex items-center rounded-xl border border-border bg-background px-4 transition-colors focus-within:border-foreground">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter at least 8 characters"
                    value={formValues.password}
                    onChange={updateField('password')}
                    onBlur={touchField('password')}
                    required
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
                {shouldShowFieldError('password') ? <p className="text-xs text-destructive font-body">{validationErrors.password}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-foreground">Confirm Password</label>
                <div className="flex items-center rounded-xl border border-border bg-background px-4 transition-colors focus-within:border-foreground">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formValues.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    onBlur={touchField('confirmPassword')}
                    required
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
                {shouldShowFieldError('confirmPassword') ? <p className="text-xs text-destructive font-body">{validationErrors.confirmPassword}</p> : null}
              </div>

              <button
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-foreground py-3 text-xs font-bold tracking-widest uppercase text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
              >
                {submitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-destructive font-body">{error}</p> : null}

            <p className="text-center text-sm text-muted-foreground mt-6 font-body">
              Already have an account?{' '}
              <Link to="/login" state={{ redirectTo, checkoutPayload }} className="text-foreground hover:underline">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
