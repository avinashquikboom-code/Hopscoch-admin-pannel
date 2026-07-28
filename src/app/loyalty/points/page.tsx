'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Award, Plus, Minus, CheckCircle2, AlertCircle, ArrowLeft, Coins, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PointsAdminPage() {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdjust = async (isCredit: boolean) => {
    if (!userId || !points || Number(points) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid User ID and Points' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const val = isCredit ? Number(points) : -Number(points);
      const res = await fetch(`${API_BASE}/loyalty/admin/points/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({
          userId: Number(userId),
          points: val,
          type: 'ADJUSTED',
          reason: reason || (isCredit ? 'Admin Bonus Credit' : 'Admin Point Debit'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: `Successfully ${isCredit ? 'credited' : 'debited'} ${points} points for User #${userId}.`,
        });
        setUserId('');
        setPoints('');
        setReason('');
      } else {
        setMessage({ type: 'error', text: json.message || 'Points adjustment failed' });
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
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-amber-600/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Award className="h-7 w-7 text-amber-500" /> Customer Reward Points Manager
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Grant manual point bonuses, process promotional rewards, or execute point debit adjustments for customer accounts.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
              <Sparkles className="h-4 w-4" /> Real-time Points Engine
            </span>
          </div>
        </div>

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
                onClick={() => handleAdjust(true)}
              >
                <Plus className="mr-2 h-5 w-5" /> Credit Reward Points
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="font-bold shadow-lg shadow-red-500/20 px-6 flex-1 h-11"
                disabled={loading}
                onClick={() => handleAdjust(false)}
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

