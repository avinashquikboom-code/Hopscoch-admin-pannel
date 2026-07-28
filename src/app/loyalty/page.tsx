'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Coins,
  ShieldCheck,
  Settings2,
  Receipt,
  Share2,
  Crown,
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
      <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <PageHeader
          titlePart1="Loyalty & Rewards"
          titlePart2="Hub"
          badgeText="LOYALTY & REWARDS COMMAND CENTER"
          subtitle="Monitor live customer wallet pools, point issuance & redemption standard, promotional multiplier campaigns, and referral program ROI."
          icon={<Crown className="h-8 w-8 text-amber-500" />}
          actions={
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchAnalytics}
                disabled={loading}
                className="bg-card hover:bg-muted text-foreground border border-border/80 shadow-sm transition-all"
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/loyalty/rules">
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/25 font-bold">
                  <Settings2 className="mr-2 h-4 w-4" /> Global Rules
                </Button>
              </Link>
            </div>
          }
        />

        {/* Top KPI Stat Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Points Issued */}
          <div className="relative overflow-hidden rounded-xl bg-card border border-amber-500/20 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Points Issued</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Coins className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">
                {data?.totalPointsIssued ? data.totalPointsIssued.toLocaleString() : 0} <span className="text-sm font-semibold text-amber-500">Pts</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500 inline" /> Lifetime customer earnings
              </p>
            </div>
          </div>

          {/* Card 2: Points Redeemed */}
          <div className="relative overflow-hidden rounded-xl bg-card border border-purple-500/20 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Points Redeemed</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">
                {data?.totalPointsRedeemed ? data.totalPointsRedeemed.toLocaleString() : 0} <span className="text-sm font-semibold text-purple-500">Pts</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Discount Value: ₹{((data?.totalPointsRedeemed || 0) * 0.01).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Card 3: Active Wallet Balance */}
          <div className="relative overflow-hidden rounded-xl bg-card border border-emerald-500/20 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Active Wallet Pool</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">
                ₹{data?.totalWalletBalance ? Number(data.totalWalletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across <span className="font-semibold text-emerald-600">{data?.activeWalletsCount || 0}</span> active customer wallets
              </p>
            </div>
          </div>

          {/* Card 4: Successful Referrals */}
          <div className="relative overflow-hidden rounded-xl bg-card border border-blue-500/20 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Referral Conversions</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">
                {data?.totalReferralsCount || 0} <span className="text-sm font-semibold text-blue-500">Users</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful referral signups & purchases
              </p>
            </div>
          </div>
        </div>

        {/* Quick Management Suite (6 Modules) */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-500" /> Management Modules
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/loyalty/rules" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      Reward Rules & Engine <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure 3-Tier priority: Product → Category → Global
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loyalty/wallet" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                      Customer Wallets <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manual credit/debit adjustments, refunds & balances
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loyalty/product-rewards" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-105 transition-transform">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-purple-500 transition-colors flex items-center gap-1">
                      Product Reward Overrides <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set specific earn & max redemption limits per product
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loyalty/category-rewards" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20 group-hover:scale-105 transition-transform">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-teal-500 transition-colors flex items-center gap-1">
                      Category Reward Matrix <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Category-wide point multipliers & rule overrides
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loyalty/gift-cards" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1">
                      Digital Gift Cards <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate digital voucher codes for customer wallet topup
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/loyalty/campaigns" className="group block">
              <div className="h-full rounded-xl bg-card border border-border/60 p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-105 transition-transform">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-blue-500 transition-colors flex items-center gap-1">
                      Promotional Campaigns <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bonus point multipliers, promo windows & referral bonuses
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Data Tables Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Table 1: Top Reward Products */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" /> Overridden Product Rules
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Products with explicit point override configurations
                </CardDescription>
              </div>
              <Link href="/loyalty/product-rewards">
                <Button size="sm" variant="ghost" className="text-xs hover:bg-amber-500/10 hover:text-amber-600">
                  View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {data?.topRewardProducts && data.topRewardProducts.length > 0 ? (
                  data.topRewardProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border border-border/30">
                      <div>
                        <div className="font-bold text-sm text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Price: ₹{Number(p.basePrice).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
                          Earn {p.rewardPoints} Pts
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Max Redeem: <span className="font-semibold text-purple-600">{p.maxRedeemablePoints} Pts</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No custom product reward rules set yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table 2: Top Loyalty Customers */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" /> Top Customer Balances
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Customers with highest reward points and active wallet funds
                </CardDescription>
              </div>
              <Link href="/loyalty/points">
                <Button size="sm" variant="ghost" className="text-xs hover:bg-purple-500/10 hover:text-purple-600">
                  View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {data?.topCustomers && data.topCustomers.length > 0 ? (
                  data.topCustomers.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 font-bold flex items-center justify-center text-xs">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{c.name || 'Customer'}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 font-bold">
                          {c.rewardPointsBalance} Pts
                        </Badge>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                          Wallet: ₹{Number(c.walletBalance || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No customer points or wallet data logged yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

