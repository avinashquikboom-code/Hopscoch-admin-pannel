'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE } from '@/lib/api';

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function PaymentAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/payments/analytics?period=${p}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (err) {
      console.error('Failed to load payment analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const stats = analytics?.summary || { revenue: '₹0.00L', orders: '0', avgOrder: '₹0', refundRate: '0.0%' };
  const currentData = analytics?.chartData || [];
  const gatewayPie = analytics?.gatewayPie || [
    { name: 'Razorpay', value: 70, color: '#14b8a6' },
    { name: 'UPI', value: 20, color: '#06b6d4' },
    { name: 'COD', value: 10, color: '#8b5cf6' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Payment"
          titlePart2="Analytics"
          badgeText="Finance Command Center"
          subtitle="Deep-dive into revenue trends and payment patterns."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 bg-muted/40 rounded-md">
                {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as Period[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      period === p ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
              <Button onClick={() => fetchAnalytics(period)} variant="ghost" size="icon" className="rounded-md h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: stats.revenue, color: 'text-[#14b8a6]' },
            { label: 'Orders', value: stats.orders, color: 'text-blue-500' },
            { label: 'Avg Order Value', value: stats.avgOrder, color: 'text-violet-500' },
            { label: 'Refund Rate', value: stats.refundRate, color: 'text-amber-500' },
          ].map(s => (
            <Card key={s.label} className="border-border/40 bg-card rounded-lg">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500 font-semibold">Live DB</span>
                  <span className="text-xs text-muted-foreground ml-1">period: {period.toLowerCase()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="border-border/40 bg-card rounded-lg">
          <CardHeader><CardTitle className="text-sm font-bold">Revenue Trend — {period}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `₹${(Number(v)).toLocaleString('en-IN')}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" fill="url(#anGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Bar */}
          <Card className="lg:col-span-2 border-border/40 bg-card rounded-lg">
            <CardHeader><CardTitle className="text-sm font-bold">Orders vs Refunds</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" name="Orders" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="refunds" name="Refunds" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Method Share */}
          <Card className="border-border/40 bg-card rounded-lg">
            <CardHeader><CardTitle className="text-sm font-bold">Payment Method Share</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={gatewayPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {gatewayPie.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
                {gatewayPie.map((g: any, i: number) => (
                  <div key={g.name} className="flex items-center gap-1.5 font-medium">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color || ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'][i % 4] }} />
                    <span>{g.name} ({g.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
