'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Wallet, Plus, Minus, CheckCircle2, AlertCircle, ShieldCheck, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function WalletAdminPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<'ADMIN_CREDIT' | 'ADMIN_DEBIT'>('ADMIN_CREDIT');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid User ID and Amount' });
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
          type: actionType,
          description: description || (actionType === 'ADMIN_CREDIT' ? 'Admin Wallet Credit' : 'Admin Wallet Debit'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Successfully ${actionType === 'ADMIN_CREDIT' ? 'credited' : 'debited'} ₹${Number(amount).toFixed(2)} ${actionType === 'ADMIN_CREDIT' ? 'to' : 'from'} User #${userId}'s wallet!`,
        });
        setUserId('');
        setAmount('');
        setDescription('');
      } else {
        setMessage({ type: 'error', text: json.message || 'Wallet adjustment failed' });
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
          titlePart1="Customer Digital"
          titlePart2="Wallet Manager"
          badgeText="ATOMIC FINANCIAL LEDGER"
          subtitle="Directly credit or debit customer wallets, process goodwill refunds, and execute administrative balance adjustments."
          icon={<Wallet className="h-8 w-8 text-emerald-500" />}
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
              <Banknote className="h-5 w-5 text-emerald-500" /> Execute Direct Wallet Adjustment
            </CardTitle>
            <CardDescription className="text-xs">
              Changes reflect immediately on the customer's wallet balance and order checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
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
                <p className="text-[11px] text-muted-foreground">Unique ID of the customer account</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Adjustment Amount (₹ INR)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Amount to add or deduct in ₹ INR</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Transaction Audit Reason / Description</Label>
              <Input
                placeholder="e.g. Goodwill refund for delayed order #ORD-9812"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-card border-border/80 font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">Visible to user in their wallet ledger statement</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 px-6 flex-1 h-11"
                disabled={loading}
                onClick={() => handleAdjust('ADMIN_CREDIT')}
              >
                <Plus className="mr-2 h-5 w-5" /> Credit Customer Wallet
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="font-bold shadow-lg shadow-red-500/20 px-6 flex-1 h-11"
                disabled={loading}
                onClick={() => handleAdjust('ADMIN_DEBIT')}
              >
                <Minus className="mr-2 h-5 w-5" /> Debit Customer Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

