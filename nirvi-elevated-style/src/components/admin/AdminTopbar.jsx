import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, Plus, Store } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

const getPageTitle = (pathname) => {
  if (pathname === '/admin') {
    return 'Dashboard';
  }
  if (pathname === '/admin/products') {
    return 'Products';
  }
  if (pathname === '/admin/products/new') {
    return 'Add Product';
  }
  if (pathname.includes('/admin/products/') && pathname.endsWith('/edit')) {
    return 'Edit Product';
  }
  if (pathname === '/admin/orders') {
    return 'Orders';
  }
  if (pathname === '/admin/users') {
    return 'Users';
  }
  if (pathname === '/admin/settings') {
    return 'Settings';
  }
  return 'Admin';
};

const AdminTopbar = ({ onMenuClick }) => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-2xl border border-border p-2.5 text-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">VRIS Control Center</p>
            <h1 className="font-display text-2xl font-bold text-foreground">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Store size={16} />
              View Store
            </Link>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <Plus size={16} />
              Add Product
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
              <span className="text-sm font-bold">{admin?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{admin?.name}</p>
              <p className="truncate text-xs text-muted-foreground font-body">{admin?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
