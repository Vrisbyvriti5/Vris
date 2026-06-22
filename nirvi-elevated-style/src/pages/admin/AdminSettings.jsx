import React, { useState } from 'react';
import { Palette, Plus, X } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import AdminSection from '@/components/admin/AdminSection';

const customizationGroups = [
  { key: 'colors', label: 'Colors', helper: 'Shades and finishes offered on custom VRIS products.' },
  { key: 'styles', label: 'Styles', helper: 'Design directions shoppers can choose from.' },
  { key: 'addOns', label: 'Add-ons', helper: 'Upsell options attached to custom orders.' },
];

const AdminSettings = () => {
  const { customizationOptions, addCustomizationOption, removeCustomizationOption, products } = useCatalog();
  const [drafts, setDrafts] = useState({
    colors: '',
    styles: '',
    addOns: '',
  });

  const customProductCount = products.filter((product) => {
    const options = product.customizationOptions || {};
    return (options.colors?.length || 0) + (options.styles?.length || 0) + (options.addOns?.length || 0) > 0;
  }).length;

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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Custom Products</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">{customProductCount} configured</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Products with customization options already attached.</p>
          </div>
          <div className="rounded-3xl border border-border bg-muted/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">API Readiness</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">Ready</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">Context-based state keeps backend integration straightforward later.</p>
          </div>
        </div>
      </AdminSection>

      <div className="grid gap-6 xl:grid-cols-3">
        {customizationGroups.map((group) => (
          <AdminSection
            key={group.key}
            title={group.label}
            description={group.helper}
            actions={(
              <div className="flex w-full gap-2 sm:w-auto">
                <input
                  type="text"
                  value={drafts[group.key]}
                  onChange={(event) => setDrafts((current) => ({ ...current, [group.key]: event.target.value }))}
                  placeholder={`Add ${group.label.toLowerCase().slice(0, -1) || group.label.toLowerCase()}`}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    addCustomizationOption(group.key, drafts[group.key]);
                    setDrafts((current) => ({ ...current, [group.key]: '' }));
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            )}
          >
            {(customizationOptions[group.key] || []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
                <Palette size={32} className="mx-auto text-muted-foreground" />
                <p className="mt-4 text-base font-semibold text-foreground">No options yet</p>
                <p className="mt-2 text-sm text-muted-foreground font-body">Add your first {group.label.toLowerCase()} option to use it across products.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {customizationOptions[group.key].map((option) => (
                  <div key={option} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/70 px-4 py-2">
                    <span className="text-sm font-medium text-foreground">{option}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomizationOption(group.key, option)}
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      aria-label={`Remove ${option}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
