'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import {
  Sparkles,
  Wallet,
  Award,
  RefreshCcw,
  Users,
  TrendingUp,
  Package,
  FolderTree,
  ArrowUpRight,
  Gift,
} from 'lucide-react';
import Link from 'next/link';

export default function LoyaltyDashboardPage() {
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
    } catch (error) {
      console.error('Failed to fetch loyalty analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <PageHeader
          title="Loyalty & Rewards Dashboard"
          description="Overview of customer wallet balances, reward points issued, top products, and referral metrics."
        >
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </PageHeader>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Points Issued</CardTitle>
              <Award className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data?.totalPointsIssued ? data.totalPointsIssued.toLocaleString() : 0} Pts
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total points earned by customers</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Points Redeemed</CardTitle>
              <Sparkles className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data?.totalPointsRedeemed ? data.totalPointsRedeemed.toLocaleString() : 0} Pts
              </div>
              <p className="text-xs text-muted-foreground mt-1">Points converted into discounts</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Wallet Balance</CardTitle>
              <Wallet className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{data?.totalWalletBalance ? data.totalWalletBalance.toLocaleString() : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {data?.activeWalletsCount || 0} active wallets
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referrals Completed</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data?.totalReferralsCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Successful customer referrals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/loyalty/rules" className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Reward Rules & Priority
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Configure Global, Category, and Product reward rules. Prioritizes Product → Category → Global.
              </CardContent>
            </Card>
          </Link>

          <Link href="/loyalty/wallet" className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" /> Customer Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                View customer balances, top-up funds, process refunds, or execute admin credit/debit adjustments.
              </CardContent>
            </Card>
          </Link>

          <Link href="/loyalty/product-rewards" className="block">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" /> Product Rewards Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Override reward points and maximum redeemable points for specific products.
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tables: Top Reward Products & Categories */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Reward Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-500" /> Top Reward Products
              </CardTitle>
              <Link href="/loyalty/product-rewards">
                <Button size="xs" variant="ghost" className="text-xs">
                  View All <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topRewardProducts && data.topRewardProducts.length > 0 ? (
                  data.topRewardProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-muted-foreground">Price: ₹{Number(p.basePrice).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          Earn {p.rewardPoints} Pts
                        </Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Max Redeem: {p.maxRedeemablePoints} Pts
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No custom product reward rules set.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Top Loyalty Customers
              </CardTitle>
              <Link href="/loyalty/points">
                <Button size="xs" variant="ghost" className="text-xs">
                  View All <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topCustomers && data.topCustomers.length > 0 ? (
                  data.topCustomers.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                      <div>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-muted-foreground">{c.email}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {c.rewardPointsBalance} Pts
                        </Badge>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Wallet: ₹{c.walletBalance}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No customer points data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
