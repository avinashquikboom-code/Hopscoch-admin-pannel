'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { API_BASE } from '@/lib/api';
import { RefreshCcw, Wallet, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MasterTransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/transactions`, {
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
    fetchTransactions();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <PageHeader
          title="Master Transactions Ledger"
          description="Detailed transaction audit logs for Wallet and Reward Points."
        >
          <Button onClick={fetchTransactions} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Wallet Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" /> Wallet Transactions History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.wallet?.transactions && data.wallet.transactions.length > 0 ? (
                    data.wallet.transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-semibold">
                          <Badge variant="outline">{t.type}</Badge>
                        </TableCell>
                        <TableCell className={`text-xs font-bold ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {Number(t.amount) >= 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.description || t.referenceId || '—'}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {new Date(t.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        No wallet transactions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Reward Points Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Reward Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.rewardPoints?.transactions && data.rewardPoints.transactions.length > 0 ? (
                    data.rewardPoints.transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-semibold">
                          <Badge variant="secondary">{t.type}</Badge>
                        </TableCell>
                        <TableCell className={`text-xs font-bold ${t.points >= 0 ? 'text-amber-600' : 'text-purple-600'}`}>
                          {t.points >= 0 ? `+${t.points} Pts` : `${t.points} Pts`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.reason || t.orderId || '—'}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {new Date(t.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        No reward point transactions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
