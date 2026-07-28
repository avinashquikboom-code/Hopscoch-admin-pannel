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
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-600/10 to-amber-600/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Gift className="h-7 w-7 text-amber-500" /> Digital Gift Card Vouchers
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Generate digital gift voucher codes for customer wallet balance redemption.
              </p>
            </div>
            <Button onClick={() => setSheetOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/25 shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Generate Gift Card
            </Button>
          </div>
        </div>

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
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="border-b border-border/40 pb-4">
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" /> Generate Digital Gift Card
              </SheetTitle>
              <SheetDescription className="text-xs">
                Issue a new gift voucher for wallet credit topup.
              </SheetDescription>
            </SheetHeader>

            {message && (
              <div
                className={`my-4 p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
                  message.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-600 border border-red-500/30'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Custom Voucher Code (Optional)</Label>
                <Input
                  placeholder="e.g. GIFT-2026-FCI"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="bg-card border-border/80 font-mono font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Leave blank to auto-generate random code</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Gift Card Value (₹ INR)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Full value credited on customer redemption</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Validity Expiry (Days)</Label>
                <Input
                  type="number"
                  value={form.expiryDays}
                  onChange={(e) => setForm({ ...form, expiryDays: Number(e.target.value) })}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Default: 365 days (1 year)</p>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold h-10 shadow-md shadow-amber-500/20">
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Generating...' : 'Generate Gift Card'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
