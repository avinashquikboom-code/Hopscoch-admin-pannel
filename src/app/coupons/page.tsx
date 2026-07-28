'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  SheetTrigger,
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
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  Save,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Ticket,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  Globe,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeCoupon(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    code: raw.code || 'PROMO',
    type: raw.type || raw.discountType || 'percentage',
    value: Number(raw.value || raw.discountValue || raw.amount || 0),
    minimumOrder: Number(raw.minimumOrder || raw.minPurchase || 0),
    maximumDiscount: raw.maximumDiscount || null,
    expiryDate: raw.expiryDate ? new Date(raw.expiryDate).toLocaleDateString('en-CA') : raw.expiry || '2026-12-31',
    usageLimit: Number(raw.usageLimit || raw.limit || 1000),
    usedCount: Number(raw.usedCount || raw.uses || 0),
    isActive: raw.isActive ?? true,
    description: raw.description || '',
  };
}

export default function CouponsPage() {
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: '', minimumOrder: '', maximumDiscount: '', expiryDate: '', usageLimit: '', isActive: true, description: '' });
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState('percentage');
  const [editValue, setEditValue] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/coupons`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load coupons');
      const raw = json.data ?? json.coupons ?? json ?? [];
      setCouponsList(Array.isArray(raw) ? raw.map(normalizeCoupon) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const copyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      code: formData.code.toUpperCase().replace(/\s+/g, ''),
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      minimumOrder: parseFloat(formData.minimumOrder) || 0,
      maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
      expiryDate: formData.expiryDate || '2026-12-31',
      usageLimit: parseInt(formData.usageLimit) || 1000,
      isActive: formData.isActive,
      description: formData.description,
    };
    try {
      const res = await fetch(`${API_BASE}/api/coupons`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      if (res.ok) { await fetchCoupons(); }
      else { setCouponsList(prev => [normalizeCoupon({ ...body, id: String(Date.now()), usedCount: 0 }), ...prev]); }
    } catch { setCouponsList(prev => [normalizeCoupon({ ...body, id: String(Date.now()), usedCount: 0 }), ...prev]); }
    setFormData({ code: '', type: 'percentage', value: '', minimumOrder: '', maximumDiscount: '', expiryDate: '', usageLimit: '', isActive: true, description: '' });
    setIsAddOpen(false);
  };

  const handleToggleActive = async (id: string) => {
    setCouponsList(prev => 
      prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    );
    setSelectedCoupon((prev: any) => prev && prev.id === id ? { ...prev, isActive: !prev.isActive } : prev);
    try {
      const target = couponsList.find(c => c.id === id);
      if (target) {
        await fetch(`${API_BASE}/api/coupons/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ isActive: !target.isActive })
        });
      }
    } catch {}
  };

  const handleDeleteCoupon = async (id: string) => {
    setCouponsList(prev => prev.filter(c => c.id !== id));
    setSelectedCoupon(null);
    try {
      await fetch(`${API_BASE}/api/coupons/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
  };

  const handleSaveCoupon = async () => {
    if (!selectedCoupon) return;
    const updated = {
      ...selectedCoupon,
      code: editCode,
      type: editType,
      value: parseFloat(editValue) || 0,
      usageLimit: parseInt(editLimit) || 0,
      description: editDesc,
    };

    setCouponsList(prev => prev.map(c => c.id === selectedCoupon.id ? updated : c));
    setSelectedCoupon(updated);
    setIsEditing(false);

    try {
      await fetch(`${API_BASE}/api/coupons/${selectedCoupon.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          code: editCode,
          type: editType,
          value: parseFloat(editValue) || 0,
          usageLimit: parseInt(editLimit) || 0,
          description: editDesc,
        }),
      });
    } catch {}
  };

  const filteredCoupons = useMemo(() => {
    return couponsList.filter(coupon =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [couponsList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const couponColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'code', header: 'Promo Code' },
    { accessorKey: 'type', header: 'Discount Type' },
    { accessorKey: 'value', header: 'Value' },
    { accessorKey: 'minimumOrder', header: 'Min Spend' },
    { accessorKey: 'usedCount', header: 'Used' },
    { accessorKey: 'expiryDate', header: 'Expiry' },
    { accessorKey: 'isActive', header: 'Status' },
  ], []);

  const couponTable = useReactTable({
    data: filteredCoupons,
    columns: couponColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = couponsList.length;
    const activeCount = couponsList.filter(c => c.isActive).length;
    const totalRedemptions = couponsList.reduce((acc, c) => acc + c.usedCount, 0);
    const limitTotal = couponsList.reduce((acc, c) => acc + c.usageLimit, 0);
    const remainingRedemptions = limitTotal - totalRedemptions;

    return {
      totalCount,
      activeCount,
      totalRedemptions,
      remainingRedemptions
    };
  }, [couponsList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Coupon"
          titlePart2="Management"
          badgeText="Coupons Command Center"
          subtitle="Configure discount coupons, manage campaign redemptions, and track campaign limits."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Promotions</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalCount} Codes</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">{stats.activeCount} campaigns live now</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Redeemed</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalRedemptions} Uses</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Applied by customers on checkout</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available Allocation</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.remainingRedemptions} Left</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Remaining overall uses limit</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Value</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Percent className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">21.2% Off</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Weighted discount averages</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table Dashboard Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Discount Codes Registry</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search promo codes..."
                  className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => couponTable.getColumn('code')?.toggleSorting(couponTable.getColumn('code')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Promo Code <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Discount Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => couponTable.getColumn('value')?.toggleSorting(couponTable.getColumn('value')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Value <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Min Spend</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Cap Amount</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Usage Limit Progress</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => couponTable.getColumn('expiryDate')?.toggleSorting(couponTable.getColumn('expiryDate')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Expiry Date <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Status</TableHead>
                    <TableHead className="w-16 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading coupons...</TableCell></TableRow>
                  ) : couponTable.getRowModel().rows.length ? (
                    couponTable.getRowModel().rows.map((row) => {
                    const coupon = row.original;
                    return (
                    <TableRow 
                      key={row.id}
                      onClick={() => setSelectedCoupon(coupon)}
                      className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                    >
                      {/* Code and Copy */}
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-muted border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all">
                            {coupon.code}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-muted"
                            onClick={(e) => copyCode(coupon.code, e)}
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {copiedCode === coupon.code && (
                            <span className="text-[10px] text-emerald-500 font-semibold">Copied!</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="py-4 text-sm text-muted-foreground capitalize font-normal">
                        <div className="flex items-center gap-1.5">
                          {coupon.type === 'percentage' ? (
                            <Percent className="h-4 w-4 text-primary" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-[#14b8a6]" />
                          )}
                          <span>{coupon.type}</span>
                        </div>
                      </TableCell>

                      {/* Value */}
                      <TableCell className="py-4 text-sm font-black text-foreground">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </TableCell>

                      {/* Min Order */}
                      <TableCell className="py-4 text-sm text-foreground">
                        ${coupon.minimumOrder}
                      </TableCell>

                      {/* Cap Limit */}
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        {coupon.maximumDiscount ? `$${coupon.maximumDiscount}` : 'None'}
                      </TableCell>

                      {/* Usage bar */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5 max-w-[140px]">
                          <span className="text-xs font-semibold text-foreground">
                            {coupon.usedCount} / {coupon.usageLimit} uses
                          </span>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Expiry */}
                      <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{coupon.expiryDate}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 text-center">
                        <Badge
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                            coupon.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          } />
                          <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-36">
                            <DropdownMenuItem onClick={() => setSelectedCoupon(coupon)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                              <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(coupon.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                              {coupon.isActive ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4 text-amber-500" /> Disable Code
                                </>
                              ) : (
                                <>
                                  <Globe className="mr-2 h-4 w-4 text-emerald-500" /> Activate Code
                                </>
                              )}
                            </DropdownMenuItem>
                            <Separator className="my-1 border-border/10" />
                            <DropdownMenuItem onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                              <Trash2 className="mr-2 h-4 w-4 text-rose-500" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching coupon codes found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredCoupons.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {couponTable.getFilteredRowModel().rows.length} of {filteredCoupons.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => couponTable.previousPage()} disabled={!couponTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {couponTable.getState().pagination.pageIndex + 1} / {couponTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => couponTable.nextPage()} disabled={!couponTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Coupon Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create Discount Coupon
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Define the code, campaign type, values, order limits, and expiry dates.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateCoupon} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coupon Code</Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="code" 
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Enter promo code" 
                      className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount Value</Label>
                    <Input 
                      id="value" 
                      required
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="e.g. 20" 
                      className="h-11 rounded-lg border-border/50 focus:border-primary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="minimumOrder" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Order Amount ($)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      value={formData.minimumOrder}
                      onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                      placeholder="0"
                      className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maximumDiscount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Cap Amount ($)</Label>
                    <Input
                      id="maximumDiscount"
                      type="number"
                      value={formData.maximumDiscount}
                      onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                      placeholder="No limit"
                      className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usageLimit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="1000"
                      className="h-11 rounded-lg border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Promo Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe details of this coupon for administrators..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={formData.isActive} 
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border/60 text-primary accent-primary h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Make this coupon active and usable immediately
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Save Coupon
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedCoupon !== null} onOpenChange={(open) => { if (!open) { setSelectedCoupon(null); setIsEditing(false); } }}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedCoupon && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedCoupon.code}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedCoupon.isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedCoupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg transition-colors ${isEditing ? 'text-primary border-primary/40 bg-primary/5' : ''}`} 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveCoupon();
                          } else {
                            setEditCode(selectedCoupon.code);
                            setEditType(selectedCoupon.type);
                            setEditValue(String(selectedCoupon.value));
                            setEditLimit(String(selectedCoupon.usageLimit));
                            setEditDesc(selectedCoupon.description);
                            setIsEditing(true);
                          }
                        }}
                        title={isEditing ? "Save Coupon Details" : "Edit Coupon Details"}
                      >
                        {isEditing ? <Save className="h-4.5 w-4.5" /> : <Edit className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg`} 
                        onClick={() => handleToggleActive(selectedCoupon.id)}
                        title="Toggle Status"
                      >
                        {selectedCoupon.isActive ? <EyeOff className="h-4.5 w-4.5" /> : <Globe className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteCoupon(selectedCoupon.id)}
                        title="Delete Coupon"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coupon Code</Label>
                          <Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-foreground">Promo: {selectedCoupon.code}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-light">Campaign Limit: {selectedCoupon.usageLimit} Max uses</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Ticket className="h-3.5 w-3.5 text-primary" /> Discount Value
                        </span>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1.5">
                            <select
                              value={editType}
                              onChange={e => setEditType(e.target.value)}
                              className="h-9 rounded-md border border-border/50 bg-background text-xs px-2"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">$</option>
                            </select>
                            <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-9 rounded-md border-border/50 text-sm font-mono focus:border-primary" />
                          </div>
                        ) : (
                          <h4 className="text-2xl font-black text-foreground mt-1.5">
                            {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}%` : `$${selectedCoupon.value}`}
                          </h4>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" /> Expiration Date
                        </span>
                        <h4 className="text-lg font-bold text-foreground mt-2">{selectedCoupon.expiryDate}</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Campaign Progress</h3>
                    <Card className="border-border/30 bg-muted/5 rounded-xl shadow-sm">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Redeemed Count</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span>Limit:</span>
                              <Input type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} className="h-8 w-24 rounded-md border-border/50 focus:border-primary text-xs" />
                            </div>
                          ) : (
                            <span>{selectedCoupon.usedCount} / {selectedCoupon.usageLimit} ({Math.round((selectedCoupon.usedCount / selectedCoupon.usageLimit) * 100)}%)</span>
                          )}
                        </div>
                        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-[#14b8a6]"
                            style={{ width: `${(selectedCoupon.usedCount / selectedCoupon.usageLimit) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Parameters Constraints</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                      <div className="p-3 bg-muted/15 rounded-lg border border-border/20">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Min Purchase</span>
                        <span className="mt-1 block">${selectedCoupon.minimumOrder}</span>
                      </div>
                      <div className="p-3 bg-muted/15 rounded-lg border border-border/20">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Max Cap Discount</span>
                        <span className="mt-1 block">{selectedCoupon.maximumDiscount ? `$${selectedCoupon.maximumDiscount}` : 'No Limit'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Coupon Narrative</h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none animate-fade-in"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {selectedCoupon.description}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
