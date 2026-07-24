'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/currency-context';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Download,
  Filter,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Calendar,
  DollarSign,
  CreditCard,
  Printer,
  MapPin,
  User,
  Mail,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

// ── API helper ──────────────────────────────────────────────────────────────


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Normalize a raw API order (admin shape) into the shape the UI expects
function normalizeOrder(raw: any) {
  const user = raw.user || {};
  const shippingAddress = raw.shippingAddress || raw.address || {};
  const addressStr = typeof shippingAddress === 'string'
    ? shippingAddress
    : [shippingAddress.recipientName || shippingAddress.name, shippingAddress.addressLine1 || shippingAddress.line1, shippingAddress.city, shippingAddress.state, shippingAddress.pincode || shippingAddress.postalCode]
        .filter(Boolean).join(', ');

  const rawItems = raw.items || raw.orderItems || [];

  return {
    id: raw.orderNumber || raw.id || '',
    _rawId: raw.id,
    customer: shippingAddress.fullName || shippingAddress.recipientName || shippingAddress.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || (user.email ? user.email.split('@')[0] : '') || raw.customerName || 'Customer',
    email: user.email || raw.email || '',
    phone: user.phone || raw.phone || shippingAddress.phone || '',
    amount: Number(raw.totalAmount || raw.total || 0),
    status: (raw.status || 'pending').toLowerCase().trim(),
    paymentStatus: (raw.paymentStatus || raw.payment?.status || 'pending').toLowerCase().trim(),
    items: raw._count?.items ?? rawItems.length ?? raw.itemCount ?? 0,
    date: raw.createdAt
      ? new Date(raw.createdAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' IST'
      : (raw.orderDate || ''),
    trackingNumber: raw.trackingNumber || raw.shipments?.[0]?.trackingNumber || '',
    address: addressStr || 'Standard Shipping Address',
    orderItems: rawItems,
  };
}

// Map statuses to styling
const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/5 dark:text-amber-400 border-amber-500/20' },
  processing: { label: 'Processing', icon: Package, color: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/5 dark:text-blue-400 border-blue-500/20' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/5 dark:text-cyan-400 border-cyan-500/20' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/5 dark:text-rose-400 border-rose-500/20' },
  returned: { label: 'Returned', icon: RefreshCw, color: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/5 dark:text-indigo-400 border-indigo-500/20' },
  refunded: { label: 'Refunded', icon: RefreshCw, color: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/5 dark:text-gray-400 border-gray-500/20' },
};

// Extract order items from the real API shape
function getOrderItems(order: any) {
  if (!order.orderItems || order.orderItems.length === 0) {
    return [{ name: 'Order Item', quantity: 1, price: order.amount, size: '—', color: '—' }];
  }
  return order.orderItems.map((item: any) => ({
    name: item.product?.title || item.product?.name || item.productName || 'Product',
    quantity: item.quantity || 1,
    price: Number(item.price || item.unitPrice || item.product?.price || 0),
    size: item.selectedSize || item.variant?.size || item.size || '—',
    color: item.selectedColor || item.variant?.color || item.color || '—',
  }));
}

const getAvatarFallback = (name: string) => {
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'bg-gradient-to-tr from-pink-400 to-rose-500 text-white',
    'bg-gradient-to-tr from-purple-400 to-indigo-500 text-white',
    'bg-gradient-to-tr from-blue-400 to-cyan-500 text-white',
    'bg-gradient-to-tr from-emerald-400 to-teal-500 text-white',
    'bg-gradient-to-tr from-amber-400 to-orange-500 text-white',
  ];
  return gradients[Math.abs(hash) % gradients.length];
};

export default function OrdersPage() {
  const { fmt: fmtPrice } = useCurrency();
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Selected Order for slide out preview
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // ── Fetch orders from API ─────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load orders');
      const rawData = json.data?.orders ?? json.orders ?? json.data ?? json ?? [];
      const rawList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.orders) ? rawData.orders : []);
      setOrdersList(rawList.map(normalizeOrder));
    } catch (e: any) {
      setError(e.message || 'Could not fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Status transitions — calls API then refreshes
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const order = ordersList.find(o => o.id === orderId);
    const rawId = order?._rawId || orderId;

    // Optimistic update in UI
    const patch = (o: any) => {
      if (o.id !== orderId) return o;
      const trackingNumber = newStatus === 'shipped' && !o.trackingNumber
        ? `TRK${Math.floor(100000000 + Math.random() * 900000000)}`
        : o.trackingNumber;
      return { ...o, status: newStatus, trackingNumber, paymentStatus: newStatus === 'refunded' ? 'refunded' : o.paymentStatus };
    };
    setOrdersList(prev => prev.map(patch));
    setSelectedOrder((prev: any | null) => prev ? patch(prev) : prev);

    try {
      // Map UI status key to DB enum value
      const STATUS_MAP: Record<string, string> = {
        pending: 'PENDING',
        confirmed: 'CONFIRMED',
        processing: 'PROCESSING',
        packed: 'PACKED',
        ready_to_ship: 'READY_TO_SHIP',
        shipped: 'SHIPPED',
        in_transit: 'IN_TRANSIT',
        out_for_delivery: 'OUT_FOR_DELIVERY',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
        return_requested: 'RETURN_REQUESTED',
        returned: 'RETURNED',
        refund_processing: 'REFUND_PROCESSING',
        refund_completed: 'REFUND_COMPLETED',
      };
      const dbStatus = STATUS_MAP[newStatus] || newStatus.toUpperCase();
      await fetch(`${API_BASE}/api/admin/orders/${rawId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: dbStatus }),
      });
      await fetchOrders();
    } catch (e) {
      // Status update failed — force refetch to restore server truth
      await fetchOrders();
    }
  };

  // Filtered orders selector
  const filteredOrders = useMemo(() => {
    return ordersList.filter(order => {
      // 1. Search Query
      const matchesSearch = 
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Main Tab (Status)
      const matchesTab = activeTab === 'all' ||
        (activeTab === 'processing' && ['processing', 'pending', 'confirmed', 'paid', 'placed', 'created', 'order_placed'].includes(order.status)) ||
        (activeTab === 'shipped' && ['shipped', 'out_for_delivery', 'in_transit', 'packed', 'ready_to_ship'].includes(order.status)) ||
        (activeTab === 'delivered' && ['delivered', 'completed'].includes(order.status)) ||
        (activeTab === 'cancelled' && ['cancelled', 'refunded', 'return_requested', 'returned'].includes(order.status)) ||
        order.status === activeTab;

      // 3. Payment Status
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      // 4. Date Range Filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'today') {
          matchesDate = diffDays <= 1;
        } else if (dateFilter === '7days') {
          matchesDate = diffDays <= 7;
        } else if (dateFilter === '30days') {
          matchesDate = diffDays <= 30;
        }
      }

      // 5. Price range
      const matchesMinAmount = minAmount === '' || order.amount >= parseFloat(minAmount);
      const matchesMaxAmount = maxAmount === '' || order.amount <= parseFloat(maxAmount);

      return matchesSearch && matchesTab && matchesPayment && matchesDate && matchesMinAmount && matchesMaxAmount;
    });
  }, [ordersList, searchQuery, activeTab, paymentFilter, dateFilter, minAmount, maxAmount]);

  // Statistics summaries
  const stats = useMemo(() => {
    const totalCount = ordersList.length;
    const totalRevenue = ordersList
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.amount, 0);

    const activeCount = ordersList.filter(o => ['pending', 'processing'].includes(o.status)).length;
    const shippedCount = ordersList.filter(o => o.status === 'shipped').length;
    const deliveredCount = ordersList.filter(o => o.status === 'delivered').length;

    return {
      totalCount,
      totalRevenue,
      activeCount,
      shippedCount,
      deliveredCount
    };
  }, [ordersList]);

  const getStatusCount = (status: string) => {
    if (status === 'all') return ordersList.length;
    return ordersList.filter(o => {
      if (status === 'processing') return ['processing', 'pending', 'confirmed', 'paid', 'placed', 'created', 'order_placed'].includes(o.status);
      if (status === 'shipped') return ['shipped', 'out_for_delivery', 'in_transit', 'packed', 'ready_to_ship'].includes(o.status);
      if (status === 'delivered') return ['delivered', 'completed'].includes(o.status);
      if (status === 'cancelled') return ['cancelled', 'refunded', 'return_requested', 'returned'].includes(o.status);
      return o.status === status;
    }).length;
  };

  const isFiltersApplied = paymentFilter !== 'all' || dateFilter !== 'all' || minAmount !== '' || maxAmount !== '';

  const handleResetFilters = () => {
    setPaymentFilter('all');
    setDateFilter('all');
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Order"
          titlePart2="Processing"
          badgeText="Orders Command Center"
          subtitle="Track transactions, process store orders, manage fulfillments, and verify payments."
        />

        {/* Premium KPI Summary Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Volume */}
          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Total Sales Volume</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
                    {loading ? '—' : `₹${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">From {loading ? '…' : stats.totalCount} overall orders placed</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#14b8a6]/10 text-[#14b8a6]">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Active Processing */}
          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Active Backlog</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.activeCount} Orders</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting review or item picking</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Shipped / Dispatched */}
          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">In Transit</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.shippedCount} Shipments</p>
                  <p className="text-xs text-muted-foreground mt-1">Dispatched and tracked by carrier</p>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Delivered */}
          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Delivered Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.deliveredCount} Completed</p>
                  <p className="text-xs text-muted-foreground mt-1">Handed over to happy customers</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Orders Dashboard Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6">
            
            {/* Top Toolbar Actions */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#14b8a6] transition-colors" />
                  <Input
                    placeholder="Search orders by customer, email, or ID..."
                    className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter & Export Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant={showFilters ? 'default' : 'outline'} 
                    size="sm"
                    className="rounded-lg h-10 px-4 flex items-center gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {isFiltersApplied && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-[#14b8a6]" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-10 px-4 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Advanced Expandable Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/30 border border-border/40 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {/* Payment Status Filter */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Payment Status
                        </span>
                        <select
                          value={paymentFilter}
                          onChange={(e) => setPaymentFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      {/* Date Filter */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Date Range
                        </span>
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="7days">Last 7 Days</option>
                          <option value="30days">Last 30 Days</option>
                        </select>
                      </div>

                      {/* Min Amount */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          Min Price (₹)
                        </span>
                        <Input
                          type="number"
                          placeholder="Min amount"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="h-10 rounded-lg border-border/40"
                        />
                      </div>

                      {/* Max Amount */}
                      <div className="space-y-1.5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            Max Price (₹)
                          </span>
                          <Input
                            type="number"
                            placeholder="Max amount"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="h-10 rounded-lg border-border/40 mt-1"
                          />
                        </div>
                        {isFiltersApplied && (
                          <Button 
                            onClick={handleResetFilters} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488] self-end p-0 h-6 mt-1.5"
                          >
                            Reset Active Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator className="my-6 border-border/20" />

            {/* Custom Tab Filters */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-muted/40 p-1 border border-border/20 rounded-xl flex overflow-x-auto w-full md:w-fit justify-start h-auto">
                <TabsTrigger value="all" className="rounded-lg py-2 px-4 text-xs font-semibold">
                  All ({getStatusCount('all')})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pending ({getStatusCount('pending')})
                </TabsTrigger>
                <TabsTrigger value="processing" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Processing ({getStatusCount('processing')})
                </TabsTrigger>
                <TabsTrigger value="shipped" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Shipped ({getStatusCount('shipped')})
                </TabsTrigger>
                <TabsTrigger value="delivered" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Delivered ({getStatusCount('delivered')})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Cancelled ({getStatusCount('cancelled')})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-b border-border/20">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Order ID</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Customer</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Date</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Items</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Amount</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Payment</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Tracking</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((__, j) => (
                              <TableCell key={j} className="py-4">
                                <div className="h-4 bg-muted/40 rounded animate-pulse" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <AlertCircle className="h-8 w-8 text-rose-400" />
                              <p className="text-sm font-semibold text-muted-foreground">{error}</p>
                              <button onClick={fetchOrders} className="text-xs text-[#14b8a6] underline">Retry</button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                              <p className="text-sm font-semibold text-muted-foreground">No matching orders found</p>
                              <p className="text-xs text-muted-foreground font-light">Try relaxing your search terms or filters</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                          const avatarColor = getAvatarColor(order.customer);
                          
                          return (
                            <TableRow 
                              key={order.id} 
                              onClick={() => setSelectedOrder(order)}
                              className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer group/row"
                            >
                              {/* Monospace Order ID tag */}
                              <TableCell className="py-4">
                                <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                                  {order.id}
                                </span>
                              </TableCell>
                              
                              {/* Customer Avatar & Info */}
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 rounded-lg">
                                    <AvatarFallback className={`${avatarColor} rounded-lg text-xs font-bold`}>
                                      {getAvatarFallback(order.customer)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">{order.customer}</p>
                                    <p className="text-xs text-muted-foreground truncate font-normal">{order.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              
                              {/* Date */}
                              <TableCell className="py-4 text-sm font-normal text-foreground">
                                {order.date}
                              </TableCell>
                              
                              {/* Items quantity */}
                              <TableCell className="py-4 text-sm font-normal text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span>{order.items} {order.items === 1 ? 'item' : 'items'}</span>
                                </div>
                              </TableCell>
                              
                              {/* Total Price */}
                              <TableCell className="py-4 text-sm font-black text-foreground">
                                {fmtPrice(order.amount)}
                              </TableCell>
                              
                              {/* Payment status badge */}
                              <TableCell className="py-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    order.paymentStatus === 'paid' 
                                      ? 'bg-emerald-500' 
                                      : order.paymentStatus === 'pending'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`} />
                                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                    {order.paymentStatus}
                                  </span>
                                </div>
                              </TableCell>
                              
                              {/* Detailed status pill */}
                              <TableCell className="py-4">
                                <Badge className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${statusInfo.color} select-none`}>
                                  <statusInfo.icon className="h-3 w-3 mr-1.5 shrink-0" />
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              
                              {/* Tracking code */}
                              <TableCell className="py-4">
                                {order.trackingNumber ? (
                                  <span className="font-mono text-xs font-semibold tracking-wide text-foreground px-2 py-0.5 rounded bg-muted/30 border border-border/20">
                                    {order.trackingNumber}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs font-normal italic">-</span>
                                )}
                              </TableCell>

                              {/* Dropdown Menu actions */}
                              <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={
                                    <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  } />
                                  <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 backdrop-blur-lg w-48">
                                    <DropdownMenuItem onClick={() => setSelectedOrder(order)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                      <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" />
                                      Quick Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                      <Download className="mr-2 h-4 w-4 text-[#14b8a6]" />
                                      Download Invoice
                                    </DropdownMenuItem>
                                    <Separator className="my-1 border-border/10" />
                                    
                                    {order.status === 'pending' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processing')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                        <Package className="mr-2 h-4 w-4 text-blue-500" />
                                        Process Order
                                      </DropdownMenuItem>
                                    )}
                                    {order.status === 'processing' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                        <Truck className="mr-2 h-4 w-4 text-cyan-500" />
                                        Ship Order
                                      </DropdownMenuItem>
                                    )}
                                    {order.status === 'shipped' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                        Deliver Order
                                      </DropdownMenuItem>
                                    )}
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                        <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                                        Cancel Order
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick View Slide-Out Panel Sheet */}
        <Sheet open={selectedOrder !== null} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedOrder && (
              <>
                {/* Header Section */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedOrder.id}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusConfig[selectedOrder.status as keyof typeof statusConfig].color}`}>
                        {statusConfig[selectedOrder.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" title="Print Invoice">
                        <Printer className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" title="Download receipt">
                        <Download className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Placed on {selectedOrder.date}</span>
                  </div>
                </div>

                {/* Main Scroll Content Area */}
                <ScrollArea className="flex-1 p-6 space-y-8 h-full overflow-y-auto">
                  {/* Workflow / Stepper Progress timeline */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order Progress Timeline</h3>
                    
                    <div className="relative pl-8 space-y-6 pt-1">
                      {/* Vertical connector line */}
                      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
                      
                      {/* Step 1: Placed / Pending */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['pending', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          ✓
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Order Placed</span>
                          <span className="text-xs text-muted-foreground mt-0.5">Customer placed order on {selectedOrder.date}</span>
                        </div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['processing', 'shipped', 'delivered'].includes(selectedOrder.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedOrder.status === 'pending'
                            ? 'bg-card border-amber-500 text-amber-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {['processing', 'shipped', 'delivered'].includes(selectedOrder.status) ? '✓' : '2'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Payment & Processing</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {['processing', 'shipped', 'delivered'].includes(selectedOrder.status)
                              ? 'Payment cleared and items packed for dispatch'
                              : 'Awaiting administrator verification and picking'}
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          ['shipped', 'delivered'].includes(selectedOrder.status)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedOrder.status === 'processing'
                            ? 'bg-card border-blue-500 text-blue-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {['shipped', 'delivered'].includes(selectedOrder.status) ? '✓' : '3'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Shipped / Dispatched</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {['shipped', 'delivered'].includes(selectedOrder.status)
                              ? `Dispatched via carrier. Tracking: ${selectedOrder.trackingNumber}`
                              : 'Awaiting dispatch scheduling'}
                          </span>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative flex gap-4">
                        <div className={`absolute -left-[28px] h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                          selectedOrder.status === 'delivered'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : selectedOrder.status === 'shipped'
                            ? 'bg-card border-cyan-500 text-cyan-500 animate-pulse'
                            : 'bg-card border-border text-muted-foreground'
                        }`}>
                          {selectedOrder.status === 'delivered' ? '✓' : '4'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">Delivered</span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {selectedOrder.status === 'delivered'
                              ? 'Successfully received by customer'
                              : 'Pending carrier delivery confirmation'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 border-border/10" />

                  {/* Customer Information Cards */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* General customer info card */}
                      <Card className="border-border/30 bg-muted/15 rounded-lg shadow-sm">
                        <CardContent className="p-4 space-y-3 flex flex-col">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <User className="h-4 w-4 text-[#14b8a6]" />
                            <span>{selectedOrder.customer}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{selectedOrder.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Phone: {selectedOrder.phone}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Delivery address card */}
                      <Card className="border-border/30 bg-muted/15 rounded-lg shadow-sm">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <MapPin className="h-4 w-4 text-[#14b8a6]" />
                            <span>Delivery Destination</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedOrder.address}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator className="my-6 border-border/10" />

                  {/* Receipt Items breakdown list */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Receipt Breakdown</h3>
                    <div className="border border-border/30 rounded-xl overflow-hidden bg-muted/5 divide-y divide-border/20">
                      {getOrderItems(selectedOrder).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-card/25">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-light">
                              <span>Size: {item.size}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-border" />
                              <span>Color: {item.color}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                            <span className="text-sm font-bold text-foreground">{fmtPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Summary calculations */}
                      <div className="p-4 bg-muted/20 space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{fmtPrice(selectedOrder.subtotal || Math.max(0, selectedOrder.amount - (selectedOrder.shippingFee || 0) - (selectedOrder.taxAmount || 0)))}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping Fee</span>
                          <span>{selectedOrder.shippingFee > 0 ? fmtPrice(selectedOrder.shippingFee) : 'Free'}</span>
                        </div>
                        <div className="flex justify-between text-foreground font-semibold py-1 border-y border-border/30 my-1">
                          <span>Tax / GST</span>
                          <span>{fmtPrice(selectedOrder.taxAmount ? selectedOrder.taxAmount : Math.round((selectedOrder.amount * 0.18) * 100) / 100)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-foreground pt-1">
                          <span>Grand Total</span>
                          <span className="text-primary text-base">{fmtPrice(selectedOrder.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Status Transitions Drawer footer actions */}
                <div className="p-6 border-t border-border/20 bg-muted/15 flex flex-wrap gap-2 justify-between items-center z-10 shrink-0">
                  <div>
                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                        <AlertCircle className="h-4 w-4 text-[#14b8a6]" />
                        <span>Available transitions in pipeline</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Order workflow finalized</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Stepper dynamic button triggers */}
                    {selectedOrder.status === 'pending' && (
                      <Button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <Package className="h-4 w-4" /> Approve & Pick
                      </Button>
                    )}
                    
                    {selectedOrder.status === 'processing' && (
                      <Button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <Truck className="h-4 w-4" /> Ship Order
                      </Button>
                    )}
                    
                    {selectedOrder.status === 'shipped' && (
                      <Button 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" /> Complete Delivery
                      </Button>
                    )}

                    {/* Cancel action */}
                    {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                      <Button 
                        variant="ghost" 
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                        className="text-rose-500 hover:bg-rose-500/10 rounded-lg h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" /> Cancel Order
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
