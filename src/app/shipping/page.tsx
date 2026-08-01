'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
  Truck, Package, CheckCircle2, XCircle, RefreshCw,
  Clock, TrendingUp, ArrowUpRight, DollarSign, Calendar,
  MapPin, BarChart2, Search, ArrowUp, ArrowDown, Plus, Sparkles,
  Info, Eye, Trash2, FileText, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/toast';



function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeShipment(raw: any) {
  const shipment = raw.shipment || {};
  return {
    id: raw.id || `ORD-${raw.id}`,
    shipment_id: shipment.shipmentId || '',
    orderId: raw.id,
    orderNumber: raw.orderNumber,
    customer: `${raw.user?.firstName || ''} ${raw.user?.lastName || ''}`.trim() || 'Customer',
    courier: shipment.courier || 'Courier Partner',
    awb: shipment.awb || '',
    status: shipment.status || raw.status || 'PENDING',
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('en-CA') : new Date(raw.createdAt).toLocaleDateString('en-CA'),
    city: raw.address?.city || 'Mumbai',
    labelUrl: shipment.labelUrl || '',
    invoiceUrl: shipment.invoiceUrl || raw.invoiceUrl || '',
  };
}

const areaData = [
  { day: 'Mon', shipped: 82, delivered: 65 },
  { day: 'Tue', shipped: 91, delivered: 78 },
  { day: 'Wed', shipped: 74, delivered: 69 },
  { day: 'Thu', shipped: 103, delivered: 88 },
  { day: 'Fri', shipped: 118, delivered: 95 },
  { day: 'Sat', shipped: 96, delivered: 84 },
  { day: 'Sun', shipped: 67, delivered: 55 },
];

const statusStyles: Record<string, string> = {
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  SHIPPED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  AWB_ASSIGNED: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  CREATED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  CONFIRMED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  PROCESSING: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function ShippingDashboardPage() {
  const [shipmentsList, setShipmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState({
    pending: 0,
    inTransit: 0,
    delivered: 0,
    rto: 0,
    returns: 0,
    total: 0
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/shipping/dashboard`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/shipping/all`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load shipments');
      const raw = json.data?.shipments || [];
      setShipmentsList(raw.map(normalizeShipment));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchShipments();
  }, [fetchDashboardStats, fetchShipments]);

  const filteredShipments = useMemo(() => {
    return shipmentsList.filter(s =>
      s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.courier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shipmentsList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const shipmentColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'Order ID' },
    { accessorKey: 'shipment_id', header: 'Shipment Ref' },
    { accessorKey: 'customer', header: 'Customer Name' },
    { accessorKey: 'city', header: 'Destination City' },
    { accessorKey: 'courier', header: 'Carrier Courier' },
    { accessorKey: 'date', header: 'Created Date' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const shipmentTable = useReactTable({
    data: filteredShipments,
    columns: shipmentColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Shipment Action handlers
  const handleShipmentAction = async (action: string, orderId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/shipping/${action}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${action.toUpperCase()} action processed successfully.`);
        // Reload details
        fetchShipments();
        fetchDashboardStats();
        setSelectedShipment(null);
      } else {
        toast.error(data.message || `Action ${action} failed.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Shipping"
          titlePart2="Dashboard"
          badgeText="Logistics Command Center"
          subtitle="Monitor all outgoing shipments, evaluate carrier performances, and audit courier deliveries."
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Shipments</span>
                <div className="p-2 rounded-lg bg-[#14b8a6]/10 text-[#14b8a6]">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Dispatch</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.pending}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">In Transit</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.inTransit}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Delivered</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.delivered}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Registry Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Active Shipping Ledger</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                <Input
                  placeholder="Search shipments..."
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Order ID</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Shipment Ref</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => shipmentTable.getColumn('customer')?.toggleSorting(shipmentTable.getColumn('customer')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Customer Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Destination City</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Carrier Courier</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => shipmentTable.getColumn('date')?.toggleSorting(shipmentTable.getColumn('date')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-[#14b8a6] text-xs uppercase tracking-wider">
                        Created Date <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading shipments...</TableCell></TableRow>
                  ) : shipmentTable.getRowModel().rows.length ? (
                    shipmentTable.getRowModel().rows.map((row) => {
                    const shp = row.original;
                    return (
                    <TableRow 
                      key={row.id}
                      onClick={() => setSelectedShipment(shp)}
                      className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                    >
                      <TableCell className="py-4 font-mono font-bold text-xs">{shp.id}</TableCell>
                      <TableCell className="py-4 font-mono text-xs text-muted-foreground">{shp.shipment_id || 'Not Created'}</TableCell>
                      <TableCell className="py-4 font-semibold text-sm text-foreground">{shp.customer}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{shp.city}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-foreground">{shp.courier}</TableCell>
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{shp.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={`text-xs font-semibold rounded-md px-2.5 py-1 border border-transparent ${statusStyles[shp.status.toUpperCase()] || 'bg-zinc-500/10 text-zinc-500'}`}>
                          {shp.status}
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
                          <p className="text-sm font-semibold text-muted-foreground">No shipments found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredShipments.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {shipmentTable.getFilteredRowModel().rows.length} of {filteredShipments.length} shipments
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => shipmentTable.previousPage()} disabled={!shipmentTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {shipmentTable.getState().pagination.pageIndex + 1} / {shipmentTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => shipmentTable.nextPage()} disabled={!shipmentTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedShipment !== null} onOpenChange={(open) => { if (!open) setSelectedShipment(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedShipment && (
              <>
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg">
                        {selectedShipment.id}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[selectedShipment.status.toUpperCase()] || 'bg-zinc-500/10 text-zinc-500'}`}>
                        {selectedShipment.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Shipment Management</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">Manage shipping actions and AWB details.</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-primary" /> Shipment ID
                        </span>
                        <h4 className="text-sm font-mono mt-1.5">{selectedShipment.shipment_id || 'Not Created'}</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> AWB Number
                        </span>
                        <h4 className="text-sm font-mono mt-1.5">{selectedShipment.awb || 'No AWB Assigned'}</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Courier & Destination</h3>
                    <div className="p-4 rounded-xl border border-border/30 bg-muted/15 space-y-2 text-sm font-semibold">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">Customer Name</span>
                        <span>{selectedShipment.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">City</span>
                        <span>{selectedShipment.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-normal">Carrier Courier</span>
                        <span>{selectedShipment.courier}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Courier & Logistics Operations</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {!selectedShipment.shipment_id && (
                        <Button
                          disabled={actionLoading}
                          onClick={() => handleShipmentAction('create', selectedShipment.orderId)}
                          className="w-full text-xs font-bold py-2 rounded-lg"
                        >
                          Create Shipment
                        </Button>
                      )}
                      
                      {selectedShipment.shipment_id && !selectedShipment.awb && (
                        <Button
                          disabled={actionLoading}
                          onClick={() => handleShipmentAction('awb', selectedShipment.orderId)}
                          className="w-full text-xs font-bold py-2 rounded-lg"
                        >
                          Generate AWB
                        </Button>
                      )}

                      {selectedShipment.awb && (
                        <>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleShipmentAction('pickup', selectedShipment.orderId)}
                            className="w-full text-xs font-bold py-2 rounded-lg"
                          >
                            Schedule Pickup
                          </Button>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleShipmentAction('cancel', selectedShipment.orderId)}
                            variant="destructive"
                            className="w-full text-xs font-bold py-2 rounded-lg"
                          >
                            Cancel Shipment
                          </Button>
                        </>
                      )}

                      {selectedShipment.shipment_id && (
                        <>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleShipmentAction('label', selectedShipment.orderId)}
                            variant="outline"
                            className="w-full text-xs font-bold py-2 rounded-lg border-border"
                          >
                            Generate Label
                          </Button>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleShipmentAction('invoice', selectedShipment.orderId)}
                            variant="outline"
                            className="w-full text-xs font-bold py-2 rounded-lg border-border"
                          >
                            Generate Invoice
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PDFs Download */}
                  {(selectedShipment.labelUrl || selectedShipment.invoiceUrl) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Document Downloads</h3>
                      {selectedShipment.labelUrl && (
                        <a href={selectedShipment.labelUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-primary font-bold hover:underline">
                          <FileText className="w-4 h-4" /> Download Shipping Label PDF
                        </a>
                      )}
                      {selectedShipment.invoiceUrl && (
                        <a href={selectedShipment.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-primary font-bold hover:underline">
                          <FileText className="w-4 h-4" /> Download Customer Invoice PDF
                        </a>
                      )}
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
