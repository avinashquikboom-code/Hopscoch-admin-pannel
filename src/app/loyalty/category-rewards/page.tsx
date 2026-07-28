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
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE } from '@/lib/api';
import {
  FolderTree,
  Edit,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CategoryRewardsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

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

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Category Name <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-bold text-xs text-foreground flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-teal-500 shrink-0" /> {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: 'overrideGlobalReward',
        header: 'Override Mode',
        cell: ({ row }) =>
          row.original.overrideGlobalReward ? (
            <Badge className="bg-teal-500/15 text-teal-600 border-teal-500/30 font-bold">
              Category Override
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Global Default
            </Badge>
          ),
      },
      {
        accessorKey: 'rewardPointsEarned',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Earn Points <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold">
            {row.original.rewardPointsEarned || 0} Pts
          </Badge>
        ),
      },
      {
        accessorKey: 'maxRedeemablePoints',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Max Redeemable <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            {row.original.maxRedeemablePoints || 0} Pts
          </span>
        ),
      },
      {
        accessorKey: 'rewardMultiplier',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Multiplier <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
            {row.original.rewardMultiplier || 1.0}x
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right font-bold text-xs">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
              className="h-8 text-xs font-semibold border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
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
    data: categories,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Category Reward"
          titlePart2="Matrix"
          badgeText="TIER 2 PRIORITY RULE"
          subtitle="Set category-wide earn points, maximum redemption limits, and multipliers."
          icon={<FolderTree className="h-8 w-8 text-teal-500" />}
        />

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-teal-500" /> Category Reward Rules
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Category rules apply automatically to all products within the category that do not have Tier 1 overrides.
                </CardDescription>
              </div>

              {/* TanStack Table Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9 text-xs bg-muted/20 border-border/60 focus:border-teal-500 rounded-xl"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-bold text-xs py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground text-xs font-semibold">
                      Loading catalog categories...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground text-xs">
                      No matching category rules found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* TanStack Table Pagination Controls */}
            {categories.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 bg-muted/10 text-xs">
                <div className="text-muted-foreground font-semibold">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} categories
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-semibold">Rows per page:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      className="bg-card border border-border/60 rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-teal-500"
                    >
                      {[10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 font-bold text-foreground">
                      {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slide-Over Editor Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg w-full bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl p-0 overflow-y-auto flex flex-col">
            {/* Header Banner */}
            <SheetHeader className="relative overflow-hidden bg-gradient-to-r from-teal-500/20 via-emerald-600/15 to-teal-600/20 p-6 pr-12 border-b border-border/60 text-left space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-500 flex items-center justify-center shrink-0 shadow-md">
                  <FolderTree className="h-6 w-6" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-extrabold text-foreground tracking-tight">
                    Configure Category Rule
                  </SheetTitle>
                  <SheetDescription className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1">
                    Category: <strong>{selectedCategory?.name}</strong>
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

              <form id="category-reward-form" onSubmit={handleSave} className="space-y-5">
                {/* Override Toggle Box */}
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <Label className="font-extrabold text-xs text-foreground">Enable Category Override</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Overrides global reward rules for all products in this category.</p>
                  </div>
                  <Switch
                    checked={editForm.overrideGlobalReward}
                    onCheckedChange={(val) => setFormState('overrideGlobalReward', val)}
                  />
                </div>

                {/* Points Configuration Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <FolderTree className="h-4 w-4 text-teal-500" /> Category Point Parameters
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Reward Points Earned</Label>
                    <Input
                      type="number"
                      value={editForm.rewardPointsEarned}
                      onChange={(e) => setFormState('rewardPointsEarned', Number(e.target.value))}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-teal-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Points earned on items in this category</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Maximum Redeemable Points</Label>
                    <Input
                      type="number"
                      value={editForm.maxRedeemablePoints}
                      onChange={(e) => setFormState('maxRedeemablePoints', Number(e.target.value))}
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-purple-500"
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
                      className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-teal-500"
                    />
                    <p className="text-[11px] text-muted-foreground">Category point multiplier (e.g. 1.5x)</p>
                  </div>
                </div>

                {/* Permission Toggles Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Category Policies
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/40">
                    <div>
                      <Label className="font-bold text-xs">Allow Earning Points</Label>
                      <p className="text-[10px] text-muted-foreground">Permit point earning on items in this category</p>
                    </div>
                    <Switch
                      checked={editForm.allowRewardEarning}
                      onCheckedChange={(val) => setFormState('allowRewardEarning', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-card/60 border border-border/40">
                    <div>
                      <Label className="font-bold text-xs">Allow Points Redemption</Label>
                      <p className="text-[10px] text-muted-foreground">Permit point redemption on items in this category</p>
                    </div>
                    <Switch
                      checked={editForm.allowRewardRedemption}
                      onCheckedChange={(val) => setFormState('allowRewardRedemption', val)}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-md p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="h-11 px-5 rounded-xl font-semibold">
                Cancel
              </Button>
              <Button form="category-reward-form" type="submit" disabled={saving} className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]">
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving Category Rule...' : 'Save Category Rule'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );

  function setFormState(key: string, val: any) {
    setEditForm((prev) => ({ ...prev, [key]: val }));
  }
}
