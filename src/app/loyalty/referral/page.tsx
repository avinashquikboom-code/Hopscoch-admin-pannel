'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import { Users, Share2, Award } from 'lucide-react';

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
      <div className="space-y-6 p-6 max-w-4xl">
        <PageHeader
          title="Referral Program Statistics"
          description="View active referral codes, invitation metrics, and referral bonus points earned."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Referral Code</CardTitle>
              <Share2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-mono font-bold text-primary">{data?.referralCode || '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{data?.totalReferrals || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{data?.totalEarnedPoints || 0} Pts</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Referral Activity List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.referrals && data.referrals.length > 0 ? (
                data.referrals.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                    <div>
                      <div className="font-medium text-foreground">
                        User: {r.referee?.firstName} {r.referee?.lastName || ''}
                      </div>
                      <div className="text-muted-foreground">Joined: {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                      +{r.pointsEarned} Pts Earned
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No customer referrals yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
