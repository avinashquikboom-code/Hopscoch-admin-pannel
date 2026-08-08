'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/purity */

import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/currency-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import api, { API_BASE, getImageUrl } from '@/lib/api';

function resolveImageUrl(url?: string): string {
  return getImageUrl(url);
}
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  Clock, 
  XCircle, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CATEGORY_COLORS = ['#14b8a6', '#0d9488', '#99f6e4', '#2dd4bf', '#0f766e'];

function SkeletonCard() {
  return (
    <Card className="border-border/30 rounded-lg bg-card">
      <CardContent className="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-7 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [dashData, setDashData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, report] = await Promise.allSettled([
        api.dashboard.getStats(),
        api.reports.getDashboard(),
      ]);

      const errorMsgs: string[] = [];

      if (dash.status === 'fulfilled') {
        const dashValue = (dash as any).value?.data ?? (dash as any).value ?? (dash as any).value?.stats ?? {};
        setDashData(dashValue);
      } else {
        errorMsgs.push(`Stats: ${dash.reason?.message || dash.reason}`);
      }

      if (report.status === 'fulfilled') {
        const reportValue = (report as any).value?.data ?? (report as any).value ?? (report as any).value?.metrics ?? {};
        setReportData(reportValue);
      } else {
        errorMsgs.push(`Reports: ${report.reason?.message || report.reason}`);
      }

      if (errorMsgs.length > 0) {
        setError(errorMsgs.join(' | '));
      }

      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const primaryStats = [
    {
      title: 'Total Revenue',
      value: dashData?.totalRevenue != null
        ? `₹${Number(dashData.totalRevenue).toLocaleString('en-IN')}`
        : '—',
      change: dashData?.revenueGrowth != null
        ? `${dashData.revenueGrowth > 0 ? '+' : ''}${dashData.revenueGrowth}%`
        : null,
      trend: (dashData?.revenueGrowth ?? 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      bgColor: 'bg-[#14b8a6]/10',
      color: 'text-[#14b8a6]',
    },
    {
      title: 'Total Orders',
      value: dashData?.totalOrders?.toLocaleString() ?? '—',
      change: dashData?.ordersGrowth != null
        ? `${dashData.ordersGrowth > 0 ? '+' : ''}${dashData.ordersGrowth}%`
        : null,
      trend: (dashData?.ordersGrowth ?? 0) >= 0 ? 'up' : 'down',
      icon: ShoppingBag,
      bgColor: 'bg-[#14b8a6]/10',
      color: 'text-[#14b8a6]',
    },
    {
      title: 'Total Customers',
      value: dashData?.totalCustomers?.toLocaleString() ?? '—',
      change: dashData?.customersGrowth != null
        ? `${dashData.customersGrowth > 0 ? '+' : ''}${dashData.customersGrowth}%`
        : null,
      trend: (dashData?.customersGrowth ?? 0) >= 0 ? 'up' : 'down',
      icon: Users,
      bgColor: 'bg-[#14b8a6]/10',
      color: 'text-[#14b8a6]',
    },
    {
      title: 'Total Products',
      value: dashData?.totalProducts?.toLocaleString() ?? '—',
      change: dashData?.productsGrowth != null
        ? `${dashData.productsGrowth > 0 ? '+' : ''}${dashData.productsGrowth}%`
        : null,
      trend: (dashData?.productsGrowth ?? 0) >= 0 ? 'up' : 'down',
      icon: Package,
      bgColor: 'bg-[#14b8a6]/10',
      color: 'text-[#14b8a6]',
    },
  ];

  const orderStats = [
    {
      title: 'Pending Orders',
      value: dashData?.pendingOrders?.toLocaleString() ?? '—',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Delivered Orders',
      value: dashData?.deliveredOrders?.toLocaleString() ?? '—',
      icon: CheckCircle,
      color: 'text-[#14b8a6]',
      bgColor: 'bg-[#14b8a6]/10',
    },
    {
      title: 'Cancelled Orders',
      value: dashData?.cancelledOrders?.toLocaleString() ?? '—',
      icon: XCircle,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'Low Stock Items',
      value: dashData?.lowStockCount?.toLocaleString() ?? '—',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const salesData: any[] = dashData?.monthlySales ?? reportData?.monthlySales ?? [];
  
  const categoryData: any[] = (dashData?.categoryBreakdown ?? reportData?.categoryBreakdown ?? [])
    .map((c: any, i: number) => ({
      name: c.name || c.category,
      value: c.value || c.count || c.sales,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const topProducts: any[] = dashData?.topProducts ?? reportData?.topProducts ?? [];
  const recentOrders: any[] = dashData?.recentOrders ?? [];

  const totalCategorySales = categoryData.reduce((s, c) => s + (c.value || 0), 0);

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': case 'completed': return 'bg-[#14b8a6]/10 text-[#14b8a6]';
      case 'processing': case 'confirmed': return 'bg-cyan-500/10 text-cyan-600';
      case 'pending': return 'bg-amber-500/10 text-amber-600';
      case 'cancelled': case 'returned': return 'bg-rose-500/10 text-rose-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const { fmt: formatCurrency } = useCurrency();

  const formatDate = (d: string) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* Welcome Header */}
        <PageHeader
          showClock={true}
          badgeText="Live Platform Command Center"
          titlePart1="Dashboard"
          titlePart2="Overview"
          subtitle="Real-time store metrics — orders, revenue, customers and inventory from the database."
          actions={
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchAll}
                disabled={loading}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/40 border border-border/20 px-3.5 py-1.5 rounded-full h-10 hover:bg-muted/60 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          }
        />

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm px-4 py-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {error} — showing partial data or empty state.
          </div>
        )}

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : primaryStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                      {stat.change && (
                        <div className="flex items-center mt-2 text-xs font-medium">
                          {stat.trend === 'up' ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-[#14b8a6] mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500 mr-1" />
                          )}
                          <span className={stat.trend === 'up' ? 'text-[#14b8a6]' : 'text-rose-500'}>
                            {stat.change}
                          </span>
                          <span className="text-muted-foreground ml-1.5 font-normal">from last month</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Secondary Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : orderStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 + index * 0.08 }}
            >
              <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue & Sales Area Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Sales Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-8"
          >
            <Card className="border-border/30 rounded-lg bg-card/60 backdrop-blur-md overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold text-foreground">Sales Performance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 font-normal">Monthly revenue & orders from database</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium shrink-0">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" />
                    Revenue
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                    Orders
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="w-full h-[320px]">
                  {loading ? (
                    <div className="w-full h-full bg-muted/30 rounded-xl animate-pulse" />
                  ) : salesData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No sales data available yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" vertical={false} />
                        <XAxis dataKey="month" className="text-xs text-muted-foreground" tickLine={false} />
                        <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '1rem',
                            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
                          }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                        <Area type="monotone" dataKey="orders" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales by Category Pie */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68 }}
            className="lg:col-span-4"
          >
            <Card className="border-border/30 rounded-lg bg-card/60 backdrop-blur-md h-full flex flex-col justify-between">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Categories</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">Product category distribution</p>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col justify-center">
                <div className="w-full h-[200px] relative flex items-center justify-center">
                  {loading ? (
                    <div className="w-full h-full bg-muted/30 rounded-xl animate-pulse" />
                  ) : categoryData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No category data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '1rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {!loading && categoryData.length > 0 && (
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">{totalCategorySales.toLocaleString()}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#14b8a6]">Total Sales</span>
                    </div>
                  )}
                </div>

                {!loading && categoryData.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 pt-4 border-t border-border/10">
                    {categoryData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground truncate font-normal">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Products & Recent Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.76 }}
          >
            <Card className="border-border/30 rounded-lg bg-card/60 backdrop-blur-md">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Top Performing Products</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">Best seller items by sales count</p>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No product data yet</p>
                ) : (
                  <div className="divide-y divide-border/20 space-y-1">
                    {topProducts.map((product: any, i: number) => {
                      const rawImg = product.image || product.thumbnailUrl || product.thumbnail || product.images?.[0]?.url;
                      const imgUrl = resolveImageUrl(rawImg);
                      return (
                        <div key={i} className="flex items-center gap-4 py-3 first:pt-1 last:pb-1">
                          <div className="flex-shrink-0 w-11 h-11 rounded-md bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] border border-[#14b8a6]/15 overflow-hidden">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name || 'Product'}
                                className="w-full h-full object-cover rounded-md"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.classList.remove('overflow-hidden');
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{product.name || product.productName}</p>
                            <p className="text-xs text-muted-foreground font-normal">{product.sales ?? product.totalSales ?? 0} sales units</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-[#14b8a6]">
                              {product.revenue != null ? formatCurrency(product.revenue) : '—'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Store Orders */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.84 }}
          >
            <Card className="border-border/30 rounded-lg bg-card/60 backdrop-blur-md">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Recent Transactions</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">Newly placed order logs from database</p>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No orders yet</p>
                ) : (
                  <div className="divide-y divide-border/20 space-y-1">
                    {recentOrders.map((order: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 py-3 first:pt-1 last:pb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {order.customerName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer'}
                          </p>
                          <p className="text-xs text-muted-foreground font-normal">
                            #{order.orderNumber || order.id?.slice(0, 8)} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="font-bold text-sm text-[#14b8a6]">
                            {formatCurrency(order.totalAmount || order.total || 0)}
                          </p>
                          <div className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                            statusColor(order.status)
                          )}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
