'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE } from '@/lib/api';
import { Sparkles, Plus, Save, CheckCircle2, AlertCircle, ArrowLeft, Flame } from 'lucide-react';
import Link from 'next/link';

export default function CampaignsAdminPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    bonusPoints: 100,
    multiplier: 1.5,
    minOrderAmount: 500,
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    isActive: true,
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/campaigns`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Campaign saved successfully!' });
        fetchCampaigns();
        setTimeout(() => setSheetOpen(false), 800);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to save campaign' });
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
        <PageHeader
          titlePart1="Promotional Reward"
          titlePart2="Campaigns"
          badgeText="BONUS MULTIPLIER CAMPAIGNS"
          subtitle="Create promotional bonus point multipliers, date-window events, and campaign codes."
          icon={<Flame className="h-8 w-8 text-purple-500" />}
          actions={
            <Button onClick={() => setSheetOpen(true)} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-md shadow-purple-500/25">
              <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          }
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> Active & Scheduled Campaigns
            </CardTitle>
            <CardDescription className="text-xs">
              Live promotional windows with bonus point multipliers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Campaign Name</TableHead>
                  <TableHead className="font-bold">Code</TableHead>
                  <TableHead className="font-bold">Bonus Points</TableHead>
                  <TableHead className="font-bold">Multiplier</TableHead>
                  <TableHead className="font-bold">Min Order (₹)</TableHead>
                  <TableHead className="font-bold">Duration Window</TableHead>
                  <TableHead className="font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length > 0 ? (
                  campaigns.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs">
                        <div className="font-bold text-foreground">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground">{c.description || 'No description'}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-purple-600">{c.code || 'GLOBAL'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30">
                          +{c.bonusPoints || 0} Bonus Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-600">{c.multiplier || 1.0}x</TableCell>
                      <TableCell className="text-xs font-semibold">₹{Number(c.minOrderAmount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.startsAt).toLocaleDateString()} — {new Date(c.endsAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.isActive ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-bold">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Ended
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      {loading ? 'Loading promotional campaigns...' : 'No active campaigns created.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Campaign Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg w-full bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl p-0 overflow-y-auto flex flex-col">
            {/* Header Banner */}
            <SheetHeader className="relative overflow-hidden bg-gradient-to-r from-purple-500/20 via-indigo-600/15 to-amber-500/20 p-6 pr-12 border-b border-border/60 text-left space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-500 flex items-center justify-center shrink-0 shadow-md">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-extrabold text-foreground tracking-tight">
                    Create Reward Campaign
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-1">
                    Launch a promotional point multiplier campaign for sales events
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Form Body */}
            <div className="p-6 space-y-5 flex-1">
              {message && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-sm ${
                    message.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-600 border border-red-500/30'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {message.text}
                </div>
              )}

              <form id="campaign-form" onSubmit={handleSave} className="space-y-5">
                {/* General Info Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Flame className="h-4 w-4 text-purple-500" /> Campaign Identification
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Campaign Title</Label>
                    <Input
                      placeholder="e.g. Festival Double Points Bonus"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Promo Code (Optional)</Label>
                    <Input
                      placeholder="e.g. FESTIVAL2026"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="bg-card/80 border-border/80 font-mono font-semibold h-10 rounded-xl focus:border-purple-500 uppercase"
                    />
                  </div>
                </div>

                {/* Multiplier & Bonus Points Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Multipliers & Qualifications
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Bonus Points</Label>
                      <Input
                        type="number"
                        value={form.bonusPoints}
                        onChange={(e) => setForm({ ...form, bonusPoints: Number(e.target.value) })}
                        className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">Fixed bonus pts</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.multiplier}
                        onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })}
                        className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">e.g. 2.0 = 2x Boost</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Min Order Subtotal (₹ INR)</Label>
                    <Input
                      type="number"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                    />
                    <p className="text-[11px] text-muted-foreground">Minimum cart total to trigger bonus multiplier</p>
                  </div>
                </div>

                {/* Campaign Schedule Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Plus className="h-4 w-4 text-indigo-500" /> Campaign Schedule
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Start Date</Label>
                      <Input
                        type="date"
                        value={form.startsAt}
                        onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                        className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">End Date</Label>
                      <Input
                        type="date"
                        value={form.endsAt}
                        onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                        className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-md p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="h-11 px-5 rounded-xl font-semibold">
                Cancel
              </Button>
              <Button form="campaign-form" type="submit" disabled={saving} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]">
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Creating Campaign...' : 'Create Campaign'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
