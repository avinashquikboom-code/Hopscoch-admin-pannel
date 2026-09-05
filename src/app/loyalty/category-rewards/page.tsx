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
import { API_BASE, authHeaders } from '@/lib/api';
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
  Plus,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function CategoryRewardsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [forbiddenError, setForbiddenError] = useState(false);

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [editForm, setEditForm] = useState({
    categoryId: 0,
    overrideGlobalReward: true,
    rewardPointsEarned: 10,
    maxRedeemablePoints: 500,
    rewardMultiplier: 1.0,
    allowRewardRedemption: true,
    allowRewardEarning: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    setForbiddenError(false);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/category-rewards`, {
        headers: authHeaders(),
      });

      if (res.status === 403) {
        setForbiddenError(true);
        setCategories([]);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching category rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setCreateMode(true);
    const firstCat = categories[0];
    setSelectedCategory(firstCat || null);
    setEditForm({
      categoryId: firstCat?.id || 0,
      overrideGlobalReward: true,
      rewardPointsEarned: 25,
      maxRedeemablePoints: 500,
      rewardMultiplier: 1.2,
      allowRewardRedemption: true,
      allowRewardEarning: true,
    });
    setMessage(null);
    setSheetOpen(true);
  };

  const openEdit = (cat: any) => {
    setCreateMode(false);
    setSelectedCategory(cat);
    setEditForm({
      categoryId: cat.id,
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

  const handleToggleStatus = async (cat: any) => {
    const nextState = !cat.overrideGlobalReward;
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, overrideGlobalReward: nextState } : c))
    );

    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/category-rewards/${cat.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ overrideGlobalReward: nextState }),
      });
      const json = await res.json();
      if (!json.success) {
        fetchCategories();
      }
    } catch {
      fetchCategories();
    }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Reset reward rule for "${cat.name}" to global system defaults?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/category-rewards/${cat.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        fetchCategories();
      } else {
        alert(json.message || 'Failed to reset category reward rule');
      }
    } catch (err: any) {
      alert(err.message || 'Server error while resetting category reward rule');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const url = createMode
        ? `${API_BASE}/loyalty/admin/category-rewards`
        : `${API_BASE}/loyalty/admin/category-rewards/${selectedCategory.id}`;
      const method = createMode ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: createMode
            ? 'Category reward rule created successfully!'
            : 'Category reward rule updated successfully!',
        });
        fetchCategories();
        setTimeout(() => {
          setSheetOpen(false);
        }, 1200);
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to save category rule' });
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
        header: 'Status & Mode',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={Boolean(row.original.overrideGlobalReward)}
              onCheckedChange={() => handleToggleStatus(row.original)}
              className="data-[state=checked]:bg-teal-500"
            />
            {row.original.overrideGlobalReward ? (
              <Badge className="bg-teal-500/15 text-teal-600 border-teal-500/30 font-bold text-[11px]">
                Active Override
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[11px]">
                Global Default
              </Badge>
            )}
          </div>
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
          <div className="text-right flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
              className="h-8 text-xs font-semibold border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
            >
              <Edit className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            {row.original.overrideGlobalReward && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(row.original)}
                title="Reset to Global Default"
                className="h-8 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [categories]
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
      <div className="space-y-8 p-4 sm:p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Category Reward"
          titlePart2="Rules"
          badgeText="TIER 2 PRIORITY RULE"
          subtitle="Set category-wide earn points, maximum redemption limits, and promotional multipliers."
          icon={<FolderTree className="h-8 w-8 text-teal-500" />}
          actions={
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold h-10 px-4 rounded-xl shadow-md shadow-teal-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add / Configure Rule
            </Button>
          }
        />

        {/* 403 Forbidden Alert Banner if user lacks permissions */}
        {forbiddenError && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-sm">
            <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Administrator Permissions Required</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your current account session does not have the required administrator role to modify Category Reward Rules.
                Please sign in using an account with ADMIN role.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
                className="mt-3 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300"
              >
                Retry Request
              </Button>
            </div>
          </div>
        )}

        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-teal-500" /> Category Reward Rules Matrix
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Category rules apply automatically to all products within the category that do not have Tier 1 overrides.
                </CardDescription>
              </div>

              {/* Search input */}
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

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-bold text-xs py-3 whitespace-nowrap">
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
                    <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <FolderTree className="h-4 w-4 animate-bounce text-teal-500" />
                        Loading category reward rules...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 text-xs whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground text-xs">
                      {forbiddenError
                        ? 'No data accessible. Please verify your administrator privileges.'
                        : 'No matching category rules found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
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
                    <span className="text-muted-foreground font-semibold">Rows:</span>
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

        {/* Slide-Over Editor Sheet (Add & Edit) */}
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
                    {createMode ? 'Add Category Reward Rule' : 'Configure Category Rule'}
                  </SheetTitle>
                  <SheetDescription className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {createMode ? 'Assign special reward parameters to a category' : `Category: ${selectedCategory?.name}`}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Form Body */}
            <div className="p-6 space-y-5 flex-1">
              {message && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-sm ${
                    message.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-600 border border-red-500/30'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <form id="category-reward-form" onSubmit={handleSave} className="space-y-5">
                {/* Category Selector (in create mode) */}
                {createMode && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Select Target Category</Label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setEditForm((prev) => ({ ...prev, categoryId: id }));
                        const found = categories.find((c) => c.id === id);
                        if (found) setSelectedCategory(found);
                      }}
                      className="w-full bg-card border border-border/80 rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-teal-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.overrideGlobalReward ? '(Currently Override)' : '(Default)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Override Toggle Box */}
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <Label className="font-extrabold text-xs text-foreground">Enable Category Override</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Overrides global reward rules for all products in this category.
                    </p>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="h-11 px-5 rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                form="category-reward-form"
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold h-11 px-6 rounded-xl shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : createMode ? 'Create Rule' : 'Save Rule'}
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
