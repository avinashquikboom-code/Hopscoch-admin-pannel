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
import { API_BASE, getImageUrl } from '@/lib/api';
import { Package, Edit, Search, Save, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update product rule' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  const setFormState = (key: string, val: any) => {
    setEditForm((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-amber-600/15 p-8 border border-border/60 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/loyalty" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors mb-2">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Loyalty Hub
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Package className="h-7 w-7 text-amber-500" /> Product Reward Override Matrix
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Configure explicit reward points, max redemption limits, multipliers, and earning toggles for individual products (Tier 1 Priority).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
              <ShieldCheck className="h-4 w-4" /> Tier 1 Priority Rule
            </span>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" /> Catalog Product Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Search and customize points rules for individual inventory items.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-card border-border/80"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Product</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Price (₹)</TableHead>
                  <TableHead className="font-bold">Reward Earned</TableHead>
                  <TableHead className="font-bold">Max Redeemable</TableHead>
                  <TableHead className="font-bold">Override Mode</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-3">
                          {p.thumbnailUrl ? (
                            <img src={getImageUrl(p.thumbnailUrl)} alt="" className="h-9 w-9 rounded-lg object-cover border border-border/50 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                              P
                            </div>
                          )}
                          <div>
                            <div className="text-foreground font-bold">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">ID: #{p.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{p.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell className="text-xs font-bold">₹{Number(p.basePrice).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
                          {p.rewardPoints || 0} Pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-purple-600">
                        {p.maxRedeemablePoints || 0} Pts
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.overrideGlobalReward ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                            Active Override
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Global Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="h-8 text-xs font-semibold border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                          <Edit className="mr-1 h-3.5 w-3.5" /> Edit Rule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      {loading ? 'Loading catalog products...' : 'No products found.'}
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
                <Package className="h-5 w-5 text-amber-500" /> Edit Product Reward Rule
              </SheetTitle>
              <SheetDescription className="text-xs">
                {selectedProduct?.name} (ID: #{selectedProduct?.id})
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
                  <Label className="font-bold text-xs">Enable Product Reward Override</Label>
                  <p className="text-[11px] text-muted-foreground">Overrides global & category reward rules for this product.</p>
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
                  value={editForm.rewardPoints}
                  onChange={(e) => setFormState('rewardPoints', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Fixed points earned when buying this product</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Maximum Redeemable Points</Label>
                <Input
                  type="number"
                  value={editForm.maxRedeemablePoints}
                  onChange={(e) => setFormState('maxRedeemablePoints', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Max points customer can spend on this product</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Reward Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.rewardMultiplier}
                  onChange={(e) => setFormState('rewardMultiplier', Number(e.target.value))}
                  className="bg-card border-border/80 font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">e.g. 2.0 = 2x Double Points multiplier</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <Label className="font-bold text-xs">Allow Earning Points</Label>
                  <p className="text-[11px] text-muted-foreground">Allows customers to earn points on this item.</p>
                </div>
                <Switch
                  checked={editForm.allowRewardEarning}
                  onCheckedChange={(val) => setFormState('allowRewardEarning', val)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div>
                  <Label className="font-bold text-xs">Allow Points Redemption</Label>
                  <p className="text-[11px] text-muted-foreground">Allows redeeming points for discount on this item.</p>
                </div>
                <Switch
                  checked={editForm.allowRewardRedemption}
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
