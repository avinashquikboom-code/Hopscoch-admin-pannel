'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { API_BASE } from '@/lib/api';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Gift,
  Coins,
  ArrowLeft,
  Settings2,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

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
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-emerald-500/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Settings2 className="h-7 w-7 text-amber-500" /> Global Reward Rules & Engine
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Configure global earning formulas, point-to-INR conversions, order discount caps, and automated milestone rewards.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Master Toggles */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> Core Module Subsystems
              </CardTitle>
              <CardDescription className="text-xs">
                Master switches to globally enable or disable reward mechanisms across web, mobile, and backend APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div>
                  <Label className="font-bold text-sm text-foreground">Reward Points System</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Customers earn points on orders & redeem points for checkout discounts.</p>
                </div>
                <Switch
                  checked={form.enableRewardSystem}
                  onCheckedChange={(val) => setForm({ ...form, enableRewardSystem: val })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div>
                  <Label className="font-bold text-sm text-foreground">Customer Digital Wallet</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Allows storing money balance, quick checkout payments, and refund credits.</p>
                </div>
                <Switch
                  checked={form.enableWallet}
                  onCheckedChange={(val) => setForm({ ...form, enableWallet: val })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div>
                  <Label className="font-bold text-sm text-foreground">Cashback Subsystem</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Enables promotional cashback transactions directly credited to user wallets.</p>
                </div>
                <Switch
                  checked={form.enableCashback}
                  onCheckedChange={(val) => setForm({ ...form, enableCashback: val })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                <div>
                  <Label className="font-bold text-sm text-foreground">Referral & Invite Program</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Generates referral codes for users to invite friends & earn signup bonuses.</p>
                </div>
                <Switch
                  checked={form.enableReferral}
                  onCheckedChange={(val) => setForm({ ...form, enableReferral: val })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Points Calculation & Conversion */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-purple-500" /> Point Calculations & Currency Conversion
              </CardTitle>
              <CardDescription className="text-xs">
                Configure default earning multipliers, redemption thresholds, and currency equivalence.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Points Earned Per ₹100 Spent</Label>
                <Input
                  type="number"
                  value={form.pointsPer100}
                  onChange={(e) => setForm({ ...form, pointsPer100: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Default: 10 points = 10% points return rate</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Conversion Rate (INR Per Point)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.rewardConversionRate}
                  onChange={(e) => setForm({ ...form, rewardConversionRate: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">0.01 means 100 Points = ₹1.00 INR Discount</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Max Redeemable Points Per Order</Label>
                <Input
                  type="number"
                  value={form.maxRedeemablePointsPerOrder}
                  onChange={(e) => setForm({ ...form, maxRedeemablePointsPerOrder: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Cap limit per single order checkout</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Max Order Discount Cap (%)</Label>
                <Input
                  type="number"
                  value={form.maxRedeemablePercentPerOrder}
                  onChange={(e) => setForm({ ...form, maxRedeemablePercentPerOrder: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Example: 50% max discount allowed from points</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Minimum Order Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Threshold required to earn or redeem points</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Reward Expiry (Days)</Label>
                <Input
                  type="number"
                  value={form.rewardExpiryDays}
                  onChange={(e) => setForm({ ...form, rewardExpiryDays: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Points expire after specified days of inactivity</p>
              </div>
            </CardContent>
          </Card>

          {/* Automated Event Rewards */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-500" /> Automated Event Rewards
              </CardTitle>
              <CardDescription className="text-xs">
                Instant point bonuses credited automatically upon customer milestones and triggers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Welcome Bonus (Signup)</Label>
                <Input
                  type="number"
                  value={form.welcomeReward}
                  onChange={(e) => setForm({ ...form, welcomeReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited on account registration</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Daily App Login Bonus</Label>
                <Input
                  type="number"
                  value={form.dailyLoginReward}
                  onChange={(e) => setForm({ ...form, dailyLoginReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited once per day on app open</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Referral Bonus (Per Friend)</Label>
                <Input
                  type="number"
                  value={form.referralReward}
                  onChange={(e) => setForm({ ...form, referralReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited when referred user signs up</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Product Review Reward</Label>
                <Input
                  type="number"
                  value={form.reviewReward}
                  onChange={(e) => setForm({ ...form, reviewReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited on verified product review</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">First Order Completion</Label>
                <Input
                  type="number"
                  value={form.firstOrderReward}
                  onChange={(e) => setForm({ ...form, firstOrderReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited on first completed order</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Birthday Special Bonus</Label>
                <Input
                  type="number"
                  value={form.birthdayReward}
                  onChange={(e) => setForm({ ...form, birthdayReward: Number(e.target.value) })}
                  className="bg-card font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Credited automatically on birthday</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-500/25 px-8">
              <Save className="mr-2 h-5 w-5" /> {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

