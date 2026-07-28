'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Download,
  Filter,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  User,
  Sparkles,
  Mail,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function normalizeReturn(raw: any) {
  return {
    id: raw.id || raw._id || raw.returnId || `RET-${Date.now()}`,
    orderId: raw.orderId || raw.order?.id || '',
    customer: raw.customerName || `${raw.user?.firstName || ''} ${raw.user?.lastName || ''}`.trim() || 'Customer',
    email: raw.email || raw.user?.email || '',
    amount: Number(raw.amount || raw.refundAmount || 0),
    status: raw.status || 'pending_review',
    pickupStatus: raw.pickupStatus || 'not_scheduled',
    inspectionStatus: raw.inspectionStatus || 'pending',
    refundStatus: raw.refundStatus || 'pending',
    reason: raw.reason || raw.returnReason || '',
    items: Number(raw.itemCount || raw.items || 1),
    date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('en-CA') : raw.date || '',
    imagesCount: raw.images?.length ?? raw.imagesCount ?? 0,
  };
}

const statusConfig = {
  pending_review: { label: 'Pending Review', icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  picked_up: { label: 'Picked Up', icon: Package, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-pink-400 to-rose-500 text-white',
    'from-purple-400 to-indigo-500 text-white',
    'from-blue-400 to-cyan-500 text-white',
    'from-emerald-400 to-teal-500 text-white',
    'from-amber-400 to-orange-500 text-white',
  ];
  return gradients[Math.abs(hash) % gradients.length];
};

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/returns`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load returns');
      const raw = json.data ?? json.returns ?? json ?? [];
      setReturnsList(Array.isArray(raw) ? raw.map(normalizeReturn) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setReturnsList(prev => prev.map(r => {
      if (r.id !== id) return r;
      let pickup = r.pickupStatus, inspect = r.inspectionStatus, refund = r.refundStatus;
      if (newStatus === 'approved') { pickup = 'scheduled'; }
      else if (newStatus === 'picked_up') { pickup = 'completed'; inspect = 'in_progress'; }
      else if (newStatus === 'completed') { pickup = 'completed'; inspect = 'passed'; refund = 'completed'; }
      else if (newStatus === 'rejected') { pickup = 'not_scheduled'; inspect = 'not_required'; refund = 'rejected'; }
      return { ...r, status: newStatus, pickupStatus: pickup, inspectionStatus: inspect, refundStatus: refund };
    }));
    setSelectedReturn((prev: any) => prev && prev.id === id ? { ...prev, status: newStatus } : prev);
    try { await fetch(`${API_BASE}/api/returns/${id}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: newStatus }) }); } catch { }
  };



  const filteredReturns = useMemo(() => {
    return returnsList.filter(returnItem => {
      const matchesSearch = 
        returnItem.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        returnItem.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        returnItem.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        returnItem.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' || returnItem.status === activeTab;
      
      return matchesSearch && matchesTab;
    });
  }, [returnsList, searchQuery, activeTab]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const returnColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'Claim ID' },
    { accessorKey: 'orderId', header: 'Order' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'items', header: 'Items' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const returnsTable = useReactTable({
    data: filteredReturns,
    columns: returnColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = returnsList.length;
    const pendingCount = returnsList.filter(r => r.status === 'pending_review').length;
    const approvedCount = returnsList.filter(r => r.status === 'approved').length;
    const refundVolume = returnsList.filter(r => r.refundStatus === 'completed').reduce((sum, r) => sum + r.amount, 0);

    return {
      totalCount,
      pendingCount,
      approvedCount,
      refundVolume
    };
  }, [returnsList]);

  const getStatusCount = (status: string) => {
    if (status === 'all') return returnsList.length;
    return returnsList.filter(r => r.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Returns"
          titlePart2="Management"
          badgeText="Returns Command Center"
          subtitle="Manage customer return claims, perform quality inspections, and issue store refunds."
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Claims Filed</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalCount} Requests</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">{stats.pendingCount} pending reviews today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Review</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight text-amber-500">{stats.pendingCount} Pending</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Claim reviews needing attention</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Approved</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight text-blue-500">{stats.approvedCount} Approved</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Scheduled courier pick ups</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Refunded Volume</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">${stats.refundVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Successfully returned and closed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard table Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Return Requests Log</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search returns by customer name, order ID, or claim ID..."
                  className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs & Table */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-muted/40 p-1 border border-border/20 rounded-xl flex overflow-x-auto w-full md:w-fit justify-start h-auto">
                <TabsTrigger value="all" className="rounded-lg py-2 px-4 text-xs font-semibold">
                  All ({getStatusCount('all')})
                </TabsTrigger>
                <TabsTrigger value="pending_review" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Review ({getStatusCount('pending_review')})
                </TabsTrigger>
                <TabsTrigger value="approved" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Approved ({getStatusCount('approved')})
                </TabsTrigger>
                <TabsTrigger value="picked_up" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Picked ({getStatusCount('picked_up')})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Completed ({getStatusCount('completed')})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Rejected ({getStatusCount('rejected')})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-b border-border/20">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Claim ID</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Order Reference</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                          <Button variant="ghost" onClick={() => returnsTable.getColumn('customer')?.toggleSorting(returnsTable.getColumn('customer')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                            Customer <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                          <Button variant="ghost" onClick={() => returnsTable.getColumn('date')?.toggleSorting(returnsTable.getColumn('date')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                            Date <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Items</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                          <Button variant="ghost" onClick={() => returnsTable.getColumn('amount')?.toggleSorting(returnsTable.getColumn('amount')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                            Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Claim Reason</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Status</TableHead>
                        <TableHead className="w-16 py-4" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading returns...</TableCell></TableRow>
                      ) : returnsTable.getRowModel().rows.length ? (
                        returnsTable.getRowModel().rows.map((row) => {
                          const returnItem = row.original;
                          const statusInfo = statusConfig[returnItem.status as keyof typeof statusConfig] || statusConfig.pending_review;
                          const avatarColor = getAvatarColor(returnItem.customer);
                          
                          return (
                            <TableRow 
                              key={row.id}
                              onClick={() => setSelectedReturn(returnItem)}
                              className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer group/row"
                            >
                              {/* Claim ID */}
                              <TableCell className="py-4">
                                <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                                  {returnItem.id}
                                </span>
                              </TableCell>

                              {/* Order reference */}
                              <TableCell className="py-4">
                                <span className="font-mono font-bold text-xs text-muted-foreground">
                                  {returnItem.orderId}
                                </span>
                              </TableCell>

                              {/* Customer */}
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 rounded-lg">
                                    <AvatarFallback className={`rounded-lg text-xs font-bold bg-gradient-to-tr ${avatarColor}`}>
                                      {returnItem.customer.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">{returnItem.customer}</p>
                                    <p className="text-xs text-muted-foreground truncate font-normal">{returnItem.email}</p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Date */}
                              <TableCell className="py-4 text-sm text-foreground">
                                {returnItem.date}
                              </TableCell>

                              {/* Items */}
                              <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  <span>{returnItem.items} items</span>
                                </div>
                              </TableCell>

                              {/* Amount */}
                              <TableCell className="py-4 text-sm font-black text-foreground">
                                ${returnItem.amount.toFixed(2)}
                              </TableCell>

                              {/* Reason */}
                              <TableCell className="py-4 text-xs text-muted-foreground font-normal max-w-xs truncate">
                                {returnItem.reason}
                              </TableCell>

                              {/* Status */}
                              <TableCell className="py-4 text-center">
                                <Badge className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${statusInfo.color}`}>
                                  <statusInfo.icon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>

                              {/* Actions dropdown */}
                              <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={
                                    <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  } />
                                  <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-44">
                                    <DropdownMenuItem onClick={() => setSelectedReturn(returnItem)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                      <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> Quick Preview
                                    </DropdownMenuItem>
                                    <Separator className="my-1 border-border/10" />
                                    
                                    {returnItem.status === 'pending_review' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(returnItem.id, 'approved')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                          <CheckCircle className="mr-2 h-4 w-4 text-blue-500" /> Approve Request
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(returnItem.id, 'rejected')} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                          <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Reject Return
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {returnItem.status === 'approved' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(returnItem.id, 'picked_up')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                        <Package className="mr-2 h-4 w-4 text-cyan-500" /> Picked Up Courier
                                      </DropdownMenuItem>
                                    )}
                                    {returnItem.status === 'picked_up' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(returnItem.id, 'completed')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Complete Refund
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                              <p className="text-sm font-semibold text-muted-foreground">No return claims found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {filteredReturns.length > 0 && (
                    <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                      <span className="text-muted-foreground font-semibold">
                        {returnsTable.getFilteredRowModel().rows.length} of {filteredReturns.length} records
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => returnsTable.previousPage()} disabled={!returnsTable.getCanPreviousPage()}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="px-2 font-bold text-foreground text-[11px]">
                          {returnsTable.getState().pagination.pageIndex + 1} / {returnsTable.getPageCount() || 1}
                        </span>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => returnsTable.nextPage()} disabled={!returnsTable.getCanNextPage()}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedReturn !== null} onOpenChange={(open) => { if (!open) setSelectedReturn(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedReturn && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedReturn.id}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        statusConfig[selectedReturn.status as keyof typeof statusConfig]?.color || 'bg-muted'
                      }`}>
                        {statusConfig[selectedReturn.status as keyof typeof statusConfig]?.label || selectedReturn.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" title="Download Document">
                        <Download className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Filed on {selectedReturn.date}</span>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-8 h-full overflow-y-auto">
                  {/* Timeline Stepper */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Return Claim Workflow</h3>
                    
                    <div className="relative pl-8 space-y-6 pt-1">
                      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
                      
                      {/* Step 1: Claim filed */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['pending_review', 'approved', 'picked_up', 'completed'].includes(selectedReturn.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          ✓
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Return Request Filed</span>
                          <span className="text-xs text-muted-foreground mt-0.5">Customer filed return claim on {selectedReturn.date}</span>
                        </div>
                      </div>

                      {/* Step 2: Approval */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['approved', 'picked_up', 'completed'].includes(selectedReturn.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedReturn.status === 'pending_review'
                            ? 'bg-card border-amber-500 text-amber-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {['approved', 'picked_up', 'completed'].includes(selectedReturn.status) ? '✓' : '2'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Claim Review & Approval</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {['approved', 'picked_up', 'completed'].includes(selectedReturn.status)
                              ? 'Request reviewed and approved by administrator'
                              : selectedReturn.status === 'rejected'
                              ? 'Request rejected and claim closed'
                              : 'Pending claim review'}
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Pick up */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['picked_up', 'completed'].includes(selectedReturn.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedReturn.status === 'approved'
                            ? 'bg-card border-blue-500 text-blue-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {['picked_up', 'completed'].includes(selectedReturn.status) ? '✓' : '3'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Courier Pick Up</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {['picked_up', 'completed'].includes(selectedReturn.status)
                              ? 'Package picked up by courier and in transit'
                              : 'Awaiting package pickup schedule'}
                          </span>
                        </div>
                      </div>

                      {/* Step 4: Refund completed */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          selectedReturn.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedReturn.status === 'picked_up'
                            ? 'bg-card border-cyan-500 text-cyan-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {selectedReturn.status === 'completed' ? '✓' : '4'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Refund Settle</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {selectedReturn.status === 'completed'
                              ? 'Quality inspection passed and refund credited'
                              : 'Pending quality inspection review'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 border-border/10" />

                  {/* Customer Information Cards */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Claim Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer info */}
                      <Card className="border-border/30 bg-muted/15 rounded-lg shadow-sm">
                        <CardContent className="p-4 space-y-3 flex flex-col">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <User className="h-4 w-4 text-[#14b8a6]" />
                            <span>{selectedReturn.customer}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{selectedReturn.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Refund Amount: ${selectedReturn.amount.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Return reason */}
                      <Card className="border-border/30 bg-muted/15 rounded-lg shadow-sm">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <AlertCircle className="h-4 w-4 text-[#14b8a6]" />
                            <span>Reason for Return</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedReturn.reason}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {selectedReturn.imagesCount > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer Uploaded Media</h3>
                      <div className="flex gap-2">
                        {Array.from({ length: selectedReturn.imagesCount }).map((_, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-lg bg-muted border border-border/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary">
                            <FileText className="h-6 w-6 text-muted-foreground/60 group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-1 right-1 text-[8px] bg-background/80 px-1 py-0.5 rounded backdrop-blur">
                              IMG_{idx+1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Status Transitions Drawer footer actions */}
                <div className="p-6 border-t border-border/20 bg-muted/15 flex flex-wrap gap-2 justify-between items-center z-10 shrink-0">
                  <div>
                    {selectedReturn.status !== 'rejected' && selectedReturn.status !== 'completed' ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                        <AlertCircle className="h-4 w-4 text-[#14b8a6]" />
                        <span>Transitions available in return pipeline</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Return workflow finalized</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedReturn.status === 'pending_review' && (
                      <>
                        <Button 
                          onClick={() => handleUpdateStatus(selectedReturn.id, 'approved')}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                        >
                          Approve Return
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleUpdateStatus(selectedReturn.id, 'rejected')}
                          className="text-rose-500 hover:bg-rose-500/10 rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                        >
                          Reject Return
                        </Button>
                      </>
                    )}
                    
                    {selectedReturn.status === 'approved' && (
                      <Button 
                        onClick={() => handleUpdateStatus(selectedReturn.id, 'picked_up')}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        Mark Picked Up
                      </Button>
                    )}
                    
                    {selectedReturn.status === 'picked_up' && (
                      <Button 
                        onClick={() => handleUpdateStatus(selectedReturn.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        Settle Refund
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
