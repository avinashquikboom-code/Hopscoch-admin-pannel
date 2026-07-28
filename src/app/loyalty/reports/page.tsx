'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/lib/api';
import { BarChart3, Download, RefreshCcw, ArrowLeft, TrendingUp, ShieldCheck, Wallet, Award, RefreshCw, Share2 } from 'lucide-react';
import Link from 'next/link';
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Points Issued</span>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">{Number(data?.totalPointsIssued || 0).toLocaleString()} <span className="text-sm font-semibold text-amber-500">Pts</span></div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime customer reward points</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Points Redeemed</span>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">{Number(data?.totalPointsRedeemed || 0).toLocaleString()} <span className="text-sm font-semibold text-purple-500">Pts</span></div>
              <p className="text-xs text-muted-foreground mt-1">Redeemed against customer orders</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Active Wallet Liability</span>
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-600">₹{Number(data?.totalWalletBalance || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding customer money balance</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cashback Issued</span>
              <RefreshCw className="h-5 w-5 text-teal-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">₹{Number(data?.totalCashbackIssued || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1">Promotional cashback credited</p>
            </div>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm max-w-2xl">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" /> System Financial Audit Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Consolidated financial statements for accounting reconciliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground">Total Customer Reward Points Issued</span>
                <span className="font-extrabold text-sm text-foreground">{Number(data?.totalPointsIssued || 0).toLocaleString()} Pts</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground">Total Customer Reward Points Redeemed</span>
                <span className="font-extrabold text-sm text-purple-600">{Number(data?.totalPointsRedeemed || 0).toLocaleString()} Pts</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground">Active Wallet Money Liability (INR)</span>
                <span className="font-extrabold text-sm text-emerald-600">₹{Number(data?.totalWalletBalance || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground">Promotional Cashback Credits Distributed</span>
                <span className="font-extrabold text-sm text-teal-600">₹{Number(data?.totalCashbackIssued || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-muted-foreground">Total Referral Conversions Recorded</span>
                <span className="font-extrabold text-sm text-blue-600">{data?.totalReferralsCount || 0} Accounts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

