'use client';
import { API_BASE, getImageUrl } from '@/lib/api';

import React, { useState, Fragment, useMemo, useEffect, useCallback } from 'react';
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
  Eye,
  Save,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Layers,
  FolderOpen,
  Tag,
  Hash,
  AlignLeft,
  FolderTree,
  Globe,
  Info,
  Sparkles,
  ListCollapse,
  EyeOff,
  X,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeCategory(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    name: raw.name || 'Unnamed Category',
    slug: raw.slug || raw.name?.toLowerCase().replace(/\s+/g, '-') || '',
    description: raw.description || '',
    order: Number(raw.order || raw.sortOrder || raw.displayOrder || 1),
    isVisible: raw.isVisible ?? raw.isFeatured ?? raw.isActive ?? true,
    productCount: Number(raw.productCount ?? raw._count?.products ?? 0),
    iconUrl: raw.iconUrl || raw.icon_url || '',
    bannerUrl: raw.bannerUrl || raw.banner_url || '',
    children: Array.isArray(raw.children) ? raw.children.map((c: any) => ({
      id: c.id || c._id,
      name: c.name || '',
      slug: c.slug || '',
      productCount: Number(c.productCount ?? c._count?.products ?? 0),
    })) : [],
  };
}

export default function CategoriesPage() {
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', order: '1', isVisible: true });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/categories`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load categories');
      const raw = json.data ?? json.categories ?? json ?? [];
      setCategoriesList(Array.isArray(raw) ? raw.map(normalizeCategory) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row select
    setExpandedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
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
      console.error('Error uploading category files:', err);
    }

    const body = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      order: parseInt(formData.order) || 1,
      isVisible: formData.isVisible,
      iconUrl,
      bannerUrl,
    };
    try {
      const res = await fetch(`${API_BASE}/api/categories`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to create category');
      }
      
      toast.success('Category added successfully');
      
      await fetchCategories();
      setIsAddOpen(false);
      setIconFile(null);
      setBannerFiles([]);
      setFormData({ name: '', slug: '', description: '', order: '1', isVisible: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleToggleVisibility = async (catId: string) => {
    const target = categoriesList.find(c => c.id === catId);
    if (!target) return;
    
    const newVisibility = !target.isVisible;
    setCategoriesList(prev => 
      prev.map(c => c.id === catId ? { ...c, isVisible: newVisibility } : c)
    );
    setSelectedCategory((prev: any) => prev && prev.id === catId ? { ...prev, isVisible: newVisibility } : prev);
    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isVisible: newVisibility })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update visibility');
      }
      
      toast.success(`Category ${newVisibility ? 'made visible' : 'hidden'} successfully`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update visibility');
      // Revert on error
      setCategoriesList(prev => 
        prev.map(c => c.id === catId ? { ...c, isVisible: target.isVisible } : c)
      );
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${catId}`, { method: 'DELETE', headers: authHeaders() });
      
      if (!res.ok) {
        throw new Error('Failed to delete category');
      }
      
      setCategoriesList(prev => prev.filter(c => c.id !== catId));
      setSelectedCategory(null);
      
      toast.success('Category deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete category');
    }
  };

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;
    const updated = {
      ...selectedCategory,
      name: editName,
      slug: editSlug,
      order: parseInt(editOrder) || 1,
      description: editDesc,
    };

    try {
      const res = await fetch(`${API_BASE}/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          order: parseInt(editOrder) || 1,
          description: editDesc,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update category');
      }
      
      setCategoriesList(prev => prev.map(c => c.id === selectedCategory.id ? updated : c));
      setSelectedCategory(updated);
      setIsEditing(false);
      
      toast.success('Category updated successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update category');
    }
  };

  const filteredCategories = useMemo(() => {
    return categoriesList.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoriesList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const categoryColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'productCount', header: 'Products' },
    { accessorKey: 'order', header: 'Order' },
  ], []);

  const catTable = useReactTable({
    data: filteredCategories,
    columns: categoryColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = categoriesList.length;
    const subcount = categoriesList.reduce((acc, cat) => acc + (cat.children?.length || 0), 0);
    const visibleCount = categoriesList.filter(c => c.isVisible).length;
    return {
      totalCount,
      subcount,
      visibleCount
    };
  }, [categoriesList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Category"
          titlePart2="Management"
          badgeText="Categories Command Center"
          subtitle="Organize products into collections, departments, and subcategories."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Primary Departments</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2">{stats.totalCount} Categories</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subcategories</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2">{stats.subcount} Mapped</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <FolderOpen className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Visible Status</span>
                <h3 className="text-3xl font-black text-foreground tracking-tight mt-2 text-emerald-500">{stats.visibleCount} Active</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Globe className="h-5.5 w-5.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table Dashboard */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search bar */}
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search categories by name or slug..."
                  className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Expand / Collapse Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg h-10 px-4 text-xs font-semibold flex items-center gap-1.5"
                  onClick={() => setExpandedCategories(expandedCategories.length > 0 ? [] : categoriesList.map(c => c.id))}
                >
                  <ListCollapse className="h-4 w-4" />
                  {expandedCategories.length > 0 ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-border/30 rounded-xl overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/20">
                    <TableHead className="w-12 py-4"></TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => catTable.getColumn('name')?.toggleSorting(catTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Category Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Slug</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => catTable.getColumn('productCount')?.toggleSorting(catTable.getColumn('productCount')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Products <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => catTable.getColumn('order')?.toggleSorting(catTable.getColumn('order')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Sort Order <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="w-16 py-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading categories...</TableCell></TableRow>
                  ) : catTable.getRowModel().rows.length ? (
                    catTable.getRowModel().rows.map((row) => {
                    const category = row.original;
                    return (
                      <Fragment key={row.id}>
                      <TableRow 
                        onClick={() => setSelectedCategory(category)}
                        className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                      >
                        {/* Toggle expand button */}
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => toggleCategory(category.id, e)}
                            className="h-8 w-8 rounded-lg hover:bg-muted"
                          >
                            {expandedCategories.includes(category.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        
                        {/* Category Name */}
                        <TableCell className="py-4 font-semibold text-sm text-foreground flex items-center gap-2">
                          {category.iconUrl ? (
                            <img 
                              src={getImageUrl(category.iconUrl)} 
                              alt={category.name} 
                              className="w-7 h-7 rounded-md object-cover shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <Layers className="h-4 w-4 text-[#14b8a6]" />
                          )}
                          {category.name}
                        </TableCell>

                        {/* Slug */}
                        <TableCell className="py-4">
                          <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                            {category.slug}
                          </span>
                        </TableCell>

                        {/* Product counts */}
                        <TableCell className="py-4 text-center text-sm font-semibold text-foreground">
                          {category.productCount} products
                        </TableCell>

                        {/* Order */}
                        <TableCell className="py-4 text-center text-sm text-muted-foreground font-normal">
                          {category.order}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          <Badge 
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                              category.isVisible 
                                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}
                          >
                            {category.isVisible ? 'Visible' : 'Hidden'}
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
                              <DropdownMenuItem onClick={() => setSelectedCategory(category)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleVisibility(category.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                {category.isVisible ? (
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
                              <DropdownMenuItem onClick={() => handleDeleteCategory(category.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                <Trash2 className="mr-2 h-4 w-4 text-rose-500" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Nested Subcategories */}
                      {expandedCategories.includes(category.id) && category.children && (
                        category.children.map((child: any) => (
                          <TableRow 
                            key={child.id}
                            className="bg-muted/5 hover:bg-muted/10 border-b border-border/20 group/row"
                            onClick={() => setSelectedCategory({ ...category, name: `${category.name} > ${child.name}`, slug: child.slug, productCount: child.productCount, children: [] })}
                          >
                            <TableCell className="py-3"></TableCell>
                            <TableCell className="py-3 pl-8 text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                              <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                              {child.name}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="font-mono text-[10px] bg-muted/40 border border-border/20 text-muted-foreground px-2 py-0.5 rounded select-all group-hover/row:border-border transition-all">
                                {child.slug}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-center text-sm text-muted-foreground">{child.productCount} products</TableCell>
                            <TableCell className="py-3 text-center text-sm text-muted-foreground/50">-</TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge className="bg-emerald-500/5 text-emerald-500/80 border-emerald-500/10 rounded-md px-2 py-0.5 text-[10px] font-semibold border">Active</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <div className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center cursor-pointer border-none bg-transparent">
                                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                                  </div>
                                } />
                                <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-32">
                                  <DropdownMenuItem className="p-2 rounded-md hover:bg-muted cursor-pointer text-xs font-medium flex items-center gap-2">
                                    <Edit className="h-3.5 w-3.5 text-primary" /> Edit Name
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-xs font-medium flex items-center gap-2">
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </Fragment>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching categories found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredCategories.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {catTable.getFilteredRowModel().rows.length} of {filteredCategories.length} categories
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => catTable.previousPage()} disabled={!catTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {catTable.getState().pagination.pageIndex + 1} / {catTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => catTable.nextPage()} disabled={!catTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Category Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add New Category
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Create a new product category or department to organize your store inventory.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddCategory} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter category name" 
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
                        placeholder="summer-collection" 
                        className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort Order position</Label>
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
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                      id="description" 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this category to help customers understand what products it contains..." 
                      className="pl-10 rounded-lg border-border/50 focus:border-primary resize-none transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="icon" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Icon</Label>
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
                    <Label htmlFor="banner" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Banners / Images (Multiple)</Label>
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
                  <Checkbox 
                    id="isVisible" 
                    checked={formData.isVisible} 
                    onCheckedChange={(checked) => setFormData({ ...formData, isVisible: !!checked })}
                    className="rounded border-border/60 text-primary focus:ring-primary/20"
                  />
                  <Label htmlFor="isVisible" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Make this category visible on the website immediately
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Save Category
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Category Details Drawer */}
        <Sheet open={selectedCategory !== null} onOpenChange={(open) => { if (!open) { setSelectedCategory(null); setIsEditing(false); } }}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedCategory && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {selectedCategory.slug}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedCategory.isVisible
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedCategory.isVisible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg transition-colors ${isEditing ? 'text-primary border-primary/40 bg-primary/5' : ''}`} 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveCategory();
                          } else {
                            setEditName(selectedCategory.name);
                            setEditSlug(selectedCategory.slug);
                            setEditOrder(String(selectedCategory.order));
                            setEditDesc(selectedCategory.description);
                            setIsEditing(true);
                          }
                        }}
                        title={isEditing ? "Save Category Details" : "Edit Category Details"}
                      >
                        {isEditing ? <Save className="h-4.5 w-4.5" /> : <Edit className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg`} 
                        onClick={() => handleToggleVisibility(selectedCategory.id)}
                        title="Toggle Visibility"
                      >
                        {selectedCategory.isVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Globe className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteCategory(selectedCategory.id)}
                        title="Delete Category"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category Name</Label>
                          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category Slug</Label>
                          <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Position Order</Label>
                          <Input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-foreground">{selectedCategory.name} Department</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-light">Hierarchy Position Order: {selectedCategory.order}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                   {/* Category Banner Preview */}
                   {selectedCategory.bannerUrl ? (() => {
                      const banners = selectedCategory.bannerUrl.split(',').filter(Boolean);
                      return (
                        <div className="space-y-2 mb-4">
                          <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group">
                            <img 
                              src={getImageUrl(banners[0])} 
                              alt={selectedCategory.name} 
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
                    })() : selectedCategory.iconUrl ? (
                      <div className="w-full h-36 rounded-xl border border-border/30 overflow-hidden relative group mb-4 flex items-center justify-center bg-muted/20">
                        <img 
                          src={getImageUrl(selectedCategory.iconUrl)} 
                          alt={selectedCategory.name} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                          Department Icon
                        </span>
                      </div>
                    ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Total Products
                        </span>
                        <h4 className="text-2xl font-black text-foreground mt-1.5">{selectedCategory.productCount} SKUs</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <FolderTree className="h-3.5 w-3.5 text-primary" /> Subcategories
                        </span>
                        <h4 className="text-2xl font-black text-foreground mt-1.5">{selectedCategory.children?.length || 0} Sub</h4>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department Scope</h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none animate-fade-in"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {selectedCategory.description || "No customized description set for this department."}
                      </p>
                    )}
                  </div>

                  {selectedCategory.children && selectedCategory.children.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mapped Subcategories</h3>
                      <div className="border border-border/30 rounded-xl overflow-hidden bg-muted/5 divide-y divide-border/20">
                        {selectedCategory.children.map((child: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-card/25">
                            <div className="flex items-center gap-2">
                              <FolderTree className="h-4 w-4 text-[#14b8a6]" />
                              <span className="text-sm font-semibold text-foreground">{child.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground">{child.productCount} SKUs</span>
                              <span className="font-mono text-[9px] bg-muted/60 border border-border/40 px-2 py-0.5 rounded">
                                {child.slug}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
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
