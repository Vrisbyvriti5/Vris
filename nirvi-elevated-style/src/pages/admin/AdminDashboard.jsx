import React, { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Package, ShoppingCart, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCatalog } from '@/context/CatalogContext';
import { useAdminData } from '@/context/AdminDataContext';
import SummaryCard from '@/components/admin/SummaryCard';
import AdminSection from '@/components/admin/AdminSection';
import StatusPill from '@/components/admin/StatusPill';
import { formatCurrency, formatDate } from '@/lib/admin-formatters';

const statusColors = ['#111111', '#3b3b3b', '#646464', '#8d8d8d', '#b5b5b5', '#d3d3d3'];
const AUTO_REFRESH_INTERVAL_MS = 45 * 1000;

const dayLabelFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

const syncTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const parseValidDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value) => {
  const date = parseValidDate(value);
  if (!date) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfWeek = (value) => {
  const date = startOfDay(value);
  if (!date) {
    return null;
  }

  // Monday as first day of week
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const buildDailyOrderTrend = (orders, days = 7) => {
  const today = startOfDay(new Date());
  if (!today) {
    return [];
  }

  const buckets = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const bucketDate = new Date(today);
    bucketDate.setDate(today.getDate() - index);

    buckets.push({
      timestamp: bucketDate.getTime(),
      label: dayLabelFormatter.format(bucketDate),
      orders: 0,
      revenue: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.timestamp, bucket]));

  orders.forEach((order) => {
    const bucketDate = startOfDay(order.createdAt);
    if (!bucketDate) {
      return;
    }

    const target = bucketMap.get(bucketDate.getTime());
    if (!target) {
      return;
    }

    target.orders += 1;
    target.revenue += Number(order.totalPrice || 0);
  });

  return buckets.map(({ timestamp, ...rest }) => rest);
};

const buildWeeklyOrderTrend = (orders, weeks = 8) => {
  const currentWeekStart = startOfWeek(new Date());
  if (!currentWeekStart) {
    return [];
  }

  const buckets = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekStartDate = new Date(currentWeekStart);
    weekStartDate.setDate(currentWeekStart.getDate() - (index * 7));

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    buckets.push({
      timestamp: weekStartDate.getTime(),
      label: dayLabelFormatter.format(weekStartDate),
      range: `${dayLabelFormatter.format(weekStartDate)} - ${dayLabelFormatter.format(weekEndDate)}`,
      orders: 0,
      revenue: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.timestamp, bucket]));

  orders.forEach((order) => {
    const weekBucket = startOfWeek(order.createdAt);
    if (!weekBucket) {
      return;
    }

    const target = bucketMap.get(weekBucket.getTime());
    if (!target) {
      return;
    }

    target.orders += 1;
    target.revenue += Number(order.totalPrice || 0);
  });

  return buckets.map(({ timestamp, ...rest }) => rest);
};

const buildCategoryDistribution = (products) => {
  const categoryMap = products.reduce((map, product) => {
    const category = String(product.category || '').trim() || 'Uncategorized';
    map.set(category, (map.get(category) || 0) + 1);
    return map;
  }, new Map());

  const sorted = [...categoryMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((first, second) => second.value - first.value);

  if (sorted.length <= 5) {
    return sorted;
  }

  const topCategories = sorted.slice(0, 5);
  const otherTotal = sorted.slice(5).reduce((sum, entry) => sum + entry.value, 0);

  return otherTotal > 0
    ? [...topCategories, { name: 'Other', value: otherTotal }]
    : topCategories;
};

const LoadingChartState = () => (
  <div className="h-[290px] animate-pulse rounded-2xl bg-muted/60" />
);

const EmptyChartState = ({ message }) => (
  <div className="flex h-[290px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-5 text-center">
    <p className="text-sm text-muted-foreground font-body">{message}</p>
  </div>
);

const AdminDashboard = () => {
  const { products, loading: productsLoading, error: productsError, refreshProducts } = useCatalog();
  const {
    users,
    orders,
    loading: adminLoading,
    error: adminError,
    refreshAll,
    lastUpdatedAt,
  } = useAdminData();

  const [trendMode, setTrendMode] = useState('daily');

  useEffect(() => {
    refreshProducts();

    const handleFocus = () => {
      refreshAll();
      refreshProducts();
    };

    const intervalId = window.setInterval(() => {
      refreshProducts();
    }, AUTO_REFRESH_INTERVAL_MS);

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAll, refreshProducts]);

  const isInitialLoading = (
    (adminLoading && users.length === 0 && orders.length === 0)
    || (productsLoading && products.length === 0)
  );
  const dashboardError = adminError || productsError;

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    [orders],
  );

  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === 'Delivered').length,
    [orders],
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === 'Pending').length,
    [orders],
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= 10).slice(0, 5),
    [products],
  );

  const recentOrders = useMemo(
    () => [...orders]
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      .slice(0, 5),
    [orders],
  );

  const trendData = useMemo(
    () => (trendMode === 'weekly' ? buildWeeklyOrderTrend(orders, 8) : buildDailyOrderTrend(orders, 7)),
    [orders, trendMode],
  );

  const hasOrderTrendData = trendData.some((entry) => entry.orders > 0);
  const hasRevenueTrendData = trendData.some((entry) => entry.revenue > 0);

  const categoryDistribution = useMemo(
    () => buildCategoryDistribution(products),
    [products],
  );

  const adminUserCount = useMemo(
    () => users.filter((user) => user.role === 'admin').length,
    [users],
  );

  const lastSyncedLabel = lastUpdatedAt
    ? syncTimeFormatter.format(new Date(lastUpdatedAt))
    : 'Sync pending';

  return (
    <div className="space-y-6">
      {dashboardError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-body">
          {dashboardError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Package}
          label="Total Products"
          value={isInitialLoading ? '...' : products.length}
          detail="Live catalog entries"
          trend={`${lowStockProducts.length} low stock`}
        />
        <SummaryCard
          icon={Users}
          label="Total Users"
          value={isInitialLoading ? '...' : users.length}
          detail="Registered accounts"
          trend={`${adminUserCount} admins`}
        />
        <SummaryCard
          icon={ShoppingCart}
          label="Total Orders"
          value={isInitialLoading ? '...' : orders.length}
          detail="Live orders from backend"
          trend={`${pendingOrders} awaiting action`}
        />
        <SummaryCard
          icon={IndianRupee}
          label="Revenue"
          value={isInitialLoading ? '...' : formatCurrency(totalRevenue)}
          detail="Live revenue from backend orders"
          trend={`${deliveredOrders} delivered orders`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection
          title="Orders Over Time"
          description="Order volume from live backend data (daily or weekly)."
          actions={(
            <div className="inline-flex rounded-2xl border border-border p-1">
              <button
                type="button"
                onClick={() => setTrendMode('daily')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${trendMode === 'daily' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTrendMode('weekly')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${trendMode === 'weekly' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Weekly
              </button>
            </div>
          )}
        >
          {isInitialLoading ? <LoadingChartState /> : null}

          {!isInitialLoading && !hasOrderTrendData ? (
            <EmptyChartState message="No order activity is available for the selected range yet." />
          ) : null}

          {!isInitialLoading && hasOrderTrendData ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(17,17,17,0.04)' }}
                    formatter={(value) => `${Number(value || 0)} orders`}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.range || _label}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                    }}
                  />
                  <Bar dataKey="orders" fill="#111111" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminSection>

        <AdminSection title="Revenue Over Time" description="Revenue computed from live order totals.">
          {isInitialLoading ? <LoadingChartState /> : null}

          {!isInitialLoading && !hasRevenueTrendData ? (
            <EmptyChartState message="No revenue data is available for the selected range yet." />
          ) : null}

          {!isInitialLoading && hasRevenueTrendData ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="vrisRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `Rs. ${compactCurrencyFormatter.format(Number(value || 0))}`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value || 0))}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.range || _label}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#111111" fill="url(#vrisRevenueFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </AdminSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Product Category Distribution" description="Category mix based on products from the live catalog API.">
          {isInitialLoading ? <LoadingChartState /> : null}

          {!isInitialLoading && categoryDistribution.length === 0 ? (
            <EmptyChartState message="No products found. Add products to see category distribution." />
          ) : null}

          {!isInitialLoading && categoryDistribution.length > 0 ? (
            <>
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${Number(value || 0)} products`}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {categoryDistribution.map((entry, index) => (
                  <div key={entry.name} className="rounded-2xl border border-border bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[index % statusColors.length] }} />
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{entry.name}</p>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-foreground">{entry.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </AdminSection>

        <AdminSection title="Low Stock Watch" description="Products that need replenishment soon.">
          {isInitialLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : null}

          {!isInitialLoading && lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Everything looks healthy right now.</p>
          ) : null}

          {!isInitialLoading && lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-border bg-muted/50 px-4 py-4">
                  <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-body">{product.category}</p>
                  </div>
                  <StatusPill value="low" />
                  <p className="text-sm font-semibold text-foreground">{product.stock} left</p>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSection>

        <AdminSection title="Recent Orders" description={`Newest backend orders. Last synced: ${lastSyncedLabel}`}>
          {isInitialLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : null}

          {!isInitialLoading && recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No orders found yet.</p>
          ) : null}

          {!isInitialLoading && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border bg-muted/50 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground font-body">
                        {order.userName} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <StatusPill value={order.status} />
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground font-body">
                      {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(order.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </AdminSection>
      </div>
    </div>
  );
};

export default AdminDashboard;
