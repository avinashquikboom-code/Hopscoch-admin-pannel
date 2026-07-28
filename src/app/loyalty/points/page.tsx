'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Award, Plus, Minus, CheckCircle2, AlertCircle, ArrowLeft, Coins, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';

export default function RewardPointsAdminPage() {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
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

  const handleAdjustPoints = async (type: 'ADD' | 'DEDUCT') => {
    if (!userId || !points || Number(points) <= 0) {
      setMessage({ type: 'error', text: 'Please select a customer and enter valid points' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/points/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({
          userId: Number(userId),
          points: Number(points),
          type,
          reason: reason || `Admin Point ${type === 'ADD' ? 'Credit' : 'Deduction'}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const targetCust = customers.find((c) => String(c.id) === String(userId));
        const custName = targetCust ? `${targetCust.firstName || ''} ${targetCust.lastName || ''}`.trim() || targetCust.email : `User #${userId}`;
        setMessage({
          type: 'success',
          text: `Reward points successfully ${type === 'ADD' ? 'credited' : 'deducted'} for ${custName}. New Balance: ${json.data.totalPoints} Pts`,
        });
        setUserId('');
        setPoints('');
        setReason('');
      } else {
        const rawErr = json.message || 'Points adjustment failed';
        const cleanMsg = rawErr.includes('Invocation') || rawErr.includes('Prisma') || rawErr.includes('create()')
          ? 'Invalid parameters provided for point transaction. Please verify customer and points inputs.'
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
          titlePart1="Customer Reward"
          titlePart2="Points Manager"
          badgeText="REAL-TIME POINTS ENGINE"
          subtitle="Grant manual point bonuses, process promotional rewards, or execute point debit adjustments for customer accounts."
          icon={<Award className="h-8 w-8 text-amber-500" />}
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
              <Coins className="h-5 w-5 text-amber-500" /> Adjust Customer Reward Points
            </CardTitle>
            <CardDescription className="text-xs">
              Directly modifies the customer's active reward points balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-500" /> Select Customer
                </Label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
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
                <Label className="text-xs font-bold">Points Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 250"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Points value (100 Pts = ₹1.00 INR)</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Audit Reason / Description</Label>
              <Input
                placeholder="e.g. Special anniversary bonus credit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-card border-border/80 font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">Logged in the customer's point history ledger</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40">
              <Button
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-500/20 px-6 flex-1 h-11"
                disabled={loading}
                onClick={() => handleAdjustPoints('ADD')}
              >
                <Plus className="mr-2 h-5 w-5" /> Credit Reward Points
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="font-bold shadow-lg shadow-red-500/20 px-6 flex-1 h-11"
                disabled={loading}
                onClick={() => handleAdjustPoints('DEDUCT')}
              >
                <Minus className="mr-2 h-5 w-5" /> Debit Reward Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

