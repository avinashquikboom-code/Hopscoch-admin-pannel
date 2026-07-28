'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { API_BASE } from '@/lib/api';
import { Sparkles, Plus, Save, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <div className="space-y-6 p-6">
        <PageHeader
          title="Reward Campaigns"
          description="Create promotional bonus campaigns with point multipliers and date windows."
        >
          <Button onClick={() => setSheetOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" /> Active Promotional Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Bonus Points</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length > 0 ? (
                  campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs text-foreground">
                        <div>{c.title}</div>
                        <div className="text-[10px] text-muted-foreground">{c.description}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-primary">{c.code}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                          +{c.bonusPoints} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{c.multiplier}x</TableCell>
                      <TableCell className="text-xs">₹{c.minOrderAmount || 0}</TableCell>
                      <TableCell className="text-xs">
                        {c.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                      No promotional campaigns found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Campaign Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[500px]">
            <SheetHeader>
              <SheetTitle>Create Reward Campaign</SheetTitle>
              <SheetDescription>Set up bonus points or multipliers for sales events.</SheetDescription>
            </SheetHeader>

            {message && (
              <div
                className={`my-4 p-3 rounded text-xs flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <Label>Campaign Title</Label>
                <Input
                  required
                  placeholder="Festival Super Points Sale"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Campaign Code</Label>
                <Input
                  required
                  placeholder="FESTIVAL2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label>Bonus Points</Label>
                <Input
                  type="number"
                  value={form.bonusPoints}
                  onChange={(e) => setForm({ ...form, bonusPoints: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Points Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.multiplier}
                  onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Min Order Amount (INR)</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Campaign'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
