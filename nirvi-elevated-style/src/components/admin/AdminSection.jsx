import React from 'react';

const AdminSection = ({ title, description, actions, children, className = '' }) => (
  <section className={`rounded-3xl border border-border bg-card shadow-sm ${className}`}>
    {(title || description || actions) && (
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="space-y-1">
          {title && <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>}
          {description && <p className="max-w-2xl text-sm text-muted-foreground font-body">{description}</p>}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    )}
    <div className="px-5 py-5 sm:px-6">{children}</div>
  </section>
);

export default AdminSection;
