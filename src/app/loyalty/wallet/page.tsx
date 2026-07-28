'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Wallet, Plus, Minus, CheckCircle2, AlertCircle, ShieldCheck, Banknote, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function WalletAdminPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
          },
        });
        const json = await res.json();
        const raw = json.data ?? json.users ?? (Array.isArray(json) ? json : []);
        if (Array.isArray(raw)) {
          setCustomers(raw);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleAdjust = async (type: 'ADMIN_CREDIT' | 'ADMIN_DEBIT') => {
    if (!userId || !amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please select a customer and enter a valid amount' });
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
          type,
          description: description || (type === 'ADMIN_CREDIT' ? 'Admin Wallet Credit' : 'Admin Wallet Debit'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        const targetCust = customers.find((c) => String(c.id) === String(userId));
        const custName = targetCust ? `${targetCust.firstName || ''} ${targetCust.lastName || ''}`.trim() || targetCust.email : `User #${userId}`;
        setMessage({
          type: 'success',
          text: `Successfully ${type === 'ADMIN_CREDIT' ? 'credited' : 'debited'} ₹${Number(amount).toFixed(2)} ${type === 'ADMIN_CREDIT' ? 'to' : 'from'} ${custName}'s digital wallet!`,
        });
        setUserId('');
        setAmount('');
        setDescription('');
      } else {
        const rawErr = json.message || 'Wallet adjustment failed';
        const cleanMsg = rawErr.includes('Invocation') || rawErr.includes('Prisma') || rawErr.includes('create()')
          ? 'Invalid parameters provided for wallet transaction. Please verify customer and amount inputs.'
          : rawErr;
        setMessage({ type: 'error', text: cleanMsg });
      }
    } catch (err: any) {
      const rawErr = err.message || 'Server error';
      const cleanMsg = rawErr.includes('Invocation') || rawErr.includes('Prisma') || rawErr.includes('create()')
        ? 'Database transaction error occurred. Please try again.'
        : rawErr;
      setMessage({ type: 'error', text: cleanMsg });
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
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-500" /> Select Customer
                </Label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="">-- Select Customer Name --</option>
                  {customers.map((c: any) => {
                    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || c.email || `User #${c.id}`;
                    return (
                      <option key={c.id} value={c.id}>
                        {name} (ID: #{c.id}{c.email ? ` - ${c.email}` : ''})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-muted-foreground">Select registered customer account</p>
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

