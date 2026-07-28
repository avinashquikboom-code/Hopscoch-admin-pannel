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
import { Package, Edit, Search, Save, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProductRewardsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editForm, setEditForm] = useState({
    enableReward: true,
    overrideGlobalReward: false,
    overrideCategoryReward: false,
    rewardPoints: 0,
    maxRedeemablePoints: 0,
    rewardMultiplier: 1.0,
    allowRewardRedemption: true,
    allowRewardEarning: true,
    campaignReward: 0,
    rewardExpiryDate: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/product-rewards?search=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const openEdit = (product: any) => {
    setSelectedProduct(product);
    setEditForm({
      enableReward: product.enableReward !== false,
      overrideGlobalReward: Boolean(product.overrideGlobalReward),
      overrideCategoryReward: Boolean(product.overrideCategoryReward),
      rewardPoints: product.rewardPoints || 0,
      maxRedeemablePoints: product.maxRedeemablePoints || 0,
      rewardMultiplier: Number(product.rewardMultiplier || 1.0),
      allowRewardRedemption: product.allowRewardRedemption !== false,
      allowRewardEarning: product.allowRewardEarning !== false,
      campaignReward: product.campaignReward || 0,
      rewardExpiryDate: product.rewardExpiryDate ? new Date(product.rewardExpiryDate).toISOString().split('T')[0] : '',
    });
    setMessage(null);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/product-rewards/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Product reward rule updated successfully!' });
        fetchProducts();
        setTimeout(() => setSheetOpen(false), 800);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update product reward' });
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
          title="Product Reward Configuration"
          description="Override points earned, maximum redeemable points, multipliers, and reward rules per product."
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" /> Products List
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Reward Earned</TableHead>
                  <TableHead>Max Redeemable</TableHead>
                  <TableHead>Override Mode</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-2">
                          {p.thumbnailUrl && (
                            <img src={p.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover border" />
                          )}
                          <div>
                            <div className="text-foreground font-semibold">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">ID: #{p.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{p.category?.name || '—'}</TableCell>
                      <TableCell className="text-xs font-semibold">₹{Number(p.basePrice).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          {p.rewardPoints || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {p.maxRedeemablePoints || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.overrideGlobalReward ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300">Product Override</Badge>
                        ) : p.overrideCategoryReward ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-300">Category Override</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Global Rule</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="xs" variant="outline" onClick={() => openEdit(p)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Product Reward Configuration Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[450px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> Reward Configuration
              </SheetTitle>
              <SheetDescription>
                Configure reward points for <strong>{selectedProduct?.name}</strong>.
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
                <Label>Enable Product Rewards</Label>
                <Switch
                  checked={editForm.enableReward}
                  onCheckedChange={(val) => setEditForm({ ...editForm, enableReward: val })}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <Label>Override Global Rules</Label>
                <Switch
                  checked={editForm.overrideGlobalReward}
                  onCheckedChange={(val) => setEditForm({ ...editForm, overrideGlobalReward: val })}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <Label>Override Category Rules</Label>
                <Switch
                  checked={editForm.overrideCategoryReward}
                  onCheckedChange={(val) => setEditForm({ ...editForm, overrideCategoryReward: val })}
                />
              </div>

              <div>
                <Label>Reward Points Earned on Purchase</Label>
                <Input
                  type="number"
                  value={editForm.rewardPoints}
                  onChange={(e) => setEditForm({ ...editForm, rewardPoints: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Maximum Redeemable Points for Product</Label>
                <Input
                  type="number"
                  value={editForm.maxRedeemablePoints}
                  onChange={(e) => setEditForm({ ...editForm, maxRedeemablePoints: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Reward Points Multiplier</Label>
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

              <div>
                <Label>Campaign Bonus Points</Label>
                <Input
                  type="number"
                  value={editForm.campaignReward}
                  onChange={(e) => setEditForm({ ...editForm, campaignReward: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Reward Rule Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={editForm.rewardExpiryDate}
                  onChange={(e) => setEditForm({ ...editForm, rewardExpiryDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
