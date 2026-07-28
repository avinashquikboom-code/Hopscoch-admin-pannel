'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { API_BASE, getImageUrl } from '@/lib/api';
import {
  Package,
  Edit,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function ProductRewardsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

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

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent font-bold text-xs flex items-center gap-1"
          >
            Product
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              {p.thumbnailUrl ? (
                <img src={getImageUrl(p.thumbnailUrl)} alt="" className="h-9 w-9 rounded-lg object-cover border border-border/50 shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                  P
                </div>
              )}
              <div>
                <div className="text-foreground font-bold text-xs">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">ID: #{p.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-muted-foreground">
            {row.original.category?.name || 'Uncategorized'}
          </span>
        ),
      },
      {
        accessorKey: 'basePrice',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent font-bold text-xs flex items-center gap-1"
          >
            Price (₹)
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold">
            ₹{Number(row.original.basePrice || 0).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'rewardPoints',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent font-bold text-xs flex items-center gap-1"
          >
            Reward Earned
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-amber-500/30 font-bold">
            {row.original.rewardPoints || 0} Pts
          </Badge>
        ),
      },
      {
        accessorKey: 'maxRedeemablePoints',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent font-bold text-xs flex items-center gap-1"
          >
            Max Redeemable
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-purple-600">
            {row.original.maxRedeemablePoints || 0} Pts
          </span>
        ),
      },
      {
        accessorKey: 'rewardMultiplier',
        header: 'Multiplier',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-teal-600">
            {row.original.rewardMultiplier ? `${row.original.rewardMultiplier}x` : '1.0x'}
          </span>
        ),
      },
      {
        id: 'overrideStatus',
        header: 'Override Mode',
        cell: ({ row }) => (
          row.original.overrideGlobalReward ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[11px]">
              Active Override
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-[11px]">
              Global Default
            </Badge>
          )
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
              className="h-8 text-xs font-semibold border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Edit className="mr-1 h-3.5 w-3.5" /> Edit Rule
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Product Reward"
          titlePart2="Override Matrix"
          badgeText="TIER 1 PRIORITY RULE"
          subtitle="Configure explicit reward points, max redemption limits, multipliers, and earning toggles for individual products."
          icon={<Package className="h-8 w-8 text-amber-500" />}
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" /> Catalog Product Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Search, sort, and customize points rules for individual inventory items.
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
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-bold text-xs">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground text-xs">
                      {loading ? 'Loading catalog products...' : 'No products found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* TanStack Table Pagination Controls */}
            {products.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 text-xs">
                <div className="text-muted-foreground">
                  Page <span className="font-bold text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                  <span className="font-bold text-foreground">{table.getPageCount() || 1}</span> ({products.length} total products)
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="h-8 rounded-md border border-border/80 bg-card px-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size} per page
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slide-Over Editor Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg w-full bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl p-0 overflow-y-auto flex flex-col">
            {/* Header Banner */}
            <SheetHeader className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-purple-600/15 to-amber-600/20 p-6 pr-12 border-b border-border/60 text-left space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0 shadow-md">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-extrabold text-foreground tracking-tight">
                    Edit Product Reward Rule
                  </SheetTitle>
                  <SheetDescription className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {selectedProduct?.name} <span className="text-muted-foreground font-normal">(ID: #{selectedProduct?.id})</span>
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

              <form id="product-reward-form" onSubmit={handleSave} className="space-y-5">
                {/* Override Toggle Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <Label className="font-extrabold text-xs text-foreground">Enable Priority Override</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Overrides global & category point rules specifically for this product.</p>
                  </div>
                  <Switch
                    checked={editForm.overrideGlobalReward}
                    onCheckedChange={(val) => setFormState('overrideGlobalReward', val)}
                  />
                </div>

                {/* Points Configuration Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Reward Points Parameters
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Reward Points Earned</Label>
                    <Input
                      type="number"
                      value={editForm.rewardPoints}
                      onChange={(e) => setFormState('rewardPoints', Number(e.target.value))}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-amber-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Fixed reward points customer earns per item purchase</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Maximum Redeemable Points</Label>
                    <Input
                      type="number"
                      value={editForm.maxRedeemablePoints}
                      onChange={(e) => setFormState('maxRedeemablePoints', Number(e.target.value))}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-purple-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Max points customer can redeem on single product checkout</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Reward Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.rewardMultiplier}
                      onChange={(e) => setFormState('rewardMultiplier', Number(e.target.value))}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-teal-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Multiplier boost (e.g. 2.0 = 2x Double Points)</p>
                  </div>
                </div>

                {/* Permission Toggles Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Policy & Permission Controls
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/40">
                    <div>
                      <Label className="font-bold text-xs">Allow Earning Points</Label>
                      <p className="text-[10px] text-muted-foreground">Permit point accumulation on this item</p>
                    </div>
                    <Switch
                      checked={editForm.allowRewardEarning}
                      onCheckedChange={(val) => setFormState('allowRewardEarning', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/40">
                    <div>
                      <Label className="font-bold text-xs">Allow Points Redemption</Label>
                      <p className="text-[10px] text-muted-foreground">Permit redeeming points discount on this item</p>
                    </div>
                    <Switch
                      checked={editForm.allowRewardRedemption}
                      onCheckedChange={(val) => setFormState('allowRewardRedemption', val)}
                    />
                  </div>
                </div>

                {/* Expiry Date Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-1.5">
                  <Label className="text-xs font-bold">Rule Expiration Date (Optional)</Label>
                  <Input
                    type="date"
                    value={editForm.rewardExpiryDate}
                    onChange={(e) => setFormState('rewardExpiryDate', e.target.value)}
                    className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">Leave empty for non-expiring permanent override rule</p>
                </div>
              </form>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-md p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="h-11 px-5 rounded-xl font-semibold">
                Cancel
              </Button>
              <Button form="product-reward-form" type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]">
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving Rule...' : 'Save Product Rule'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
