'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/lib/api';
import { BarChart3, Download, RefreshCcw } from 'lucide-react';

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
      <div className="space-y-6 p-6">
        <PageHeader
          title="Loyalty & Reward Reports"
          description="Detailed financial and point issuance summaries for reporting."
        >
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> System Summary Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Points Issued</span>
                <span className="font-bold">{data?.totalPointsIssued || 0} Pts</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Points Redeemed</span>
                <span className="font-bold">{data?.totalPointsRedeemed || 0} Pts</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Active Wallet Liability</span>
                <span className="font-bold text-emerald-600">₹{data?.totalWalletBalance || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Cashback Issued</span>
                <span className="font-bold">₹{data?.totalCashbackIssued || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referral Conversions</span>
                <span className="font-bold">{data?.totalReferralsCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
