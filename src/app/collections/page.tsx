'use client';
import api, { API_BASE, getImageUrl } from '@/lib/api';

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
  Calendar,
  Package,
  Layers,
  CheckCircle2,
  Sparkles,
  Tag,
  Hash,
  AlignLeft,
  Type,
  Globe,
  Info,
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

function normalizeCollection(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    name: raw.name || 'Unnamed Collection',
    slug: raw.slug || raw.name?.toLowerCase().replace(/\s+/g, '-') || '',
    type: raw.type || 'summer',
    description: raw.description || '',
    isActive: raw.isActive ?? true,
    order: Number(raw.order || raw.displayOrder || 1),
    productCount: Number(raw.productCount ?? raw._count?.products ?? 0),
    startDate: raw.startDate ? new Date(raw.startDate).toLocaleDateString('en-CA') : '',
    endDate: raw.endDate ? new Date(raw.endDate).toLocaleDateString('en-CA') : '',
    imageUrl: raw.imageUrl || raw.image_url || '',
  };
}

const collectionTypes = {
  summer: { label: 'Summer', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  winter: { label: 'Winter', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  festival: { label: 'Festival', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  luxury: { label: 'Luxury', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  featured: { label: 'Featured', color: 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20' },
  custom: { label: 'Custom', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const collectionGradients = [
  'from-amber-400 to-orange-500 text-white',
  'from-blue-400 to-cyan-500 text-white',
  'from-violet-400 to-purple-500 text-white',
  'from-rose-400 to-pink-500 text-white',
];

export default function CollectionsPage() {
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', type: 'summer', description: '', isActive: true, startDate: '', endDate: '', order: '1' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const json = await api.collections.getAll();
      const raw = json.data ?? json.collections ?? json ?? [];
      setCollectionsList(Array.isArray(raw) ? raw.map(normalizeCollection) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = '';

    try {
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const uploadRes = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: uploadFormData,
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          imageUrl = uploadJson.data?.url || uploadJson.url || '';
        }
      }
    } catch (err) {
      console.error('Error uploading collection file:', err);
    }

    const body = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      type: formData.type,
      description: formData.description,
      isActive: formData.isActive,
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      order: parseInt(formData.order) || 1,
      imageUrl,
    };
    try {
      await api.collections.create(body);
      await fetchCollections();
    } catch (err: any) { 
      console.error(err);
    }
    setFormData({ name: '', slug: '', type: 'summer', description: '', isActive: true, startDate: '', endDate: '', order: '1' });
    setImageFile(null);
    setIsAddOpen(false);
  };

  const handleToggleActive = async (id: string) => {
    setCollectionsList(prev =>
      prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    );
    setSelectedCollection((prev: any) => prev && prev.id === id ? { ...prev, isActive: !prev.isActive } : prev);
    try {
      const target = collectionsList.find(c => c.id === id);
      if (target) {
        await api.collections.update(id, { isActive: !target.isActive });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    setCollectionsList(prev => prev.filter(c => c.id !== id));
    setSelectedCollection(null);
    try {
      await api.collections.delete(id);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCollections = useMemo(() => {
    return collectionsList.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collectionsList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const collectionColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Collection' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'productCount', header: 'Products' },
    { accessorKey: 'startDate', header: 'Start' },
    { accessorKey: 'isActive', header: 'Status' },
  ], []);

  const collectionTable = useReactTable({
    data: filteredCollections,
    columns: collectionColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = collectionsList.length;
    const activeCount = collectionsList.filter((c) => c.isActive).length;
    const totalProductsMapped = collectionsList.reduce((acc, c) => acc + c.productCount, 0);
    return {
      totalCount,
      activeCount,
      totalProductsMapped
    };
  }, [collectionsList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Collection"
          titlePart2="Management"
          badgeText="Collections Command Center"
          subtitle="Create and manage curated product collections for your storefront drops."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Add Collection
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Collections</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2">{stats.totalCount} Drops</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Collections</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-emerald-500">{stats.activeCount} Online</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/5 to-purple-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Products Curated</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-violet-500">{stats.totalProductsMapped} SKUs</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Package className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collections Table Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Active Catalog Showcase</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search collections by drop name..."
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
                      <Button variant="ghost" onClick={() => collectionTable.getColumn('name')?.toggleSorting(collectionTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Collection <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Type</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => collectionTable.getColumn('productCount')?.toggleSorting(collectionTable.getColumn('productCount')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Products <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Date Range</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="w-16 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading collections...</TableCell></TableRow>
                  ) : collectionTable.getRowModel().rows.length ? (
                    collectionTable.getRowModel().rows.map((row) => {
                    const collection = row.original;
                    const idx = row.index;
                    const typeConfig = collectionTypes[collection.type as keyof typeof collectionTypes] || collectionTypes.custom;
                    return (
                      <TableRow 
                        key={row.id}
                        onClick={() => setSelectedCollection(collection)}
                        className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                      >
                        {/* Name and thumbnail */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            {collection.imageUrl ? (
                              <img 
                                src={getImageUrl(collection.imageUrl)} 
                                alt={collection.name} 
                                className="w-14 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm border border-border/20"
                              />
                            ) : (
                              <div className={`w-14 h-10 rounded-lg bg-gradient-to-br ${collectionGradients[idx % collectionGradients.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Layers className="h-4.5 w-4.5 text-white" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{collection.name}</p>
                              <p className="text-xs text-muted-foreground truncate font-normal">{collection.slug}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type badge */}
                        <TableCell className="py-4">
                          <Badge className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${typeConfig.color}`}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Mapped Products Count */}
                        <TableCell className="py-4 text-center font-semibold text-foreground">
                          {collection.productCount} products
                        </TableCell>

                        {/* Date Range */}
                        <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                          {collection.startDate && collection.endDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-muted-foreground/60" />
                              <span>{collection.startDate} – {collection.endDate}</span>
                            </div>
                          ) : (
                            <span className="italic text-xs text-muted-foreground/50">Always available</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          <Badge
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                              collection.isActive
                                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}
                          >
                            {collection.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-36">
                              <DropdownMenuItem onClick={() => setSelectedCollection(collection)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(collection.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                {collection.isActive ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4 text-amber-500" /> Hide Online
                                  </>
                                ) : (
                                  <>
                                    <Globe className="mr-2 h-4 w-4 text-emerald-500" /> Make Visible
                                  </>
                                )}
                              </DropdownMenuItem>
                              <Separator className="my-1 border-border/10" />
                              <DropdownMenuItem onClick={() => handleDeleteCollection(collection.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
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
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching collections found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredCollections.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {collectionTable.getFilteredRowModel().rows.length} of {filteredCollections.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => collectionTable.previousPage()} disabled={!collectionTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {collectionTable.getState().pagination.pageIndex + 1} / {collectionTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => collectionTable.nextPage()} disabled={!collectionTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Collection Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add Curated Collection
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Set showcase parameters, dates, and promotional type tags.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collection Name</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter collection name" 
                      className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Slug</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="summer-collection" 
                        className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Drop Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="summer">Summer</option>
                      <option value="winter">Winter</option>
                      <option value="festival">Festival</option>
                      <option value="luxury">Luxury</option>
                      <option value="featured">Featured</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what items are included in this drop showcase..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="image" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">Collection Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="rounded-lg border-border/50 focus:border-primary cursor-pointer pt-2 text-xs"
                    />
                    {imageFile && (
                      <div className="w-10 h-10 rounded-lg border border-border/40 overflow-hidden flex-shrink-0 relative group">
                        <img 
                          src={URL.createObjectURL(imageFile)} 
                          alt="collection preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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
                    Make this collection active on storefront immediately
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Save Drop
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedCollection !== null} onOpenChange={(open) => { if (!open) setSelectedCollection(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedCollection && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedCollection.slug}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedCollection.isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedCollection.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg`} 
                        onClick={() => handleToggleActive(selectedCollection.id)}
                        title="Toggle Status"
                      >
                        {selectedCollection.isActive ? <EyeOff className="h-4.5 w-4.5" /> : <Globe className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteCollection(selectedCollection.id)}
                        title="Delete Collection"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedCollection.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">Type Category: {selectedCollection.type.toUpperCase()}</p>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  {/* Collection Banner/Image Preview */}
                  {selectedCollection.imageUrl && (
                    <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group mb-4">
                      <img 
                        src={getImageUrl(selectedCollection.imageUrl)} 
                        alt={selectedCollection.name} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                        Collection Image
                      </span>
                    </div>
                  )}
                  {/* Grid cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-primary" /> Curated Products
                        </span>
                        <h4 className="text-2xl font-black text-foreground mt-1.5">{selectedCollection.productCount} SKUs</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Campaign Timeline
                        </span>
                        <h4 className="text-xs font-semibold text-foreground mt-2 select-none truncate">
                          {selectedCollection.startDate ? `${selectedCollection.startDate} to ${selectedCollection.endDate}` : 'Always Active'}
                        </h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Collection Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">
                      {selectedCollection.description || "No narrative set for this seasonal collection drop."}
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
