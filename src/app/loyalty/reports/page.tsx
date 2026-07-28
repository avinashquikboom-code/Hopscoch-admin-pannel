'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import {
  BarChart3,
  RefreshCcw,
  TrendingUp,
  Wallet,
  Award,
  RefreshCw,
  Share2,
  IndianRupee,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function LoyaltyReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalPointsIssued = Number(data?.totalPointsIssued || 0);
  const totalPointsRedeemed = Number(data?.totalPointsRedeemed || 0);
  const totalWalletBalance = Number(data?.totalWalletBalance || 0);
  const totalCashbackIssued = Number(data?.totalCashbackIssued || 0);
  const totalReferrals = Number(data?.totalReferralsCount || 0);
  const redemptionRate = totalPointsIssued > 0 ? ((totalPointsRedeemed / totalPointsIssued) * 100).toFixed(1) : '0.0';

  const statCards = [
    {
      label: 'Total Points Issued',
      value: `${totalPointsIssued.toLocaleString()} Pts`,
      icon: <Award className="h-6 w-6" />,
      color: 'amber',
      sub: 'Lifetime reward points distributed',
      trend: '+12% vs last month',
    },
    {
      label: 'Points Redeemed',
      value: `${totalPointsRedeemed.toLocaleString()} Pts`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'purple',
      sub: 'Against customer orders',
      trend: `${redemptionRate}% redemption rate`,
    },
    {
      label: 'Wallet Liability',
      value: `₹${totalWalletBalance.toLocaleString('en-IN')}`,
      icon: <Wallet className="h-6 w-6" />,
      color: 'emerald',
      sub: 'Outstanding customer balance',
      trend: 'Live settlement',
    },
    {
      label: 'Cashback Issued',
      value: `₹${totalCashbackIssued.toLocaleString('en-IN')}`,
      icon: <RefreshCw className="h-6 w-6" />,
      color: 'teal',
      sub: 'Promotional credits distributed',
      trend: 'Instant wallet credit',
    },
  ];

  const auditRows = [
    {
      label: 'Total Reward Points Issued',
      value: `${totalPointsIssued.toLocaleString()} Pts`,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: <Award className="h-4 w-4 text-amber-500" />,
    },
    {
      label: 'Total Reward Points Redeemed',
      value: `${totalPointsRedeemed.toLocaleString()} Pts`,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
    },
    {
      label: 'Active Wallet Money Liability (INR)',
      value: `₹${totalWalletBalance.toLocaleString('en-IN')}`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      icon: <Wallet className="h-4 w-4 text-emerald-500" />,
    },
    {
      label: 'Promotional Cashback Credits Distributed',
      value: `₹${totalCashbackIssued.toLocaleString('en-IN')}`,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      icon: <RefreshCw className="h-4 w-4 text-teal-500" />,
    },
    {
      label: 'Total Referral Conversions Recorded',
      value: `${totalReferrals} Accounts`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: <Users className="h-4 w-4 text-blue-500" />,
    },
    {
      label: 'Overall Redemption Rate',
      value: `${redemptionRate}%`,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      icon: <BarChart3 className="h-4 w-4 text-indigo-500" />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Executive Analytics"
          titlePart2="& Financial Reports"
          badgeText="FINANCIAL AUDIT STATEMENT"
          subtitle="Comprehensive financial liabilities, point circulation totals, and promotional ROI reports."
          icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
          actions={
            <Button onClick={fetchAnalytics} disabled={loading} className="bg-card hover:bg-muted text-foreground border border-border/80 shadow-sm">
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Reports
            </Button>
          }
        />

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/70 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-11 w-11 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 shrink-0 group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <ArrowUpRight className={`h-4 w-4 text-${stat.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className={`text-2xl font-extrabold mt-1 text-${stat.color}-600 dark:text-${stat.color}-400 leading-none`}>
                  {loading ? (
                    <span className="inline-block h-7 w-24 rounded-md bg-muted animate-pulse" />
                  ) : stat.value}
                </p>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground font-semibold">{stat.sub}</p>
                  <Badge className={`bg-${stat.color}-500/10 text-${stat.color}-600 border-${stat.color}-500/20 text-[9px] font-bold px-1.5 py-0.5`}>
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Bottom Row — Audit Breakdown + Redemption Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Audit Breakdown Table (2/3) */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-indigo-500/8 to-blue-600/10 p-5 border-b border-border/50">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.07),transparent_70%)]" />
              <div className="relative flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">System Financial Audit Breakdown</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Consolidated statements for accounting reconciliation</p>
                </div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="space-y-2.5">
                {auditRows.map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${row.bg} transition-all hover:scale-[1.005]`}
                  >
                    <div className="flex items-center gap-2.5">
                      {row.icon}
                      <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                    </div>
                    <span className={`text-sm font-extrabold ${row.color} ml-4 shrink-0`}>{loading ? '—' : row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Metrics Cards (1/3) */}
          <div className="space-y-4">
            {/* Redemption Rate Gauge Card */}
            <Card className="border-border/60 shadow-sm overflow-hidden bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <p className="text-xs font-extrabold text-foreground">Redemption Rate</p>
                </div>
                <div className="text-center py-3">
                  <p className="text-5xl font-extrabold text-purple-600 dark:text-purple-400">
                    {loading ? '—' : `${redemptionRate}%`}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 font-semibold">of issued points redeemed</p>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2.5 rounded-full bg-muted/40 border border-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${Math.min(Number(redemptionRate), 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium text-center">
                  {loading ? '—' : `${totalPointsRedeemed.toLocaleString()} of ${totalPointsIssued.toLocaleString()} Pts`}
                </p>
              </CardContent>
            </Card>

            {/* Referral Summary Card */}
            <Card className="border-border/60 shadow-sm bg-gradient-to-br from-blue-500/5 to-teal-500/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-500" />
                  <p className="text-xs font-extrabold text-foreground">Referral Program</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="h-10 w-10 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 font-extrabold text-lg shrink-0">
                    {loading ? '—' : totalReferrals}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">Total Referrals</p>
                    <p className="text-[10px] text-muted-foreground">Accounts via invite link</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-foreground">Wallet Liability</p>
                    <p className="text-[10px] text-muted-foreground">Outstanding balance</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600">
                    ₹{loading ? '—' : totalWalletBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Info badge */}
            <Card className="border-border/60 shadow-sm bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-foreground">Live Analytics</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                    All figures are computed in real-time from the loyalty database. Refresh to get the latest numbers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
