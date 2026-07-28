'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { RefreshCcw, Wallet, Award, ArrowLeft, ShieldCheck, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';

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
      <div className="space-y-8 p-6 max-w-[1500px] mx-auto">
        <PageHeader
          titlePart1="Master Loyalty"
          titlePart2="& Wallet Ledger"
          badgeText="SYSTEM AUDIT LOGS"
          subtitle="Real-time audit log statements of customer wallet money transactions and point adjustments."
          icon={<Receipt className="h-8 w-8 text-emerald-500" />}
          actions={
            <Button onClick={fetchTransactions} disabled={loading} className="bg-card hover:bg-muted text-foreground border border-border/80 shadow-sm">
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Wallet Transactions */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" /> Customer Wallet Statement Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Credits, debits, refunds, and order payment deductions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">Transaction Type</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Reference / Note</TableHead>
                    <TableHead className="font-bold text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.wallet?.transactions && data.wallet.transactions.length > 0 ? (
                    data.wallet.transactions.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-xs font-semibold">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-xs font-extrabold ${Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {Number(t.amount) >= 0 ? `+₹${Number(t.amount).toFixed(2)}` : `-₹${Math.abs(Number(t.amount)).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.description || t.referenceId || '—'}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground text-right">
                          {new Date(t.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                        {loading ? 'Loading wallet transactions...' : 'No wallet transactions recorded.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Reward Points Transactions */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" /> Reward Points History
              </CardTitle>
              <CardDescription className="text-xs">
                Points earned on orders, event bonuses, and order redemption logs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">Event Type</TableHead>
                    <TableHead className="font-bold">Points</TableHead>
                    <TableHead className="font-bold">Reason / Order</TableHead>
                    <TableHead className="font-bold text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.points?.transactions && data.points.transactions.length > 0 ? (
                    data.points.transactions.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-xs font-semibold">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold">
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-xs font-extrabold ${Number(t.points) >= 0 ? 'text-amber-600' : 'text-purple-600'}`}>
                          {Number(t.points) >= 0 ? `+${t.points} Pts` : `${t.points} Pts`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.reason || (t.orderId ? `Order #${t.orderId}` : '—')}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground text-right">
                          {new Date(t.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                        {loading ? 'Loading reward points history...' : 'No reward point transactions recorded.'}
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
