'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { RefreshCw, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

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
          text: `Cashback ₹${amount} credited successfully to User #${userId}'s wallet!`,
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
      <div className="space-y-6 p-6 max-w-4xl">
        <PageHeader
          title="Cashback Management"
          description="Issue promotional cashback directly to customer wallets."
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
              <RefreshCw className="h-4 w-4 text-emerald-500" /> Issue Promotional Cashback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueCashback} className="space-y-4">
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
                <Label>Cashback Amount (INR ₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description / Campaign Note</Label>
                <Input
                  placeholder="e.g. Special cashback reward for 5th order"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Issue Cashback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
