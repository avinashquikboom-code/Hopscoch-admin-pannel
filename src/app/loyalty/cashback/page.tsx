'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { RefreshCw, Plus, CheckCircle2, AlertCircle, ArrowLeft, Coins, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';

export default function CashbackAdminPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleIssueCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid User ID and Cashback Amount' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/wallet/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({
          userId: Number(userId),
          amount: Number(amount),
          type: 'ADMIN_CREDIT',
          description: description || 'Promotional Cashback Credit',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Cashback ₹${Number(amount).toFixed(2)} credited successfully to User #${userId}'s digital wallet!`,
        });
        setUserId('');
        setAmount('');
        setDescription('');
      } else {
        setMessage({ type: 'error', text: json.message || 'Cashback credit failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1200px] mx-auto">
        <PageHeader
          titlePart1="Promotional Cashback"
          titlePart2="Subsystem"
          badgeText="INSTANT WALLET SETTLEMENT"
          subtitle="Issue promotional order cashback rewards directly credited into customer digital wallet balances."
          icon={<RefreshCw className="h-8 w-8 text-emerald-500" />}
        />

        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-600 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" /> Issue Promotional Cashback
            </CardTitle>
            <CardDescription className="text-xs">
              Credits money directly to the customer's wallet balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleIssueCashback} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Target User ID</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 101"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-card border-border/80 font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">Customer account ID</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Cashback Amount (₹ INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-card border-border/80 font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">Amount credited to customer wallet</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Campaign Description / Reason</Label>
                <Input
                  placeholder="e.g. Special festive cashback reward"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Reason visible in customer wallet statement</p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 shadow-lg shadow-emerald-500/20">
                  <Plus className="mr-2 h-5 w-5" /> Issue Cashback Credit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

