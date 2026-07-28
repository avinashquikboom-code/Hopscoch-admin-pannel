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
import { Gift, Plus, Save, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';

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
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Digital Gift Card"
          titlePart2="Vouchers"
          badgeText="GIFT CARDS LEDGER"
          subtitle="Generate digital gift voucher codes for customer wallet balance redemption."
          icon={<Gift className="h-8 w-8 text-amber-500" />}
          actions={
            <Button onClick={() => setSheetOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/25">
              <Plus className="mr-2 h-4 w-4" /> Generate Gift Card
            </Button>
          }
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-500" /> Gift Cards Audit Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Vouchers issued and customer redemption status.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Card Code</TableHead>
                  <TableHead className="font-bold">Initial Balance (₹)</TableHead>
                  <TableHead className="font-bold">Current Balance (₹)</TableHead>
                  <TableHead className="font-bold">Expiry Date</TableHead>
                  <TableHead className="font-bold">Redeemed By</TableHead>
                  <TableHead className="font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCards.length > 0 ? (
                  giftCards.map((g) => (
                    <TableRow key={g.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-amber-600 flex items-center gap-2">
                        <Gift className="h-4 w-4 text-amber-500" /> {g.code}
                      </TableCell>
                      <TableCell className="text-xs font-bold">₹{Number(g.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs font-semibold text-emerald-600">₹{Number(g.balance).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {g.redeemedBy ? (
                          <div className="font-medium text-foreground">User #{g.redeemedById} ({g.redeemedBy.firstName || g.redeemedBy.email})</div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {g.isRedeemed ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Redeemed
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-bold">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      {loading ? 'Loading gift cards...' : 'No gift cards generated yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Generate Gift Card Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg w-full bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl p-0 overflow-y-auto flex flex-col">
            {/* Header Banner */}
            <SheetHeader className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-emerald-600/15 to-amber-600/20 p-6 pr-12 border-b border-border/60 text-left space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0 shadow-md">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-extrabold text-foreground tracking-tight">
                    Generate Digital Gift Card
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-1">
                    Issue a new digital gift voucher for customer digital wallet topup
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

              <form id="gift-card-form" onSubmit={handleCreate} className="space-y-5">
                {/* Voucher Code Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Gift className="h-4 w-4 text-amber-500" /> Voucher Code & Denomination
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Custom Voucher Code (Optional)</Label>
                    <Input
                      placeholder="e.g. GIFT-2026-FCI"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="bg-card/80 border-border/80 font-mono font-semibold h-10 rounded-xl focus:border-amber-500 uppercase"
                    />
                    <p className="text-[11px] text-muted-foreground">Leave blank to auto-generate secure alphanumeric code</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Gift Card Value (₹ INR)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-amber-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Full monetary balance credited on customer redemption</p>
                  </div>
                </div>

                {/* Validity Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-1.5">
                  <Label className="text-xs font-bold">Validity Period (Days)</Label>
                  <Input
                    type="number"
                    value={form.expiryDays}
                    onChange={(e) => setForm({ ...form, expiryDays: Number(e.target.value) })}
                    className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">Default validity: 365 days (1 Year)</p>
                </div>
              </form>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-md p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="h-11 px-5 rounded-xl font-semibold">
                Cancel
              </Button>
              <Button form="gift-card-form" type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]">
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Generating...' : 'Generate Gift Card'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
