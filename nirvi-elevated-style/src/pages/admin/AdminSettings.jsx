import React, { useState } from 'react';
import { Palette, Plus, X } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import AdminSection from '@/components/admin/AdminSection';


const AdminSettings = () => {
  const { products } = useCatalog();

  return (
    <div className="space-y-6">
      <AdminSection title="Admin Settings" description="Store-level controls and customization tools for bespoke VRIS products.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-muted/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Storefront Sync</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">{products.length} live products</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Catalog changes here are shared with the storefront instantly.</p>
          </div>
          <div className="rounded-3xl border border-border bg-muted/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">General Settings</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">Standard</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Global store settings can be configured here.</p>
          </div>
          <div className="rounded-3xl border border-border bg-muted/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">API Readiness</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">Ready</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Context-based state keeps backend integration straightforward later.</p>
          </div>
        </div>
      </AdminSection>
    </div>
  );
};

export default AdminSettings;
