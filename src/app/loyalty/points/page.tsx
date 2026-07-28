'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE } from '@/lib/api';
import { Award, Plus, Minus, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <div className="space-y-6 p-6 max-w-4xl">
        <PageHeader
          title="Customer Reward Points Management"
          description="Grant manual point bonuses or execute point adjustments for customer accounts."
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
              <Award className="h-4 w-4 text-amber-500" /> Adjust Customer Reward Points
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
              <Label>Points Amount</Label>
              <Input
                type="number"
                placeholder="e.g. 250"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reason / Note</Label>
              <Input
                placeholder="e.g. Special anniversary reward points"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={loading}
                onClick={() => handleAdjust(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Credit Points
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={() => handleAdjust(false)}
              >
                <Minus className="mr-2 h-4 w-4" /> Debit Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
