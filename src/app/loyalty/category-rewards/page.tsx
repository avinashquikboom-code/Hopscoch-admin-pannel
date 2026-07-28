'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { FolderTree, Edit, Save, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CategoryRewardsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editForm, setEditForm] = useState({
    overrideGlobalReward: false,
    rewardPointsEarned: 0,
    maxRedeemablePoints: 0,
    rewardMultiplier: 1.0,
    allowRewardRedemption: true,
    allowRewardEarning: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/category-rewards`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openEdit = (cat: any) => {
    setSelectedCategory(cat);
    setEditForm({
      overrideGlobalReward: Boolean(cat.overrideGlobalReward),
      rewardPointsEarned: cat.rewardPointsEarned || 0,
      maxRedeemablePoints: cat.maxRedeemablePoints || 0,
      rewardMultiplier: Number(cat.rewardMultiplier || 1.0),
      allowRewardRedemption: cat.allowRewardRedemption !== false,
      allowRewardEarning: cat.allowRewardEarning !== false,
    });
    setMessage(null);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/category-rewards/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Category reward rule updated successfully!' });
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update category rule' });
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500/15 via-emerald-600/10 to-teal-600/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-teal-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <FolderTree className="h-7 w-7 text-teal-500" /> Category Reward Matrix
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Set category-wide earn points, maximum redemption limits, and multipliers (Tier 2 Priority Rule).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-600 border border-teal-500/30 shrink-0">
              <ShieldCheck className="h-4 w-4" /> Tier 2 Priority Rule
            </span>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-teal-500" /> Category Reward Rules
            </CardTitle>
            <CardDescription className="text-xs">
              Category rules apply automatically to all products within the category that do not have Tier 1 overrides.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Category Name</TableHead>
                  <TableHead className="font-bold">Override Mode</TableHead>
                  <TableHead className="font-bold">Earn Points</TableHead>
                  <TableHead className="font-bold">Max Redeemable</TableHead>
                  <TableHead className="font-bold">Multiplier</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-xs text-foreground flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-teal-500" /> {c.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.overrideGlobalReward ? (
                          <Badge className="bg-teal-500/15 text-teal-600 border-teal-500/30 font-bold">
                            Category Override
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Global Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                          {c.rewardPointsEarned || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-purple-600">
                        {c.maxRedeemablePoints || 0} Pts
                      </TableCell>
                      <TableCell className="text-xs font-bold text-teal-600">{c.rewardMultiplier || 1.0}x</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="h-8 text-xs font-semibold border-teal-500/30 text-teal-600 hover:bg-teal-500/10">
                          <Edit className="mr-1 h-3.5 w-3.5" /> Edit Rule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      {loading ? 'Loading catalog categories...' : 'No categories found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Slide-Over Editor Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader className="border-b border-border/40 pb-4">
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-teal-500" /> Configure Category Rule
              </SheetTitle>
              <SheetDescription className="text-xs">
                Category: <strong>{selectedCategory?.name}</strong>
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

            <form onSubmit={handleSave} className="space-y-5 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <Label className="font-bold text-xs">Enable Category Override</Label>
                  <p className="text-[11px] text-muted-foreground">Overrides global reward rules for this category.</p>
                </div>
                <Switch
                  checked={editForm.overrideGlobalReward}
                  onCheckedChange={(val) => setFormState('overrideGlobalReward', val)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Reward Points Earned</Label>
                <Input
                  type="number"
                  value={editForm.rewardPointsEarned}
                  onChange={(e) => setFormState('rewardPointsEarned', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Points earned on items in this category</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Maximum Redeemable Points</Label>
                <Input
                  type="number"
                  value={editForm.maxRedeemablePoints}
                  onChange={(e) => setFormState('maxRedeemablePoints', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Max points redeemable on items in this category</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category Reward Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.rewardMultiplier}
                  onChange={(e) => setFormState('rewardMultiplier', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Category point multiplier (e.g. 1.5x)</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <Label className="font-bold text-xs">Allow Earning Points</Label>
                  <p className="text-[11px] text-muted-foreground">Allow point earning on items in this category.</p>
                </div>
                <Switch
                  checked={editForm.allowRewardEarning}
                  onCheckedChange={(val) => setFormState('allowRewardEarning', val)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <Label className="font-bold text-xs">Allow Points Redemption</Label>
                  <p className="text-[11px] text-muted-foreground">Allow redeeming points on items in this category.</p>
                </div>
                <Switch
                  checked={editForm.allowRewardRedemption}
                  onCheckedChange={(val) => setFormState('allowRewardRedemption', val)}
                />
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold h-10 shadow-md shadow-teal-500/20">
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Category Rule'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );

  function setFormState(key: string, val: any) {
    setEditForm((prev) => ({ ...prev, [key]: val }));
  }
}
