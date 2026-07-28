'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import { Users, Share2, Award, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReferralAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReferralStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/referrals`, {
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
    fetchReferralStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1200px] mx-auto">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-600/10 to-blue-600/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-blue-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Share2 className="h-7 w-7 text-blue-500" /> Customer Referral Program
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Monitor customer invitation codes, referral completion milestones, and total referral bonus points distributed.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30 shrink-0">
              <ShieldCheck className="h-4 w-4" /> Viral Growth Engine
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">System Admin Code</span>
              <Share2 className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-extrabold text-blue-600">{data?.referralCode || 'REF-ADMIN'}</div>
              <p className="text-xs text-muted-foreground mt-1">Default referral code</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Successful Referrals</span>
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">{data?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">New accounts created via referral link</p>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Referral Points Issued</span>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-foreground">{data?.totalEarnedPoints || 0} <span className="text-sm font-semibold text-amber-500">Pts</span></div>
              <p className="text-xs text-muted-foreground mt-1">Total reward points distributed for invites</p>
            </div>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" /> Referral Activity Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Live record of referred user registrations and awarded points.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data?.referrals && data.referrals.length > 0 ? (
                data.referrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {r.referee?.firstName ? r.referee.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {r.referee?.firstName} {r.referee?.lastName || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">Joined: {new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 font-bold">
                      +{r.pointsEarned} Pts Earned
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  {loading ? 'Loading referral activity...' : 'No customer referrals logged yet.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

