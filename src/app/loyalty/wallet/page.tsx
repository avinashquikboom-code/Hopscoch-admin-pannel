'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Wallet, Plus, Minus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WalletAdminPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdjust = async (type: 'ADMIN_CREDIT' | 'ADMIN_DEBIT') => {
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
          type,
          description: description || `Admin ${type === 'ADMIN_CREDIT' ? 'Credit' : 'Debit'}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Wallet successfully ${type === 'ADMIN_CREDIT' ? 'credited' : 'debited'} for User #${userId}. New Balance: ₹${json.data.balance}`,
        });
        setUserId('');
        setAmount('');
        setDescription('');
      } else {
        setMessage({ type: 'error', text: json.message || 'Transaction failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-4xl">
        <PageHeader
          title="Customer Wallet Management"
          description="Directly credit or debit customer wallets, process refunds, and execute administrative balance adjustments."
        />

        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" /> Execute Wallet Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                type="number"
                placeholder="e.g. 101"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Amount (INR ₹)</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reason / Description</Label>
              <Input
                placeholder="e.g. Goodwill refund for delayed shipment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
                onClick={() => handleAdjust('ADMIN_CREDIT')}
              >
                <Plus className="mr-2 h-4 w-4" /> Credit Wallet
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={() => handleAdjust('ADMIN_DEBIT')}
              >
                <Minus className="mr-2 h-4 w-4" /> Debit Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
