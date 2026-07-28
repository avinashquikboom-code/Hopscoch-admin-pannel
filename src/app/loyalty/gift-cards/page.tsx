'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Gift,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function GiftCardsAdminPage() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

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
        setSheetOpen(false);
        setForm({ code: '', amount: 1000, expiryDays: 365 });
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to generate gift card' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setSaving(false);
    }
  };

  // TanStack Table Columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Card Code <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-500 shrink-0" /> {row.original.code}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Initial Balance <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-extrabold text-foreground">
            ₹{Number(row.original.amount).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Current Balance <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ₹{Number(row.original.balance).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expiry Date',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-semibold">
            {row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}
          </span>
        ),
      },
      {
        id: 'redeemedBy',
        header: 'Redeemed By',
        cell: ({ row }) =>
          row.original.redeemedBy ? (
            <span className="text-xs font-semibold text-foreground">
              User #{row.original.redeemedById} ({row.original.redeemedBy.firstName || row.original.redeemedBy.email})
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        id: 'status',
        header: () => <div className="text-right font-bold text-xs">Status</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.isRedeemed ? (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                Redeemed
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-bold text-[10px]">
                Active
              </Badge>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: giftCards,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

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

        {/* Message banner outside sheet */}
        {message && !sheetOpen && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" /> Gift Cards Audit Ledger
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Vouchers issued and customer redemption status.
                </CardDescription>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search codes, amounts..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9 text-xs bg-muted/20 border-border/60 focus:border-amber-500 rounded-xl"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="font-bold text-xs py-3">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground text-xs font-semibold">
                      Loading gift cards...
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
                      No gift cards found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {giftCards.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 bg-muted/10 text-xs">
                <div className="text-muted-foreground font-semibold">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} vouchers
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-semibold">Rows per page:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      className="bg-card border border-border/60 rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-500"
                    >
                      {[10, 20, 50].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 font-bold text-foreground">
                      {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Gift Card Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-lg w-full bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl p-0 overflow-y-auto flex flex-col">
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

            <div className="p-6 space-y-5 flex-1">
              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-sm ${message.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-600 border border-red-500/30'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {message.text}
                </div>
              )}
              <form id="gift-card-form" onSubmit={handleCreate} className="space-y-5">
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
