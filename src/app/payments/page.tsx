'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DollarSign, TrendingUp, CheckCircle2, Clock, XCircle, RefreshCw,
  ArrowUpRight, CreditCard, BarChart2, Search, ArrowUp, ArrowDown, Sparkles,
  Info, Eye, Trash2, Calendar, User, Shield, AlertCircle,
  ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/toast';



function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizePayment(raw: any) {
  const order = raw.order || {};
  return {
    id: raw.id,
    orderId: raw.orderId,
    orderNumber: order.orderNumber || `ORD-${raw.orderId}`,
    customer: order.user ? `${order.user.firstName} ${order.user.lastName || ''}`.trim() : 'Customer',
    email: order.user?.email || 'customer@email.com',
    amount: raw.amount ? `₹${Number(raw.amount).toLocaleString('en-IN')}` : '₹0',
    amountNum: Number(raw.amount) || 0,
    refundedAmount: Number(raw.refundedAmount) || 0,
    method: raw.method || 'UPI',
    status: raw.status || 'PENDING',
    date: new Date(raw.createdAt).toLocaleDateString('en-CA'),
    gateway: raw.providerRef ? 'Razorpay' : 'Manual',
    razorpayOrderId: raw.razorpayOrderId || '',
    razorpayPaymentId: raw.razorpayPaymentId || '',
    refundId: raw.refundId || '',
  };
}

const revenueData = [
  { day: 'Mon', revenue: 182000 }, { day: 'Tue', revenue: 215000 }, { day: 'Wed', revenue: 194000 },
  { day: 'Thu', revenue: 268000 }, { day: 'Fri', revenue: 312000 }, { day: 'Sat', revenue: 284000 }, { day: 'Sun', revenue: 195000 },
];

const paymentMethodData = [
  { name: 'UPI', value: 42, color: '#14b8a6' },
  { name: 'Cards', value: 28, color: '#3b82f6' },
  { name: 'Net Banking', value: 12, color: '#8b5cf6' },
  { name: 'Wallets', value: 10, color: '#f59e0b' },
  { name: 'COD', value: 8, color: '#f43f5e' },
];

const txnStatusStyle: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  FAILED:  'bg-rose-500/10 text-rose-500 border-rose-500/20',
  REFUNDED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  PARTIALLY_REFUNDED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export default function PaymentsDashboardPage() {
  const [txnList, setTxnList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const [stats, setStats] = useState({
    captured: 0,
    failed: 0,
    refunded: 0,
    total: 0
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/payments/dashboard`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/payments`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load payments');
      const raw = json.data?.payments || [];
      setTxnList(raw.map(normalizePayment));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchPayments();
  }, [fetchDashboardStats, fetchPayments]);

  const filteredTxns = useMemo(() => {
    return txnList.filter(t =>
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [txnList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const txnColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'orderNumber', header: 'Order' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'amountNum', header: 'Amount' },
    { accessorKey: 'method', header: 'Method' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const txnTable = useReactTable({
    data: filteredTxns,
    columns: txnColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;
    
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0 || amt > (selectedTxn.amountNum - selectedTxn.refundedAmount)) {
      toast.error('Invalid refund amount.');
      return;
    }

    if (refundReason.length < 10) {
      toast.error('Refund reason must be at least 10 characters.');
      return;
    }

    setRefunding(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/payments/${selectedTxn.id}/refund`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          refundAmount: amt,
          refundReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Refund processed successfully.');
        setRefundAmount('');
        setRefundReason('');
        setSelectedTxn(null);
        fetchPayments();
        fetchDashboardStats();
      } else {
        toast.error(data.message || 'Failed to initiate refund.');
      }
    } catch (err: any) {
      toast.error(`Error processing refund: ${err.message}`);
    } finally {
      setRefunding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Payments"
          titlePart2="Dashboard"
          badgeText="Transaction Command Center"
          subtitle="Monitor store sales volume, analyze transaction processing health, and view gateways performance."
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Settle Volume</span>
                <div className="p-2 rounded-lg bg-[#14b8a6]/10 text-[#14b8a6]">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">₹{stats.captured.toLocaleString('en-IN')}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Failed Transactions</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">₹{stats.failed.toLocaleString('en-IN')}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Refunded</span>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                  <RefreshCw className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">₹{stats.refunded.toLocaleString('en-IN')}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Transactions</span>
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Transactions Log Ledger</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-11 bg-muted/20 border-border/40 focus:border-[#14b8a6] h-10 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-border/30 rounded-xl overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/20">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Transaction ID</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Order Reference</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => txnTable.getColumn('customer')?.toggleSorting(txnTable.getColumn('customer')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Customer Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => txnTable.getColumn('amountNum')?.toggleSorting(txnTable.getColumn('amountNum')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Settle Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Payment Method</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => txnTable.getColumn('date')?.toggleSorting(txnTable.getColumn('date')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Settle Date <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading transactions...</TableCell></TableRow>
                  ) : txnTable.getRowModel().rows.length ? (
                    txnTable.getRowModel().rows.map((row) => {
                    const t = row.original;
                    return (
                    <TableRow 
                      key={row.id}
                      onClick={() => setSelectedTxn(t)}
                      className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                    >
                      <TableCell className="py-4 font-mono font-bold text-xs">{t.id}</TableCell>
                      <TableCell className="py-4 font-mono text-xs text-muted-foreground">{t.orderNumber}</TableCell>
                      <TableCell className="py-4 font-semibold text-sm text-foreground">{t.customer}</TableCell>
                      <TableCell className="py-4 text-sm font-black text-foreground">{t.amount}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground font-normal">{t.method}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{t.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={`text-xs font-semibold rounded-md px-2.5 py-1 border border-transparent select-none ${txnStatusStyle[t.status.toUpperCase()] || 'bg-zinc-500/10 text-zinc-500'}`}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Info className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No transactions found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredTxns.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {txnTable.getFilteredRowModel().rows.length} of {filteredTxns.length} transactions
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => txnTable.previousPage()} disabled={!txnTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {txnTable.getState().pagination.pageIndex + 1} / {txnTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => txnTable.nextPage()} disabled={!txnTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedTxn !== null} onOpenChange={(open) => { if (!open) setSelectedTxn(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedTxn && (
              <>
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg">
                        TXN-{selectedTxn.id}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${txnStatusStyle[selectedTxn.status.toUpperCase()] || 'bg-zinc-500/10 text-zinc-500'}`}>
                        {selectedTxn.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Transaction Receipt</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">Order Number: {selectedTxn.orderNumber}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-primary" /> Settle Amount
                        </span>
                        <h4 className="text-xl font-black mt-1.5">{selectedTxn.amount}</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Method
                        </span>
                        <h4 className="text-lg font-black text-foreground mt-1.5">{selectedTxn.method}</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer Details</h3>
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/15 space-y-2 text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#14b8a6]" />
                        <span>{selectedTxn.customer}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        <span>{selectedTxn.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gateway Auditing</h3>
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/15 space-y-2 text-sm font-semibold">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">Payment Gateway</span>
                        <span>{selectedTxn.gateway}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">Razorpay Order ID</span>
                        <span className="font-mono text-xs">{selectedTxn.razorpayOrderId || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">Razorpay Payment ID</span>
                        <span className="font-mono text-xs">{selectedTxn.razorpayPaymentId || 'None'}</span>
                      </div>
                      {selectedTxn.refundedAmount > 0 && (
                        <div className="flex justify-between text-orange-500">
                          <span className="text-muted-foreground font-normal">Refunded Amount</span>
                          <span>₹{selectedTxn.refundedAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refund Forms if eligible */}
                  {selectedTxn.status.toUpperCase() === 'PAID' && (selectedTxn.amountNum - selectedTxn.refundedAmount) > 0 && (
                    <div className="p-4 border border-border/30 rounded-xl bg-card">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Process Online Refund</h3>
                      <form onSubmit={handleRefund} className="space-y-4">
                        <div className="space-y-1">
                          <Label htmlFor="refAmt" className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Refund Amount (Max ₹{(selectedTxn.amountNum - selectedTxn.refundedAmount).toLocaleString('en-IN')})</Label>
                          <Input
                            id="refAmt"
                            type="number"
                            step="0.01"
                            placeholder="Amount in ₹"
                            value={refundAmount}
                            onChange={e => setRefundAmount(e.target.value)}
                            required
                            className="h-10 rounded-lg border-border/50 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="refReason" className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Refund Reason (Min 10 characters)</Label>
                          <Input
                            id="refReason"
                            placeholder="Reason for refund..."
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                            required
                            className="h-10 rounded-lg border-border/50 text-sm"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={refunding}
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-10 rounded-lg text-xs"
                        >
                          {refunding ? 'Processing Refund...' : 'Initiate Razorpay Refund'}
                        </Button>
                      </form>
                    </div>
                  )}

                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
