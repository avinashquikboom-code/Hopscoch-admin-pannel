'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppDrawer } from '@/components/ui/app-drawer';
import { PageHeader } from '@/components/layout/page-header';
import { Plus, Search, Edit, Trash2, DollarSign, Weight, ShoppingCart, Zap } from 'lucide-react';

type ChargeType = 'flat' | 'weight' | 'value' | 'free' | 'express';

interface Charge {
  id: string;
  name: string;
  type: ChargeType;
  amount: number;
  min: number;
  max: number | null;
  active: boolean;
}

const typeConfig: Record<ChargeType, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  flat:    { label: 'Flat Rate',    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',    icon: DollarSign },
  weight:  { label: 'Weight Based', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', icon: Weight },
  value:   { label: 'Order Value',  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',  icon: ShoppingCart },
  free:    { label: 'Free Shipping',color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: Zap },
  express: { label: 'Express',      color: 'bg-[#14b8a6]/10 text-[#14b8a6]',                     icon: Zap },
};

const initialCharges: Charge[] = [
  { id: '1', name: 'Standard Delivery', type: 'flat', amount: 49, min: 0, max: null, active: true },
  { id: '2', name: 'Free Shipping (₹999+)', type: 'free', amount: 0, min: 999, max: null, active: true },
  { id: '3', name: 'Weight Based (up to 2kg)', type: 'weight', amount: 30, min: 0, max: 2, active: true },
  { id: '4', name: 'Express Delivery', type: 'express', amount: 149, min: 0, max: null, active: true },
  { id: '5', name: 'Free on Orders ₹499+', type: 'free', amount: 0, min: 499, max: null, active: false },
];

export default function ShippingChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [form, setForm] = useState({ name: '', type: 'flat' as ChargeType, amount: '', min: '', max: '' });

  useEffect(() => {
    const saved = localStorage.getItem('fciseller_shipping_charges') || localStorage.getItem('hopscotch_shipping_charges');
    if (saved) {
      setCharges(JSON.parse(saved));
    } else {
      setCharges(initialCharges);
      localStorage.setItem('fciseller_shipping_charges', JSON.stringify(initialCharges));
    }
  }, []);

  const saveCharges = (newCharges: Charge[]) => {
    setCharges(newCharges);
    localStorage.setItem('fciseller_shipping_charges', JSON.stringify(newCharges));
  };

  const filtered = charges.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCharge) {
      const updated = charges.map(c => c.id === editingCharge.id ? {
        ...c, name: form.name, type: form.type,
        amount: Number(form.amount), min: Number(form.min) || 0, max: form.max ? Number(form.max) : null
      } : c);
      saveCharges(updated);
      setEditingCharge(null);
    } else {
      const newCharge: Charge = {
        id: String(Date.now()), name: form.name, type: form.type,
        amount: Number(form.amount), min: Number(form.min) || 0, max: form.max ? Number(form.max) : null, active: true,
      };
      saveCharges([...charges, newCharge]);
    }
    setForm({ name: '', type: 'flat', amount: '', min: '', max: '' });
    setSheetOpen(false);
  };

  const startEdit = (charge: Charge) => {
    setEditingCharge(charge);
    setForm({
      name: charge.name,
      type: charge.type,
      amount: String(charge.amount),
      min: String(charge.min || ''),
      max: String(charge.max || ''),
    });
    setSheetOpen(true);
  };

  const handleToggle = (id: string) => {
    saveCharges(charges.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleDelete = (id: string) => {
    saveCharges(charges.filter(c => c.id !== id));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Shipping"
          titlePart2="Charges"
          badgeText="Logistics Command Center"
          subtitle="Configure flat, weight-based, and value-based shipping rates."

          actions={
            <Button onClick={() => { setEditingCharge(null); setForm({ name: '', type: 'flat', amount: '', min: '', max: '' }); setSheetOpen(true); }} className="rounded-md gap-2 bg-primary text-white hover:bg-primary/95 shadow-sm shadow-[#14b8a6]/10 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Charge Rule
            </Button>
          }
        />

        <AppDrawer
          title={editingCharge ? "Edit Shipping Charge" : "Add Shipping Charge"}
          subtitle={editingCharge ? "Modify shipping rate rules." : "Create a new shipping rate rule."}
          open={sheetOpen}
          onClose={(open) => { setSheetOpen(open); if (!open) setEditingCharge(null); }}
          onSubmit={handleAdd}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Rule Name *</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Delivery" className="h-11 rounded-lg" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Charge Type *</Label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ChargeType })}
                className="w-full h-11 rounded-lg border border-border/60 bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none">
                {Object.entries(typeConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Amount (₹)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 49" className="h-11 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Min Value / Weight</Label>
                <Input type="number" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} placeholder="0" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Max Value / Weight</Label>
                <Input type="number" value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} placeholder="Unlimited" className="h-11 rounded-lg" />
              </div>
            </div>
          </div>
        </AppDrawer>

        <div className="relative max-w-sm group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="Search charge rules..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-10 rounded-md border-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const cfg = typeConfig[c.type];
            const TypeIcon = cfg.icon;
            return (
              <Card key={c.id} className="border-border/40 bg-card rounded-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-9 w-9 rounded-md flex items-center justify-center ${cfg.color}`}>
                        <TypeIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{c.name}</p>
                        <Badge className={`text-[10px] rounded-full px-2 border-transparent mt-0.5 ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                    </div>
                    <p className="text-lg font-black text-foreground">
                      {c.amount === 0 ? <span className="text-emerald-500">FREE</span> : `₹${c.amount}`}
                    </p>
                  </div>
                  {(c.min > 0 || c.max) && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {c.min > 0 && `Min: ₹${c.min}`}{c.max && ` · Max: ${c.max}kg`}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge
                      onClick={() => handleToggle(c.id)}
                      className={`text-[10px] rounded-full px-2.5 border-transparent font-semibold cursor-pointer transition-all hover:scale-105 ${c.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted/60" onClick={() => startEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-rose-500/10 text-rose-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
