'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FolderTree, Edit, Save, CheckCircle2, AlertCircle } from 'lucide-react';

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
        setTimeout(() => setSheetOpen(false), 800);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update category reward' });
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
          title="Category Reward Overrides"
          description="Configure reward points, max redeemable limits, and multipliers per category (e.g. Shoes vs Accessories)."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-purple-500" /> Category List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Override Active</TableHead>
                  <TableHead>Earn Points</TableHead>
                  <TableHead>Max Redeemable</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs text-foreground">{c.name}</TableCell>
                      <TableCell className="text-xs">
                        {c.overrideGlobalReward ? (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-300">Active Override</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Inheriting Global</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          {c.rewardPointsEarned || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {c.maxRedeemablePoints || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.rewardMultiplier || 1.0}x</TableCell>
                      <TableCell>
                        <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Category Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[500px]">
            <SheetHeader>
              <SheetTitle>Configure Category Reward Rule</SheetTitle>
              <SheetDescription>
                Category: <strong>{selectedCategory?.name}</strong>
              </SheetDescription>
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
              <div className="flex items-center justify-between border-b pb-3">
                <Label>Override Global Rules</Label>
                <Switch
                  checked={editForm.overrideGlobalReward}
                  onCheckedChange={(val) => setEditForm({ ...editForm, overrideGlobalReward: val })}
                />
              </div>

              <div>
                <Label>Category Points Earned</Label>
                <Input
                  type="number"
                  value={editForm.rewardPointsEarned}
                  onChange={(e) => setEditForm({ ...editForm, rewardPointsEarned: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Category Max Redeemable Points</Label>
                <Input
                  type="number"
                  value={editForm.maxRedeemablePoints}
                  onChange={(e) => setEditForm({ ...editForm, maxRedeemablePoints: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Reward Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.rewardMultiplier}
                  onChange={(e) => setEditForm({ ...editForm, rewardMultiplier: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <Label>Allow Reward Earning</Label>
                <Switch
                  checked={editForm.allowRewardEarning}
                  onCheckedChange={(val) => setEditForm({ ...editForm, allowRewardEarning: val })}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <Label>Allow Reward Redemption</Label>
                <Switch
                  checked={editForm.allowRewardRedemption}
                  onCheckedChange={(val) => setEditForm({ ...editForm, allowRewardRedemption: val })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Rule'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
