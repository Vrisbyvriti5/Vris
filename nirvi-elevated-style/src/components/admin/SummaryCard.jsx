import React from 'react';

const SummaryCard = ({ icon: Icon, label, value, detail, trend }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
        <p className="mt-4 font-display text-3xl font-bold text-foreground">{value}</p>
        {detail ? <p className="mt-2 text-sm text-muted-foreground font-body">{detail}</p> : null}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
        <Icon size={20} />
      </div>
    </div>
    {trend ? (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-muted/70 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Trend</span>
        <span className="text-sm font-medium text-foreground font-body">{trend}</span>
      </div>
    ) : null}
  </div>
);

export default SummaryCard;
