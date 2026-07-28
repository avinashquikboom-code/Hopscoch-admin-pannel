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
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE } from '@/lib/api';
import {
  Users,
  Share2,
  Award,
  UserCheck,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Gift,
} from 'lucide-react';

export default function ReferralAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchReferralStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loyalty/referrals`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const referrals: any[] = data?.referrals || [];

  // TanStack Table columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'referee',
        accessorFn: (row) =>
          `${row.referee?.firstName || ''} ${row.referee?.lastName || ''}`.trim() || row.referee?.email || '',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Customer Name <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const r = row.original;
          const name = `${r.referee?.firstName || ''} ${r.referee?.lastName || ''}`.trim() || r.referee?.email || 'Unknown';
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                {name[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">{name}</div>
                {r.referee?.email && (
                  <div className="text-[10px] text-muted-foreground">{r.referee.email}</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'referralCode',
        accessorFn: (row) => row.referralCode || '',
        header: 'Referral Code Used',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
            {row.original.referralCode || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'pointsEarned',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Points Earned <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold">
            +{row.original.pointsEarned} Pts
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 font-bold hover:bg-transparent text-xs"
          >
            Joined Date <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-semibold">
            {new Date(row.original.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'status',
        header: () => <div className="text-right font-bold text-xs">Status</div>,
        cell: () => (
          <div className="text-right">
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold text-[10px]">
              Completed
            </Badge>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: referrals,
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
          titlePart1="Customer Referral"
          titlePart2="Program"
          badgeText="VIRAL GROWTH ENGINE"
          subtitle="Monitor customer invitation codes, referral completion milestones, and total referral bonus points distributed."
          icon={<Share2 className="h-8 w-8 text-blue-500" />}
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'System Admin Code',
              value: data?.referralCode || 'REF-ADMIN',
              icon: <Share2 className="h-5 w-5" />,
              color: 'blue',
              mono: true,
              sub: 'Default referral code',
            },
            {
              label: 'Total Referrals',
              value: (data?.totalReferrals || 0).toLocaleString(),
              icon: <Users className="h-5 w-5" />,
              color: 'emerald',
              sub: 'Accounts via referral link',
            },
            {
              label: 'Points Distributed',
              value: `${(data?.totalEarnedPoints || 0).toLocaleString()} Pts`,
              icon: <Award className="h-5 w-5" />,
              color: 'amber',
              sub: 'Total rewards issued',
            },
            {
              label: 'Avg Points / Referral',
              value: referrals.length
                ? `${Math.round((data?.totalEarnedPoints || 0) / referrals.length)} Pts`
                : '0 Pts',
              icon: <TrendingUp className="h-5 w-5" />,
              color: 'purple',
              sub: 'Per successful referral',
            },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className={`${stat.mono ? 'font-mono' : ''} text-xl font-extrabold mt-1 text-${stat.color}-600 dark:text-${stat.color}-400 truncate`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.sub}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 shrink-0 ml-3`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Activity Table */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-500" /> Referral Activity Ledger
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Live record of referred user registrations and awarded bonus points.
                </CardDescription>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9 text-xs bg-muted/20 border-border/60 focus:border-blue-500 rounded-xl"
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
                      Loading referral activity...
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
                    <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <Gift className="h-8 w-8 text-muted-foreground/30" />
                        <p>No customer referrals logged yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {referrals.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 bg-muted/10 text-xs">
                <div className="text-muted-foreground font-semibold">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} referrals
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-semibold">Rows per page:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      className="bg-card border border-border/60 rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-blue-500"
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
      </div>
    </AdminLayout>
  );
}
