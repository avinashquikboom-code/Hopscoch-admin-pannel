'use client';
import { API_BASE, getImageUrl } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/toast';
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
  DropdownMenuSeparator,
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
  Eye,
  Upload,
  Star,
  Package,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Tag,
  Hash,
  AlignLeft,
  Crown,
  Info,
  Globe,
  EyeOff,
  AlertTriangle,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeBrand(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    name: raw.name || 'Unnamed Brand',
    slug: raw.slug || raw.name?.toLowerCase().replace(/\s+/g, '-') || '',
    description: raw.description || '',
    status: (raw.status || (raw.isActive !== false ? 'active' : 'inactive')).toLowerCase(),
    isFeatured: raw.isFeatured ?? false,
    order: Number(raw.order || raw.displayOrder || 1),
    productCount: Number(raw.productCount ?? raw._count?.products ?? 0),
    logoUrl: raw.logoUrl || raw.logo_url || '',
    bannerUrl: raw.bannerUrl || raw.banner_url || '',
  };
}

const brandColors = [
  'from-teal-500 to-cyan-400 text-white shadow-teal-500/10',
  'from-violet-500 to-purple-400 text-white shadow-violet-500/10',
  'from-rose-500 to-pink-400 text-white shadow-rose-500/10',
  'from-amber-500 to-orange-400 text-white shadow-amber-500/10',
];

export default function BrandsPage() {
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', isFeatured: false, order: '1' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/brands`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load brands');
      const raw = json.data ?? json.brands ?? json ?? [];
      setBrandsList(Array.isArray(raw) ? raw.map(normalizeBrand) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    let logoUrl = '';
    let bannerUrl = '';

    try {
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const logoRes = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: logoFormData,
        });
        if (logoRes.ok) {
          const logoJson = await logoRes.json();
          logoUrl = logoJson.data?.url || logoJson.url || '';
        }
      }

      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append('file', bannerFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const bannerRes = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: bannerFormData,
        });
        if (bannerRes.ok) {
          const bannerJson = await bannerRes.json();
          bannerUrl = bannerJson.data?.url || bannerJson.url || '';
        }
      }
    } catch (err) {
      console.error('Error uploading brand files:', err);
    }

    const body = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      isFeatured: formData.isFeatured,
      order: parseInt(formData.order) || 1,
      status: 'active',
      logoUrl,
      bannerUrl,
    };
    try {
      const res = await fetch(`${API_BASE}/api/brands`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      if (res.ok) { 
        await fetchBrands();
      }
    } catch (err: any) { 
      console.error(err);
    }
    setFormData({ name: '', slug: '', description: '', isFeatured: false, order: '1' });
    setLogoFile(null);
    setBannerFile(null);
    setIsAddOpen(false);
  };

  const handleToggleStatus = async (id: string) => {
    setBrandsList(prev => 
      prev.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b)
    );
    setSelectedBrand((prev: any) => prev && prev.id === id ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : prev);
    try {
      const target = brandsList.find(b => b.id === id);
      if (target) {
        await fetch(`${API_BASE}/api/brands/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ status: target.status === 'active' ? 'inactive' : 'active' })
        });
      }
    } catch {}
  };

  const handleToggleFeatured = async (id: string) => {
    setBrandsList(prev => 
      prev.map(b => b.id === id ? { ...b, isFeatured: !b.isFeatured } : b)
    );
    setSelectedBrand((prev: any) => prev && prev.id === id ? { ...prev, isFeatured: !prev.isFeatured } : prev);
    try {
      const target = brandsList.find(b => b.id === id);
      if (target) {
        await fetch(`${API_BASE}/api/brands/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ isFeatured: !target.isFeatured })
        });
      }
    } catch {}
  };

  const handleDeleteBrand = async (id: string) => {
    setBrandsList(prev => prev.filter(b => b.id !== id));
    setSelectedBrand(null);
    try {
      await fetch(`${API_BASE}/api/brands/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
  };

  const filteredBrands = useMemo(() => {
    return brandsList.filter(
      (brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brandsList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const brandColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Brand' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'productCount', header: 'Products' },
    { accessorKey: 'order', header: 'Sort Order' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'isFeatured', header: 'Featured' },
  ], []);

  const brandTable = useReactTable({
    data: filteredBrands,
    columns: brandColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = brandsList.length;
    const featuredCount = brandsList.filter((b) => b.isFeatured).length;
    const activeCount = brandsList.filter((b) => b.status === 'active').length;
    return {
      totalCount,
      featuredCount,
      activeCount
    };
  }, [brandsList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Brand"
          titlePart2="Management"
          badgeText="Brands Command Center"
          subtitle="Manage and organize your product brands and label catalog classifications."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Add Brand
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Brands</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2">{stats.totalCount} Labels</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Featured Brands</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-amber-500">{stats.featuredCount} Highlighting</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Star className="h-5.5 w-5.5 fill-amber-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Status</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-emerald-500">{stats.activeCount} Live</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brands Table Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Catalog Labels</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search brands by label or slug..."
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
                      <Button variant="ghost" onClick={() => brandTable.getColumn('name')?.toggleSorting(brandTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Brand <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Slug</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => brandTable.getColumn('productCount')?.toggleSorting(brandTable.getColumn('productCount')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Products <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => brandTable.getColumn('order')?.toggleSorting(brandTable.getColumn('order')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Sort Order <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Featured</TableHead>
                    <TableHead className="w-16 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading brands...</TableCell></TableRow>
                  ) : brandTable.getRowModel().rows.length ? (
                    brandTable.getRowModel().rows.map((row) => {
                    const brand = row.original;
                    const idx = row.index;
                    return (
                    <TableRow 
                      key={row.id}
                      onClick={() => setSelectedBrand(brand)}
                      className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                    >
                      {/* Name & Avatar */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {brand.logoUrl ? (
                            <img 
                              src={getImageUrl(brand.logoUrl)} 
                              alt={brand.name} 
                              className="h-10 w-10 rounded-lg object-cover flex-shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-tr ${brandColors[idx % brandColors.length]} flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm`}>
                              {brand.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{brand.name}</p>
                            <p className="text-xs text-muted-foreground truncate font-normal">{brand.description}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell className="py-4">
                        <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                          {brand.slug}
                        </span>
                      </TableCell>

                      {/* Product Count */}
                      <TableCell className="py-4 text-center font-semibold text-foreground">
                        {brand.productCount} SKUs
                      </TableCell>

                      {/* Order */}
                      <TableCell className="py-4 text-center text-sm text-muted-foreground font-normal">
                        {brand.order}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 text-center">
                        <Badge
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                            brand.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}
                        >
                          {brand.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Featured Star */}
                      <TableCell className="py-4">
                        <div className="flex justify-center">
                          {brand.isFeatured ? (
                            <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions dropdown */}
                      <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          } />
                          <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-36">
                            <DropdownMenuItem onClick={() => setSelectedBrand(brand)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                              <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(brand.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                              <Star className="mr-2 h-4 w-4 text-amber-500" />
                              {brand.isFeatured ? 'Unfeature' : 'Featured Brand'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(brand.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                              {brand.status === 'active' ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4 text-amber-500" /> Mark Inactive
                                </>
                              ) : (
                                <>
                                  <Globe className="mr-2 h-4 w-4 text-emerald-500" /> Activate Brand
                                  </>
                              )}
                            </DropdownMenuItem>
                            <Separator className="my-1 border-border/10" />
                            <DropdownMenuItem onClick={() => handleDeleteBrand(brand.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
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
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching brands found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredBrands.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {brandTable.getFilteredRowModel().rows.length} of {filteredBrands.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => brandTable.previousPage()} disabled={!brandTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {brandTable.getState().pagination.pageIndex + 1} / {brandTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => brandTable.nextPage()} disabled={!brandTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Brand Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add Brand Label
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Set brand name, slug details, order priorities and home highlighting visibility.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateBrand} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Name</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter brand name" 
                      className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Slug</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="aura-original" 
                        className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort Order</Label>
                    <Input 
                      id="order" 
                      type="number" 
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="h-11 rounded-lg border-border/50 focus:border-primary" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Bio / Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this brand catalog focus..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="logo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Logo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setLogoFile(e.target.files[0]);
                          }
                        }}
                        className="rounded-lg border-border/50 focus:border-primary cursor-pointer pt-2 text-xs"
                      />
                      {logoFile && (
                        <div className="w-10 h-10 rounded-lg border border-border/40 overflow-hidden flex-shrink-0 relative group">
                          <img 
                            src={URL.createObjectURL(logoFile)} 
                            alt="logo preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setLogoFile(null)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="banner" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Banner</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="banner"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setBannerFile(e.target.files[0]);
                          }
                        }}
                        className="rounded-lg border-border/50 focus:border-primary cursor-pointer pt-2 text-xs"
                      />
                      {bannerFile && (
                        <div className="w-10 h-10 rounded-lg border border-border/40 overflow-hidden flex-shrink-0 relative group">
                          <img 
                            src={URL.createObjectURL(bannerFile)} 
                            alt="banner preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setBannerFile(null)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isFeatured" 
                    checked={formData.isFeatured} 
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-border/60 text-primary accent-primary h-4 w-4"
                  />
                  <Label htmlFor="isFeatured" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Highlight this brand as Featured on the homepage
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Save Brand
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedBrand !== null} onOpenChange={(open) => { if (!open) setSelectedBrand(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedBrand && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedBrand.slug}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedBrand.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedBrand.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg ${selectedBrand.isFeatured ? 'text-amber-500 bg-amber-500/5 border-amber-500/20' : ''}`} 
                        onClick={() => handleToggleFeatured(selectedBrand.id)}
                        title="Toggle Featured"
                      >
                        <Star className="h-4.5 w-4.5 fill-current" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteBrand(selectedBrand.id)}
                        title="Delete Brand"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedBrand.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">Hierarchy Position Order: {selectedBrand.order}</p>
                  </div>
                </div>

                 {/* Content */}
                 <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  {/* Brand Banner/Logo Preview */}
                  {selectedBrand.bannerUrl ? (
                    <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group mb-4">
                      <img 
                        src={getImageUrl(selectedBrand.bannerUrl)} 
                        alt={selectedBrand.name} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                        Brand Banner
                      </span>
                    </div>
                  ) : selectedBrand.logoUrl ? (
                    <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group mb-4 flex items-center justify-center bg-muted/20">
                      <img 
                        src={getImageUrl(selectedBrand.logoUrl)} 
                        alt={selectedBrand.name} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                        Brand Logo
                      </span>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-primary" /> Active Catalog Products
                        </span>
                        <h4 className="text-2xl font-black text-foreground mt-1.5">{selectedBrand.productCount} SKUs</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Crown className="h-3.5 w-3.5 text-primary" /> Label Status
                        </span>
                        <h4 className="text-lg font-bold text-foreground mt-2 capitalize">{selectedBrand.status}</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Brand Narrative</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">
                      {selectedBrand.description || "No narrative set for this label brand."}
                    </p>
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
