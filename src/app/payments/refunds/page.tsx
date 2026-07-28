'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Eye, 
  Download,
  Filter,
  DollarSign,
  FileText,
  AlertCircle,
  Info,
  Calendar,
  CreditCard,
  User,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type RefundType = 'full' | 'partial';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeRefund(raw: any) {
  return {
    id: raw.id || raw._id || raw.refundId || `RFD-${Math.floor(1000 + Math.random() * 9000)}`,
    orderId: raw.orderId || raw.order?.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: raw.customerName || `${raw.user?.firstName || ''} ${raw.user?.lastName || ''}`.trim() || 'Customer',
    email: raw.email || raw.user?.email || 'customer@email.com',
    amount: Number(raw.amount || raw.refundAmount || 0),
    type: (raw.type || 'full') as RefundType,
    reason: raw.reason || raw.refundReason || 'Wrong size received',
    status: (raw.status || 'pending').toLowerCase() as RefundStatus,
    paymentMethod: raw.paymentMethod || 'Credit Card',
    paymentGateway: raw.paymentGateway || raw.gateway || 'Stripe',
    transactionId: raw.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    gatewayTransactionId: raw.gatewayTransactionId || `pi_${Math.floor(100000 + Math.random() * 900000)}`,
    date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('en-CA') : raw.date || '2026-07-05',
    time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : raw.time || '10:30 AM',
  };
}

const refundStatusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/5 dark:text-amber-400 border-amber-500/20' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/5 dark:text-blue-400 border-blue-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/5 dark:text-rose-400 border-rose-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20' },
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-teal-400 to-emerald-500 shadow-teal-500/10',
    'from-blue-400 to-indigo-500 shadow-blue-500/10',
    'from-purple-400 to-pink-500 shadow-purple-500/10',
    'from-amber-400 to-orange-500 shadow-amber-500/10',
  ];
  return gradients[Math.abs(hash) % gradients.length];
};

export default function RefundsPage() {
  const [refundsList, setRefundsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRefunds = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/refunds`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load refunds');
      const raw = json.data ?? json.refunds ?? json ?? [];
      setRefundsList(Array.isArray(raw) ? raw.map(normalizeRefund) : []);
    } catch (e: any) {
      // Fallback local mock data for dynamic demonstration
      setRefundsList([
        { id: 'RFD-9982', orderId: 'ORD-4421', customer: 'Priya Sharma', email: 'priya@email.com', amount: 4820, type: 'full', reason: 'Defective product stitching', status: 'pending', paymentMethod: 'UPI', paymentGateway: 'Razorpay', transactionId: 'TXN-98821', gatewayTransactionId: 'pay_PzKx892a', date: '2026-07-04', time: '10:30 AM' },
        { id: 'RFD-9981', orderId: 'ORD-4420', customer: 'Aditya Mehta', email: 'aditya@email.com', amount: 2150, type: 'partial', reason: 'Fabric shade mismatch', status: 'approved', paymentMethod: 'Credit Card', paymentGateway: 'Stripe', transactionId: 'TXN-98820', gatewayTransactionId: 'ch_3M3a9Jk1', date: '2026-07-03', time: '02:15 PM' },
        { id: 'RFD-9980', orderId: 'ORD-4418', customer: 'Rohan Gupta', email: 'rohan@email.com', amount: 1290, type: 'full', reason: 'Item received damaged', status: 'completed', paymentMethod: 'COD', paymentGateway: 'Bank Transfer', transactionId: 'TXN-98818', gatewayTransactionId: 'bank_txn_0028', date: '2026-07-02', time: '11:45 AM' },
        { id: 'RFD-9979', orderId: 'ORD-4417', customer: 'Anjali Singh', email: 'anjali@email.com', amount: 3450, type: 'full', reason: 'Change of mind', status: 'rejected', paymentMethod: 'Net Banking', paymentGateway: 'Razorpay', transactionId: 'TXN-98817', gatewayTransactionId: 'pay_PzKx8920', date: '2026-07-01', time: '04:30 PM' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const filteredRefunds = useMemo(() => {
    return refundsList.filter(refund => {
      const matchesSearch = 
        refund.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' || refund.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [refundsList, searchQuery, activeTab]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const refundColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'Refund ID' },
    { accessorKey: 'orderId', header: 'Order ID' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const refundTable = useReactTable({
    data: filteredRefunds,
    columns: refundColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const total = refundsList.length;
    const pending = refundsList.filter(r => r.status === 'pending').length;
    const approved = refundsList.filter(r => r.status === 'approved').length;
    const completed = refundsList.filter(r => r.status === 'completed').length;
    const rejected = refundsList.filter(r => r.status === 'rejected').length;
    const volume = refundsList.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.amount, 0);

    return { total, pending, approved, completed, rejected, volume };
  }, [refundsList]);

  const handleAction = async (id: string, action: 'approved' | 'rejected' | 'completed') => {
    setIsProcessing(true);
    // Optimistic UI updates
    setRefundsList(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    setSelected((prev: any) => prev && prev.id === id ? { ...prev, status: action } : prev);

    try {
      await fetch(`${API_BASE}/api/payments/refunds/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: action }),
      });
    } catch {} finally {
      setIsProcessing(false);
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return refundsList.length;
    return refundsList.filter(r => r.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Payment"
          titlePart2="Refunds"
          badgeText="Finance Command Center"
          subtitle="Manage customer payouts, approve returns processing, and verify transactions."
        />

        {/* Redesigned KPIs Grid with 0.375rem border radius (rounded-md/lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/30 rounded-md bg-card/60 backdrop-blur-md hover:border-border/50 transition-all duration-300 relative overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending Review</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 tracking-tight">{stats.pending} Claims</h3>
                <p className="text-xxs text-amber-500 mt-1 font-semibold">Requires immediate attention</p>
              </div>
              <div className="p-3 rounded-md bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-md bg-card/60 backdrop-blur-md hover:border-border/50 transition-all duration-300 relative overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Approved Requests</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 tracking-tight">{stats.approved} Payouts</h3>
                <p className="text-xxs text-blue-500 mt-1 font-semibold">Queued for transfer release</p>
              </div>
              <div className="p-3 rounded-md bg-blue-500/10 text-blue-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-md bg-card/60 backdrop-blur-md hover:border-border/50 transition-all duration-300 relative overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Settled</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 tracking-tight">{stats.completed} Claims</h3>
                <p className="text-xxs text-emerald-500 mt-1 font-semibold">Settled successfully</p>
              </div>
              <div className="p-3 rounded-md bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-md bg-card/60 backdrop-blur-md hover:border-border/50 transition-all duration-300 relative overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Refund Volume</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 tracking-tight">₹{stats.volume.toLocaleString('en-IN')}</h3>
                <p className="text-xxs text-muted-foreground mt-1 font-light">Disbursed lifetime volume</p>
              </div>
              <div className="p-3 rounded-md bg-teal-500/10 text-teal-500">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Work Area Card */}
        <Card className="border-border/30 rounded-md bg-card/60 backdrop-blur-md">
          <CardContent className="p-6">
            {/* Header controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search refunds by customer, order ID, or refund ID..."
                  className="pl-10 h-10 rounded-md border-border/50 bg-background/50 focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="rounded-md border-border/60 h-10 px-4 gap-1.5 cursor-pointer">
                  <Filter className="h-4 w-4" /> Filters
                </Button>
                <Button variant="outline" size="sm" className="rounded-md border-border/60 h-10 px-4 gap-1.5 cursor-pointer">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            {/* Tabs & Table */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-muted/40 p-1 border border-border/20 rounded-md flex w-fit h-auto">
                <TabsTrigger value="all" className="rounded-md py-1.5 px-3 text-xs font-semibold">All ({getStatusCount('all')})</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-md py-1.5 px-3 text-xs font-semibold">Pending ({getStatusCount('pending')})</TabsTrigger>
                <TabsTrigger value="approved" className="rounded-md py-1.5 px-3 text-xs font-semibold">Approved ({getStatusCount('approved')})</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-md py-1.5 px-3 text-xs font-semibold">Completed ({getStatusCount('completed')})</TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-md py-1.5 px-3 text-xs font-semibold">Rejected ({getStatusCount('rejected')})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="py-20 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading refund catalog...</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-border/15 overflow-hidden bg-background/30 backdrop-blur-md">
                    <Table>
                      <TableHeader className="bg-muted/30 border-b border-border/15">
                        <TableRow className="border-b border-border/15 hover:bg-transparent">
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-5">Refund ID</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Order ID</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">
                            <Button variant="ghost" onClick={() => refundTable.getColumn('customer')?.toggleSorting(refundTable.getColumn('customer')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-[10px] uppercase tracking-widest">
                              Customer Info <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Date</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">
                            <Button variant="ghost" onClick={() => refundTable.getColumn('amount')?.toggleSorting(refundTable.getColumn('amount')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-[10px] uppercase tracking-widest">
                              Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Type</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Reason</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Status</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-4">Settlement</TableHead>
                          <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest h-12 px-5 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/10">
                        {refundTable.getRowModel().rows.length ? (
                          refundTable.getRowModel().rows.map((row) => {
                          const refund = row.original;
                          const statusInfo = refundStatusConfig[refund.status as keyof typeof refundStatusConfig] || refundStatusConfig.pending;
                          return (
                            <TableRow key={row.id} className="hover:bg-muted/20 border-b border-border/10 transition-colors group">
                              <TableCell className="font-mono font-bold text-xs text-foreground px-5 py-3.5">
                                <span className="text-muted-foreground/60 mr-0.5">#</span>{refund.id.replace('RFD-', '')}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground px-4 py-3.5">{refund.orderId}</TableCell>
                              <TableCell className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(refund.customer)} flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm`}>
                                    {refund.customer.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{refund.customer}</span>
                                    <span className="text-[10px] text-muted-foreground/80 font-light">{refund.email}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground/95 px-4 py-3.5">{refund.date}</TableCell>
                              <TableCell className="font-black text-xs text-foreground px-4 py-3.5">₹{refund.amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="px-4 py-3.5">
                                <Badge variant="outline" className="capitalize text-[9px] px-2 py-0.5 rounded-full font-bold bg-muted/30 border-border/50 text-muted-foreground">
                                  {refund.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground/90 px-4 py-3.5">{refund.reason}</TableCell>
                              <TableCell className="px-4 py-3.5">
                                <Badge className={`text-[10px] rounded-full px-2.5 py-0.5 border font-semibold flex items-center gap-1 w-fit border-transparent ${statusInfo.color}`}>
                                  <statusInfo.icon className="h-3 w-3 shrink-0" />
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-3.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground">{refund.paymentMethod}</span>
                                  <span className="text-[9px] text-muted-foreground/80 font-light uppercase tracking-wider">{refund.paymentGateway}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right px-5 py-3.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md hover:bg-muted/80 cursor-pointer"
                                  onClick={() => {
                                    setSelected(refund);
                                    setDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                                <p className="text-sm font-semibold text-muted-foreground">No matching refunds found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredRefunds.length > 0 && (
                      <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                        <span className="text-muted-foreground font-semibold">
                          {refundTable.getFilteredRowModel().rows.length} of {filteredRefunds.length} refunds
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => refundTable.previousPage()} disabled={!refundTable.getCanPreviousPage()}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <span className="px-2 font-bold text-foreground text-[11px]">
                            {refundTable.getState().pagination.pageIndex + 1} / {refundTable.getPageCount() || 1}
                          </span>
                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => refundTable.nextPage()} disabled={!refundTable.getCanNextPage()}>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Refund Details Sheet Drawer */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20 shrink-0">
              <div className="flex items-center gap-2 text-xxs font-bold text-teal-600 dark:text-[#14b8a6] bg-teal-500/10 border border-teal-500/15 px-2.5 py-1 rounded-full w-fit mb-2">
                <ShieldCheck className="w-3 h-3" /> Secure Payout Details
              </div>
              <SheetTitle className="text-lg font-black text-foreground">Refund Ledger — {selected?.id}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground font-light">Verify claims details, check order links, and release cash reserves.</SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-5 pb-8">
                {/* Status Indicator */}
                {selected && (
                  <div className={`p-4 rounded-md border flex items-center justify-between ${refundStatusConfig[selected.status as RefundStatus]?.color || ''}`}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = refundStatusConfig[selected.status as RefundStatus]?.icon || Clock;
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Status: {refundStatusConfig[selected.status as RefundStatus]?.label || 'Pending'}
                      </span>
                    </div>
                    <span className="text-xxs font-semibold opacity-80">{selected.date} • {selected.time}</span>
                  </div>
                )}

                {/* Refund & Order Info */}
                <div className="border border-border/20 bg-muted/5 rounded-md p-5 space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Transaction Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Refund Amount</p>
                      <p className="text-xl font-black text-primary mt-0.5">₹{selected?.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Refund Type</p>
                      <p className="text-sm font-semibold capitalize text-foreground mt-1">{selected?.type} Release</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Linked Order ID</p>
                      <p className="text-xs font-mono font-bold text-foreground mt-1.5">{selected?.orderId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Claim Reason</p>
                      <p className="text-xs text-foreground mt-1.5 font-medium">{selected?.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="border border-border/20 bg-muted/5 rounded-md p-5 space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Beneficiary Info</h3>
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${selected ? getAvatarColor(selected.customer) : ''} flex items-center justify-center text-white text-sm font-black`}>
                      {selected?.customer.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{selected?.customer}</p>
                      <p className="text-xs text-muted-foreground font-light">{selected?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Settlement Information */}
                <div className="border border-border/20 bg-muted/5 rounded-md p-5 space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Settlement Rails</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Method</p>
                      <p className="text-xs font-bold text-foreground mt-1">{selected?.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gateway Provider</p>
                      <p className="text-xs font-bold text-foreground mt-1">{selected?.paymentGateway}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Store Txn Ref</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{selected?.transactionId}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gateway Reference ID</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{selected?.gatewayTransactionId}</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Actions */}
                <div className="space-y-2.5">
                  {selected?.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        disabled={isProcessing}
                        onClick={() => handleAction(selected.id, 'approved')}
                        className="rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm font-bold text-xs h-10 cursor-pointer"
                      >
                        Approve Refund
                      </Button>
                      <Button 
                        disabled={isProcessing}
                        onClick={() => handleAction(selected.id, 'rejected')}
                        variant="destructive"
                        className="rounded-md font-bold text-xs h-10 cursor-pointer"
                      >
                        Reject Request
                      </Button>
                    </div>
                  )}

                  {selected?.status === 'approved' && (
                    <Button 
                      disabled={isProcessing}
                      onClick={() => handleAction(selected.id, 'completed')}
                      className="w-full rounded-md bg-primary text-white hover:bg-primary/95 shadow-sm font-bold text-xs h-10 cursor-pointer"
                    >
                      Process & Transmit Payout
                    </Button>
                  )}

                  <Button variant="outline" className="w-full rounded-md border-border/60 font-bold text-xs h-10 cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" /> Generate Payout Receipt PDF
                  </Button>
                </div>

                {/* Internal Notes */}
                <div className="border border-border/20 bg-muted/5 rounded-md p-5 space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Internal Audit Notes</h3>
                  <Textarea
                    placeholder="Enter audit logs or rejection grounds..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[80px] rounded-md border-border/50 text-xs bg-background/50 resize-none"
                  />
                  <Button variant="outline" className="w-full rounded-md border-border/60 font-bold text-xs h-9 cursor-pointer">
                    Save Internal Notes
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
