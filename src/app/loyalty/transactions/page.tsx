'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { API_BASE } from '@/lib/api';
import {
  RefreshCcw,
  Wallet,
  Award,
  Receipt,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function MasterTransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [walletSorting, setWalletSorting] = useState<SortingState>([]);
  const [walletFilter, setWalletFilter] = useState('');
  const [pointsSorting, setPointsSorting] = useState<SortingState>([]);
  const [pointsFilter, setPointsFilter] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/transactions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const walletTxns: any[] = data?.wallet?.transactions || [];
  const pointsTxns: any[] = data?.points?.transactions || [];

  // Derived stats
  const totalWalletCredits = walletTxns.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalWalletDebits = walletTxns.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalPointsAdded = pointsTxns.filter((t) => Number(t.points) > 0).reduce((s, t) => s + Number(t.points), 0);
  const totalPointsDeducted = pointsTxns.filter((t) => Number(t.points) < 0).reduce((s, t) => s + Math.abs(Number(t.points)), 0);

  // Wallet columns
  const walletColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Type <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10px]">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Amount <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const amt = Number(row.original.amount);
        return (
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${amt >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-xs font-extrabold ${amt >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {amt >= 0 ? `+₹${amt.toFixed(2)}` : `-₹${Math.abs(amt).toFixed(2)}`}
            </span>
          </div>
        );
      },
    },
    {
      id: 'description',
      accessorFn: (row) => row.description || row.referenceId || '',
      header: 'Note',
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px] block">
          {row.original.description || row.original.referenceId || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Time <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-[10px] text-muted-foreground font-semibold">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ], []);

  // Points columns
  const pointsColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Event <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold text-[10px]">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'points',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Points <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const pts = Number(row.original.points);
        return (
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${pts >= 0 ? 'bg-amber-500' : 'bg-purple-500'}`} />
            <span className={`text-xs font-extrabold ${pts >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {pts >= 0 ? `+${pts} Pts` : `${pts} Pts`}
            </span>
          </div>
        );
      },
    },
    {
      id: 'reason',
      accessorFn: (row) => row.reason || (row.orderId ? `Order #${row.orderId}` : ''),
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px] block">
          {row.original.reason || (row.original.orderId ? `Order #${row.original.orderId}` : '—')}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
          Time <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-[10px] text-muted-foreground font-semibold">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ], []);

  const walletTable = useReactTable({
    data: walletTxns,
    columns: walletColumns,
    state: { sorting: walletSorting, globalFilter: walletFilter },
    onSortingChange: setWalletSorting,
    onGlobalFilterChange: setWalletFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const pointsTable = useReactTable({
    data: pointsTxns,
    columns: pointsColumns,
    state: { sorting: pointsSorting, globalFilter: pointsFilter },
    onSortingChange: setPointsSorting,
    onGlobalFilterChange: setPointsFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1500px] mx-auto">
        <PageHeader
          titlePart1="Master Loyalty"
          titlePart2="& Wallet Ledger"
          badgeText="SYSTEM AUDIT LOGS"
          subtitle="Real-time audit log statements of customer wallet money transactions and point adjustments."
          icon={<Receipt className="h-8 w-8 text-emerald-500" />}
          actions={
            <Button onClick={fetchTransactions} disabled={loading} className="bg-card hover:bg-muted text-foreground border border-border/80 shadow-sm">
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
            </Button>
          }
        />

        {/* Summary Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Wallet Credits',
              value: `₹${totalWalletCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              icon: <IndianRupee className="h-5 w-5" />,
              color: 'emerald',
              count: walletTxns.filter((t) => Number(t.amount) > 0).length,
            },
            {
              label: 'Wallet Debits',
              value: `₹${totalWalletDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              icon: <TrendingUp className="h-5 w-5" />,
              color: 'red',
              count: walletTxns.filter((t) => Number(t.amount) < 0).length,
            },
            {
              label: 'Points Credited',
              value: `${totalPointsAdded.toLocaleString()} Pts`,
              icon: <Award className="h-5 w-5" />,
              color: 'amber',
              count: pointsTxns.filter((t) => Number(t.points) > 0).length,
            },
            {
              label: 'Points Deducted',
              value: `${totalPointsDeducted.toLocaleString()} Pts`,
              icon: <Activity className="h-5 w-5" />,
              color: 'purple',
              count: pointsTxns.filter((t) => Number(t.points) < 0).length,
            },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className={`text-lg font-extrabold mt-1 text-${stat.color}-600 dark:text-${stat.color}-400 truncate`}>
                      {loading ? <span className="inline-block h-5 w-20 rounded bg-muted animate-pulse" /> : stat.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{loading ? '—' : `${stat.count} transactions`}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 shrink-0 ml-2`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two Table Panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Wallet Table */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/12 via-teal-500/8 to-emerald-600/12 p-5 border-b border-border/50">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_70%)]" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Wallet Statement Ledger</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">Credits, debits, refunds, and order payment deductions</CardDescription>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search wallet transactions..."
                    value={walletFilter}
                    onChange={(e) => setWalletFilter(e.target.value)}
                    className="pl-8 h-8 text-xs bg-card/60 border-border/60 focus:border-emerald-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  {walletTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-muted/20 hover:bg-muted/20">
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
                      <TableCell colSpan={walletColumns.length} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                        <RefreshCcw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground/50" />
                        Loading wallet transactions...
                      </TableCell>
                    </TableRow>
                  ) : walletTable.getRowModel().rows?.length ? (
                    walletTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-emerald-500/3 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3 text-xs">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={walletColumns.length} className="text-center py-10 text-xs text-muted-foreground">
                        No wallet transactions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {walletTxns.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/40 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {walletTable.getFilteredRowModel().rows.length} of {walletTxns.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => walletTable.previousPage()} disabled={!walletTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {walletTable.getState().pagination.pageIndex + 1} / {walletTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => walletTable.nextPage()} disabled={!walletTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points Table */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/12 via-orange-500/8 to-amber-600/12 p-5 border-b border-border/50">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.07),transparent_70%)]" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Reward Points History</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">Points earned on orders, event bonuses, and order redemption logs</CardDescription>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search points history..."
                    value={pointsFilter}
                    onChange={(e) => setPointsFilter(e.target.value)}
                    className="pl-8 h-8 text-xs bg-card/60 border-border/60 focus:border-amber-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  {pointsTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="bg-muted/20 hover:bg-muted/20">
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
                      <TableCell colSpan={pointsColumns.length} className="text-center py-10 text-xs text-muted-foreground font-semibold">
                        <RefreshCcw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground/50" />
                        Loading reward points history...
                      </TableCell>
                    </TableRow>
                  ) : pointsTable.getRowModel().rows?.length ? (
                    pointsTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-amber-500/3 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3 text-xs">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={pointsColumns.length} className="text-center py-10 text-xs text-muted-foreground">
                        No reward point transactions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {pointsTxns.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/40 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {pointsTable.getFilteredRowModel().rows.length} of {pointsTxns.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => pointsTable.previousPage()} disabled={!pointsTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {pointsTable.getState().pagination.pageIndex + 1} / {pointsTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => pointsTable.nextPage()} disabled={!pointsTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
}
