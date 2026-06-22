import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, PlusSquare, ShoppingCart, Users, Settings, MessageSquareText, X } from 'lucide-react';

const navigation = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/products/new', label: 'Add Product', icon: PlusSquare },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/user-requests', label: 'User Requests', icon: MessageSquareText },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminSidebar = ({ open, onClose }) => (
  <>
    <div
      className={`fixed inset-0 z-40 bg-black/35 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={onClose}
    />
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:z-auto`}>
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <Link to="/admin" className="space-y-1" onClick={onClose}>
          <p className="font-display text-2xl font-bold tracking-[0.18em] text-foreground">VRIS</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Admin Panel</p>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Close admin navigation"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="rounded-3xl bg-muted/80 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Environment</p>
          <p className="mt-2 text-sm font-medium text-foreground">Connected to backend APIs</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-body">
            Catalog, orders, users, and user requests are fetched from the backend services.
          </p>
        </div>
      </div>
    </aside>
  </>
);

export default AdminSidebar;
