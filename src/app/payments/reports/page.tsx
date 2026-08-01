'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Download, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE } from '@/lib/api';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function PaymentReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/payments`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error('Failed to load payment reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/payments/export`, { headers: authHeaders() });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to download CSV report:', err);
    } finally {
      setDownloading(false);
    }
  };

  const monthlyRevenue = reportData?.monthlyRevenue || [
    { month: 'Current', revenue: 0, refunds: 0, failed: 0 }
  ];

  const gatewayData = reportData?.gatewayData || [
    { name: 'Razorpay', success: 0, failed: 0, refunded: 0 }
  ];

  const summary = reportData?.summary || { totalRevenue: 0, totalRefunds: 0, totalFailed: 0, totalCount: 0 };
  const transactions = reportData?.payments || [];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Payment"
          titlePart2="Reports"
          badgeText="Finance Command Center"
          subtitle="Revenue, refunds, failed payments, and gateway performance."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={downloading}
                className="rounded-md gap-2 text-xs border-border/60 cursor-pointer"
              >
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export CSV
              </Button>
              <Button onClick={fetchReports} variant="ghost" size="icon" className="rounded-md h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          }
        />

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/40 bg-card rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">₹{summary.totalRevenue.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border-border/40 bg-card rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Refunds</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">₹{summary.totalRefunds.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border-border/40 bg-card rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Failed Payments</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">₹{summary.totalFailed.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border-border/40 bg-card rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.totalCount}</p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border/40 bg-card rounded-lg">
          <CardHeader><CardTitle className="text-sm font-bold">Monthly Revenue vs Refunds vs Failed</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `₹${(Number(v)).toLocaleString('en-IN')}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="refunds" name="Refunds" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gateway & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/40 bg-card rounded-lg">
            <CardHeader><CardTitle className="text-sm font-bold">Gateway Performance</CardTitle></CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>{['Gateway', 'Success', 'Failed', 'Refunds', 'Rate'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {gatewayData.map((g: any) => {
                      const total = (g.success || 0) + (g.failed || 0) + (g.refunded || 0);
                      const rate = total > 0 ? (((g.success || 0) / total) * 100).toFixed(1) : '100.0';
                      return (
                        <tr key={g.name} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold text-sm">{g.name}</td>
                          <td className="px-4 py-3 text-xs text-emerald-500 font-bold">{g.success}</td>
                          <td className="px-4 py-3 text-xs text-rose-500 font-bold">{g.failed}</td>
                          <td className="px-4 py-3 text-xs text-amber-500 font-bold">{g.refunded}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted/60">
                                <div className="h-1.5 rounded-full bg-[#14b8a6]" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs font-bold">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="border-border/40 bg-card rounded-lg">
            <CardHeader><CardTitle className="text-sm font-bold">Recent Payment Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground">Order</th>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground">Customer</th>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground">Amount</th>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {transactions.length > 0 ? transactions.slice(0, 10).map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/10">
                        <td className="px-3 py-2 font-mono font-bold">{t.orderNumber}</td>
                        <td className="px-3 py-2 font-medium">{t.customerName}</td>
                        <td className="px-3 py-2 font-bold text-teal-600">₹{t.amount}</td>
                        <td className="px-3 py-2 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            t.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">No recent payment transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
