import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminLogin = () => {
  const { isAuthenticated, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await login(formData);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const redirectPath = location.state?.from?.pathname || '/admin';
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-white px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden border-r border-border bg-foreground px-10 py-12 text-background lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-display text-4xl font-bold tracking-[0.22em]">VRIS</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-background/70 font-body">
              A focused control room for products, orders, users, and customization workflows.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <ShieldCheck size={28} className="text-background" />
              <h2 className="mt-4 font-display text-3xl font-bold">Admin Access</h2>
              <p className="mt-3 text-sm leading-relaxed text-background/70 font-body">
                This frontend demo persists access locally and is structured so real API auth can replace it later.
              </p>
            </div>
            <div className="grid gap-3">
              {['Manage the full catalog', 'Track order fulfillment', 'Review customer accounts', 'Configure custom product options'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-body text-background/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">VRIS Admin</p>
              <h1 className="font-display text-4xl font-bold text-foreground">Secure Login</h1>
              <p className="text-sm text-muted-foreground font-body">
                Sign in to review inventory, orders, users, and customization settings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">Admin Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, email: event.target.value }));
                    setError('');
                  }}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4">
                  <LockKeyhole size={18} className="text-muted-foreground" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) => {
                      setFormData((current) => ({ ...current, password: event.target.value }));
                      setError('');
                    }}
                    className="w-full bg-transparent py-3 text-sm text-foreground outline-none"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive font-body">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Login to Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
