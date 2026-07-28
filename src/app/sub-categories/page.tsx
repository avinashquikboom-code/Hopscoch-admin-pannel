'use client';
import { API_BASE, getImageUrl } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
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
  Sparkles, 
  Save,
  Tag, 
  Hash, 
  FolderTree, 
  Globe, 
  Info, 
  Layers, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { AnimatePresence, motion } from 'framer-motion';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeSubCategory(c: any, parentName: string) {
  return {
    id: c.id || c._id || String(Math.random()),
    name: c.name || 'Subcategory',
    parentName: parentName,
    slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || '',
    count: Number(c.productCount ?? c._count?.products ?? 0),
    isVisible: c.isVisible ?? c.isActive ?? true,
    description: c.description || '',
    iconUrl: c.iconUrl || c.icon_url || '',
    bannerUrl: c.bannerUrl || c.banner_url || '',
  };
}

export default function SubCategoriesPage() {
  const [subCategoriesList, setSubCategoriesList] = useState<any[]>([]);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', parentId: '', slug: '', isVisible: true, description: '' });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [parentFilter, setParentFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchSubCategories = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/categories`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load categories');
      const raw = json.data ?? json.categories ?? json ?? [];
      setParentCategories(raw);
      const list: any[] = [];
      raw.forEach((parent: any) => {
        if (Array.isArray(parent.children)) {
          parent.children.forEach((c: any) => {
            list.push(normalizeSubCategory(c, parent.name));
          });
        }
      });
      setSubCategoriesList(list);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubCategories(); }, [fetchSubCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentId) {
      toast.error('Please select a parent category');
      return;
    }
    
    let iconUrl = '';
    let bannerUrl = '';

    try {
      if (iconFile) {
        const iconFormData = new FormData();
        iconFormData.append('file', iconFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const iconRes = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: iconFormData,
        });
        if (iconRes.ok) {
          const iconJson = await iconRes.json();
          iconUrl = iconJson.data?.url || iconJson.url || '';
        }
      }

      if (bannerFiles.length > 0) {
        const uploadedUrls: string[] = [];
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        for (const file of bannerFiles) {
          const bannerFormData = new FormData();
          bannerFormData.append('file', file);
          const bannerRes = await fetch(`${API_BASE}/api/admin/upload`, {
            method: 'POST',
            headers: uploadHeaders,
            body: bannerFormData,
          });
          if (bannerRes.ok) {
            const bannerJson = await bannerRes.json();
            const url = bannerJson.data?.url || bannerJson.url || '';
            if (url) uploadedUrls.push(url);
          }
        }
        bannerUrl = uploadedUrls.join(',');
      }
    } catch (err) {
      console.error('Error uploading subcategory files:', err);
    }

    const body = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      isVisible: formData.isVisible,
      description: formData.description,
      iconUrl,
      bannerUrl,
    };
    try {
      const res = await fetch(`${API_BASE}/api/categories/${formData.parentId}/children`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to create subcategory');
      }
      
      toast.success('Subcategory added successfully');
      
      await fetchSubCategories();
      setFormData({ name: '', parentId: '', slug: '', isVisible: true, description: '' });
      setIconFile(null);
      setBannerFiles([]);
      setIsAddOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create subcategory');
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const target = subCategoriesList.find(sc => sc.id === id);
    if (!target) return;
    
    const newVisibility = !target.isVisible;
    setSubCategoriesList(prev =>
      prev.map(sc => sc.id === id ? { ...sc, isVisible: newVisibility } : sc)
    );
    setSelectedSubCategory((prev: any) => prev && prev.id === id ? { ...prev, isVisible: newVisibility } : prev);
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isVisible: newVisibility })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update visibility');
      }
      
      toast.success(`Subcategory ${newVisibility ? 'made visible' : 'hidden'} successfully`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update visibility');
      // Revert on error
      setSubCategoriesList(prev =>
        prev.map(sc => sc.id === id ? { ...sc, isVisible: target.isVisible } : sc)
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
      
      if (!res.ok) {
        throw new Error('Failed to delete subcategory');
      }
      
      setSubCategoriesList(prev => prev.filter(sc => sc.id !== id));
      setSelectedSubCategory(null);
      
      toast.success('Subcategory deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete subcategory');
    }
  };

  const handleSaveSubCategory = async () => {
    if (!selectedSubCategory) return;
    const updated = {
      ...selectedSubCategory,
      name: editName,
      slug: editSlug,
      description: editDesc,
    };

    try {
      const res = await fetch(`${API_BASE}/api/categories/${selectedSubCategory.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          description: editDesc,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update subcategory');
      }
      
      setSubCategoriesList(prev => prev.map(sc => sc.id === selectedSubCategory.id ? updated : sc));
      setSelectedSubCategory(updated);
      setIsEditing(false);
      
      toast.success('Subcategory updated successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update subcategory');
    }
  };

  const filteredSubCategories = useMemo(() => {
    return subCategoriesList.filter(sc => {
      const matchesSearch =
        sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesParent = parentFilter === 'all' || sc.parentName === parentFilter;
      
      let matchesVisibility = true;
      if (visibilityFilter !== 'all') {
        matchesVisibility = visibilityFilter === 'visible' ? sc.isVisible : !sc.isVisible;
      }

      return matchesSearch && matchesParent && matchesVisibility;
    });
  }, [subCategoriesList, searchQuery, parentFilter, visibilityFilter]);

  const stats = useMemo(() => {
    const totalCount = subCategoriesList.length;
    const activeCount = subCategoriesList.filter(s => s.isVisible).length;
    const inactiveCount = totalCount - activeCount;
    return {
      totalCount,
      activeCount,
      inactiveCount
    };
  }, [subCategoriesList]);

  const isFiltersApplied = parentFilter !== 'all' || visibilityFilter !== 'all';

  const handleResetFilters = () => {
    setParentFilter('all');
    setVisibilityFilter('all');
  };

  const [sorting, setSorting] = useState<SortingState>([]);

  const subCatColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Sub Category Name' },
    { accessorKey: 'parentName', header: 'Parent Category' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'count', header: 'Mapped Products' },
    { accessorKey: 'isVisible', header: 'Status' },
  ], []);

  const subCatTable = useReactTable({
    data: filteredSubCategories,
    columns: subCatColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Sub-Category"
          titlePart2="Management"
          badgeText="Sub-Categories Command Center"
          subtitle="Manage product sub-categories and their mappings to parent categories."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-sm h-10">
              <Plus className="h-4 w-4" /> Add Sub Category
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Subcategories</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2">{stats.totalCount} Sub-types</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderTree className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active & Visible</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-emerald-500">{stats.activeCount} Online</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Globe className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-gray-500/5 to-slate-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Hidden Status</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-muted-foreground">{stats.inactiveCount} Draft</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground">
                <EyeOff className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            {/* Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative max-w-sm flex-1 group">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search sub-categories by name, slug or parent..."
                    className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter and Export buttons */}
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

              {/* Advanced Expandable Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/30 border border-border/40 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                      {/* Filter by Parent Category */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Parent Category
                        </span>
                        <select
                          value={parentFilter}
                          onChange={(e) => setParentFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Parents</option>
                          <option value="Dresses">Dresses</option>
                          <option value="Tops">Tops</option>
                          <option value="Bottoms">Bottoms</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      {/* Filter by Visibility */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          Visibility Status
                        </span>
                        <select
                          value={visibilityFilter}
                          onChange={(e) => setVisibilityFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Mappings</option>
                          <option value="visible">Visible Only</option>
                          <option value="hidden">Hidden Only</option>
                        </select>
                      </div>

                      {/* Reset filter buttons */}
                      <div className="flex items-end justify-end">
                        {isFiltersApplied && (
                          <Button 
                            onClick={handleResetFilters} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488]"
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

            {/* Table */}
            <div className="border border-border/30 rounded-xl overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/20">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => subCatTable.getColumn('name')?.toggleSorting(subCatTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Sub Category Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => subCatTable.getColumn('parentName')?.toggleSorting(subCatTable.getColumn('parentName')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Parent Category <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Slug</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => subCatTable.getColumn('count')?.toggleSorting(subCatTable.getColumn('count')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Mapped Products <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="w-16 py-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading subcategories...</TableCell></TableRow>
                  ) : subCatTable.getRowModel().rows.length ? (
                    subCatTable.getRowModel().rows.map((row) => {
                    const sc = row.original;
                    return (
                    <TableRow 
                        key={row.id}
                        onClick={() => setSelectedSubCategory(sc)}
                        className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer group/row"
                      >
                        {/* Sub Category name */}
                        <TableCell className="py-4 font-semibold text-sm text-foreground flex items-center gap-2">
                          {sc.iconUrl ? (
                            <img 
                              src={getImageUrl(sc.iconUrl)} 
                              alt={sc.name} 
                              className="w-7 h-7 rounded-md object-cover shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <FolderTree className="h-4 w-4 text-[#14b8a6]" />
                          )}
                          {sc.name}
                        </TableCell>

                        {/* Parent Name */}
                        <TableCell className="py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{sc.parentName}</span>
                          </div>
                        </TableCell>

                        {/* Slug */}
                        <TableCell className="py-4">
                          <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                            {sc.slug}
                          </span>
                        </TableCell>

                        {/* Mapped products count */}
                        <TableCell className="py-4 text-center text-sm font-semibold text-foreground">
                          {sc.count} products
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          <Badge 
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                              sc.isVisible 
                                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}
                          >
                            {sc.isVisible ? 'Visible' : 'Hidden'}
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
                              <DropdownMenuItem onClick={() => setSelectedSubCategory(sc)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleVisibility(sc.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                {sc.isVisible ? (
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
                              <DropdownMenuItem onClick={() => handleDeleteItem(sc.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
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
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching subcategories found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredSubCategories.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {subCatTable.getFilteredRowModel().rows.length} of {filteredSubCategories.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => subCatTable.previousPage()} disabled={!subCatTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {subCatTable.getState().pagination.pageIndex + 1} / {subCatTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => subCatTable.nextPage()} disabled={!subCatTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Sub Category Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add Sub Category
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Define the name, url parameters, and connect it to a parent department.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub Category Name</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter sub-category name" 
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
                        placeholder="casual-jackets" 
                        className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parent Department</Label>
                    <select
                      id="parent"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="">Select Parent Category</option>
                      {parentCategories.map((parent: any) => (
                        <option key={parent.id} value={parent.id}>{parent.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scope Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this subcategory department details..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="icon" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub Category Icon</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="icon"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setIconFile(e.target.files[0]);
                          }
                        }}
                        className="rounded-lg border-border/50 focus:border-primary cursor-pointer pt-2 text-xs"
                      />
                      {iconFile && (
                        <div className="w-10 h-10 rounded-lg border border-border/40 overflow-hidden flex-shrink-0 relative group">
                          <img 
                            src={URL.createObjectURL(iconFile)} 
                            alt="icon preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setIconFile(null)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="banner" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub Category Banners (Multiple)</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="banner"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            const selectedFiles = Array.from(e.target.files);
                            setBannerFiles(prev => [...prev, ...selectedFiles]);
                          }
                        }}
                        className="rounded-lg border-border/50 focus:border-primary cursor-pointer pt-2 text-xs"
                      />
                      {bannerFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {bannerFiles.map((file, index) => (
                            <div key={index} className="w-10 h-10 rounded-lg border border-border/40 overflow-hidden flex-shrink-0 relative group">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`banner preview ${index}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setBannerFiles(prev => prev.filter((_, i) => i !== index))}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isVisible" 
                    checked={formData.isVisible} 
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="rounded border-border/60 text-primary accent-primary h-4 w-4"
                  />
                  <Label htmlFor="isVisible" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Make this sub-category visible on the website immediately
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Save Mappings
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedSubCategory !== null} onOpenChange={(open) => { if (!open) { setSelectedSubCategory(null); setIsEditing(false); } }}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedSubCategory && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedSubCategory.slug}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedSubCategory.isVisible
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedSubCategory.isVisible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg transition-colors ${isEditing ? 'text-primary border-primary/40 bg-primary/5' : ''}`} 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveSubCategory();
                          } else {
                            setEditName(selectedSubCategory.name);
                            setEditSlug(selectedSubCategory.slug);
                            setEditDesc(selectedSubCategory.description);
                            setIsEditing(true);
                          }
                        }}
                        title={isEditing ? "Save Subcategory Details" : "Edit Subcategory Details"}
                      >
                        {isEditing ? <Save className="h-4.5 w-4.5" /> : <Edit className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg`} 
                        onClick={() => handleToggleVisibility(selectedSubCategory.id)}
                        title="Toggle Visibility"
                      >
                        {selectedSubCategory.isVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Globe className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteItem(selectedSubCategory.id)}
                        title="Delete Subcategory"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subcategory Name</Label>
                          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subcategory Slug</Label>
                          <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-foreground">{selectedSubCategory.name}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-light">Parent Department: {selectedSubCategory.parentName}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                   {/* Subcategory Banner Preview */}
                   {selectedSubCategory.bannerUrl ? (() => {
                      const banners = selectedSubCategory.bannerUrl.split(',').filter(Boolean);
                      return (
                        <div className="space-y-2 mb-4">
                          <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group">
                            <img 
                              src={getImageUrl(banners[0])} 
                              alt={selectedSubCategory.name} 
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                              Main Banner
                            </span>
                          </div>
                          {banners.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {banners.slice(1).map((bUrl: string, bIdx: number) => (
                                <div key={bIdx} className="h-16 rounded-lg border border-border/20 overflow-hidden relative">
                                  <img 
                                    src={getImageUrl(bUrl)} 
                                    alt={`Banner ${bIdx + 2}`} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })() : selectedSubCategory.iconUrl ? (
                      <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group mb-4 flex items-center justify-center bg-muted/20">
                        <img 
                          src={getImageUrl(selectedSubCategory.iconUrl)} 
                          alt={selectedSubCategory.name} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                          Subcategory Icon
                        </span>
                      </div>
                    ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Total Products
                        </span>
                        <h4 className="text-2xl font-black text-foreground mt-1.5">{selectedSubCategory.count} SKUs</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <FolderTree className="h-3.5 w-3.5 text-primary" /> Parent Category
                        </span>
                        <h4 className="text-lg font-bold text-foreground mt-2">{selectedSubCategory.parentName}</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subcategory Scope</h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none animate-fade-in"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {selectedSubCategory.description || "No customized description set for this subcategory."}
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
