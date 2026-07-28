'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { API_BASE } from '@/lib/api';
import { Sparkles, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoyaltyRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    enableRewardSystem: true,
    enableWallet: true,
    enableCashback: true,
    enableReferral: true,
    defaultRewardPoints: 10,
    pointsPer100: 10,
    rewardConversionRate: 0.01, // 100 Pts = ₹1
    maxRedeemablePointsPerOrder: 1000,
    maxRedeemablePercentPerOrder: 50,
    minOrderAmount: 100,
    rewardExpiryDays: 365,
    dailyLoginReward: 5,
    birthdayReward: 100,
    welcomeReward: 50,
    referralReward: 100,
    reviewReward: 20,
    firstOrderReward: 100,
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/rules`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setForm({
          enableRewardSystem: json.data.enableRewardSystem !== false,
          enableWallet: json.data.enableWallet !== false,
          enableCashback: json.data.enableCashback !== false,
          enableReferral: json.data.enableReferral !== false,
          defaultRewardPoints: json.data.defaultRewardPoints || 10,
          pointsPer100: Number(json.data.pointsPer100 || 10),
          rewardConversionRate: Number(json.data.rewardConversionRate || 0.01),
          maxRedeemablePointsPerOrder: json.data.maxRedeemablePointsPerOrder || 1000,
          maxRedeemablePercentPerOrder: Number(json.data.maxRedeemablePercentPerOrder || 50),
          minOrderAmount: Number(json.data.minOrderAmount || 100),
          rewardExpiryDays: json.data.rewardExpiryDays || 365,
          dailyLoginReward: json.data.dailyLoginReward || 5,
          birthdayReward: json.data.birthdayReward || 100,
          welcomeReward: json.data.welcomeReward || 50,
          referralReward: json.data.referralReward || 100,
          reviewReward: json.data.reviewReward || 20,
          firstOrderReward: json.data.firstOrderReward || 100,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Global Loyalty & Reward Rules saved successfully!' });
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to save rules' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-5xl">
        <PageHeader
          title="Global Reward Rules & Settings"
          description="Configure system-wide loyalty settings, conversion rates, order redemption limits, and event rewards."
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Master Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Master Module Toggles
              </CardTitle>
              <CardDescription>Enable or disable major subsystems globally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <Label className="font-semibold">Enable Reward System</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to earn and redeem reward points.</p>
                </div>
                <Switch
                  checked={form.enableRewardSystem}
                  onCheckedChange={(val) => setForm({ ...form, enableRewardSystem: val })}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <Label className="font-semibold">Enable Customer Wallet</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to hold funds and pay using wallet balance.</p>
                </div>
                <Switch
                  checked={form.enableWallet}
                  onCheckedChange={(val) => setForm({ ...form, enableWallet: val })}
                />
              </div>

              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <Label className="font-semibold">Enable Cashback System</Label>
                  <p className="text-xs text-muted-foreground">Allow promotional and order cashback credits.</p>
                </div>
                <Switch
                  checked={form.enableCashback}
                  onCheckedChange={(val) => setForm({ ...form, enableCashback: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold">Enable Referral Program</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to invite friends and earn referral bonuses.</p>
                </div>
                <Switch
                  checked={form.enableReferral}
                  onCheckedChange={(val) => setForm({ ...form, enableReferral: val })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Points Calculation & Conversion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Points Earning & Redemption Conversion</CardTitle>
              <CardDescription>Default earn rate and conversion value (e.g. 100 Points = ₹1.00 INR).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Points Earned Per ₹100 Spent</Label>
                <Input
                  type="number"
                  value={form.pointsPer100}
                  onChange={(e) => setForm({ ...form, pointsPer100: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Example: 10 points per ₹100 spent = 10% points return.</p>
              </div>

              <div>
                <Label>Point Conversion Rate (INR per Point)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.rewardConversionRate}
                  onChange={(e) => setForm({ ...form, rewardConversionRate: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">0.01 means 100 Points = ₹1.00 INR discount.</p>
              </div>

              <div>
                <Label>Maximum Redeemable Points Per Order</Label>
                <Input
                  type="number"
                  value={form.maxRedeemablePointsPerOrder}
                  onChange={(e) => setForm({ ...form, maxRedeemablePointsPerOrder: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Maximum Redeemable % of Order Subtotal</Label>
                <Input
                  type="number"
                  value={form.maxRedeemablePercentPerOrder}
                  onChange={(e) => setForm({ ...form, maxRedeemablePercentPerOrder: Number(e.target.value) })}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Example: 50% max order discount from points.</p>
              </div>

              <div>
                <Label>Minimum Order Amount to Earn/Redeem</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Reward Points Expiry (Days)</Label>
                <Input
                  type="number"
                  value={form.rewardExpiryDays}
                  onChange={(e) => setForm({ ...form, rewardExpiryDays: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Instant Event Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instant Event Reward Bonuses</CardTitle>
              <CardDescription>Points awarded automatically for user activity events.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Welcome Bonus (New Signup)</Label>
                <Input
                  type="number"
                  value={form.welcomeReward}
                  onChange={(e) => setForm({ ...form, welcomeReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Daily Login Reward</Label>
                <Input
                  type="number"
                  value={form.dailyLoginReward}
                  onChange={(e) => setForm({ ...form, dailyLoginReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Referral Bonus (Per Friend)</Label>
                <Input
                  type="number"
                  value={form.referralReward}
                  onChange={(e) => setForm({ ...form, referralReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Product Review Reward</Label>
                <Input
                  type="number"
                  value={form.reviewReward}
                  onChange={(e) => setForm({ ...form, reviewReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>First Order Bonus</Label>
                <Input
                  type="number"
                  value={form.firstOrderReward}
                  onChange={(e) => setForm({ ...form, firstOrderReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Birthday Reward</Label>
                <Input
                  type="number"
                  value={form.birthdayReward}
                  onChange={(e) => setForm({ ...form, birthdayReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Loyalty Rules'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
