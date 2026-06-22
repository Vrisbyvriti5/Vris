import React from 'react';

const STATUS_STYLES = {
  Pending: 'bg-secondary text-foreground border-border',
  New: 'bg-secondary text-foreground border-border',
  'In Progress': 'bg-muted text-foreground border-border',
  Resolved: 'bg-foreground text-background border-foreground',
  Processing: 'bg-secondary/70 text-foreground border-border',
  Shipped: 'bg-muted text-foreground border-border',
  Delivered: 'bg-foreground text-background border-foreground',
  Cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  Active: 'bg-foreground text-background border-foreground',
  Invited: 'bg-muted text-foreground border-border',
  admin: 'bg-foreground text-background border-foreground',
  user: 'bg-muted text-foreground border-border',
  low: 'bg-destructive/10 text-destructive border-destructive/20',
  healthy: 'bg-muted text-foreground border-border',
};

const StatusPill = ({ value }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${STATUS_STYLES[value] || 'bg-muted text-foreground border-border'}`}>
    {value}
  </span>
);

export default StatusPill;
