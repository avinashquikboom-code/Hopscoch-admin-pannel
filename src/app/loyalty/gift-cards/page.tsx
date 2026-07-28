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
import { Gift, Plus, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GiftCardsAdminPage() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    code: '',
    amount: 1000,
    expiryDays: 365,
  });

  const fetchGiftCards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/gift-cards`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setGiftCards(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/gift-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Gift Card ${json.data.code} generated successfully!` });
        fetchGiftCards();
        setTimeout(() => setSheetOpen(false), 800);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to generate gift card' });
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
          title="Digital Gift Cards"
          description="Generate gift card voucher codes, view active card balances, and track redemptions."
        >
          <Button onClick={() => setSheetOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Issue Gift Card
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-500" /> Gift Cards Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Initial Balance</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Issued To</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCards.length > 0 ? (
                  giftCards.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono font-bold text-xs text-primary">{g.code}</TableCell>
                      <TableCell className="text-xs">₹{Number(g.initialBalance).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">
                        ₹{Number(g.currentBalance).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{g.issuedToUser?.email || 'General / Unassigned'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {g.expiryDate ? new Date(g.expiryDate).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {g.isActive && Number(g.currentBalance) > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Redeemed / Expired</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                      No gift cards issued.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Issue Gift Card Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[400px]">
            <SheetHeader>
              <SheetTitle>Issue Digital Gift Card</SheetTitle>
              <SheetDescription>Generate a redeemable gift voucher code.</SheetDescription>
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

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <Label>Custom Code (Optional)</Label>
                <Input
                  placeholder="Auto-generated if empty"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label>Gift Amount (INR ₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Validity Period (Days)</Label>
                <Input
                  type="number"
                  value={form.expiryDays}
                  onChange={(e) => setForm({ ...form, expiryDays: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Generating...' : 'Issue Gift Card'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
