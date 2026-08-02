'use client';
// Master Colors and Sizes page - Forced HMR refresh

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Palette,
  Ruler,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';

interface ColorItem {
  id: number;
  name: string;
  hexCode: string | null;
  isActive: boolean;
  createdAt?: string;
}

interface SizeItem {
  id: number;
  name: string;
  code: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export default function ColorsSizesPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'colors' | 'sizes'>(
    pathname?.startsWith('/sizes') ? 'sizes' : 'colors'
  );

  useEffect(() => {
    if (pathname?.startsWith('/sizes')) {
      setActiveTab('sizes');
    } else if (pathname?.startsWith('/colors')) {
      setActiveTab('colors');
    }
  }, [pathname]);
  
  // Data State
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [colorSearch, setColorSearch] = useState<string>('');
  const [sizeSearch, setSizeSearch] = useState<string>('');

  // Color Modal State
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [editingColor, setEditingColor] = useState<ColorItem | null>(null);
  const [colorName, setColorName] = useState<string>('');
  const [colorHex, setColorHex] = useState<string>('#3B82F6');
  const [isSubmittingColor, setIsSubmittingColor] = useState<boolean>(false);

  // Size Modal State
  const [isSizeModalOpen, setIsSizeModalOpen] = useState<boolean>(false);
  const [editingSize, setEditingSize] = useState<SizeItem | null>(null);
  const [sizeName, setSizeName] = useState<string>('');
  const [sizeCode, setSizeCode] = useState<string>('');
  const [sizeSortOrder, setSizeSortOrder] = useState<number>(0);
  const [isSubmittingSize, setIsSubmittingSize] = useState<boolean>(false);

  // Fetch Colors & Sizes
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [colorsRes, sizesRes] = await Promise.all([
        fetch(`${API_BASE}/api/colors`),
        fetch(`${API_BASE}/api/sizes`),
      ]);

      if (colorsRes.ok) {
        const colorsJson = await colorsRes.json();
        setColors(colorsJson.data || colorsJson);
      }
      if (sizesRes.ok) {
        const sizesJson = await sizesRes.json();
        setSizes(sizesJson.data || sizesJson);
      }
    } catch (err: any) {
      toast.error('Failed to load colors and sizes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- COLOR HANDLERS ---
  const handleOpenAddColor = () => {
    setEditingColor(null);
    setColorName('');
    setColorHex('#3B82F6');
    setIsColorModalOpen(true);
  };

  const handleOpenEditColor = (color: ColorItem) => {
    setEditingColor(color);
    setColorName(color.name);
    setColorHex(color.hexCode || '#3B82F6');
    setIsColorModalOpen(true);
  };

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim()) {
      toast.error('Color name is required');
      return;
    }

    setIsSubmittingColor(true);
    try {
      const primaryUrl = editingColor
        ? `${API_BASE}/api/colors/${editingColor.id}`
        : `${API_BASE}/api/colors`;
      const fallbackUrl = editingColor
        ? `${API_BASE}/api/admin/colors/${editingColor.id}`
        : `${API_BASE}/api/admin/colors`;
      const method = editingColor ? 'PUT' : 'POST';

      let res = await fetch(primaryUrl, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: colorName.trim(),
          hexCode: colorHex,
        }),
      });

      if (res.status === 404) {
        res = await fetch(fallbackUrl, {
          method,
          headers: authHeaders(),
          body: JSON.stringify({
            name: colorName.trim(),
            hexCode: colorHex,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save color');

      toast.success(editingColor ? 'Color updated!' : 'Color added successfully!');
      setIsColorModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving color');
    } finally {
      setIsSubmittingColor(false);
    }
  };

  const handleDeleteColor = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete color "${name}"?`)) return;

    try {
      let res = await fetch(`${API_BASE}/api/colors/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/api/admin/colors/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete color');

      toast.success(`Color "${name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting color');
    }
  };

  // --- SIZE HANDLERS ---
  const handleOpenAddSize = () => {
    setEditingSize(null);
    setSizeName('');
    setSizeCode('');
    setSizeSortOrder(sizes.length + 1);
    setIsSizeModalOpen(true);
  };

  const handleOpenEditSize = (size: SizeItem) => {
    setEditingSize(size);
    setSizeName(size.name);
    setSizeCode(size.code || '');
    setSizeSortOrder(size.sortOrder || 0);
    setIsSizeModalOpen(true);
  };

  const handleSaveSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeName.trim()) {
      toast.error('Size name is required');
      return;
    }

    setIsSubmittingSize(true);
    try {
      const primaryUrl = editingSize
        ? `${API_BASE}/api/sizes/${editingSize.id}`
        : `${API_BASE}/api/sizes`;
      const fallbackUrl = editingSize
        ? `${API_BASE}/api/admin/sizes/${editingSize.id}`
        : `${API_BASE}/api/admin/sizes`;
      const method = editingSize ? 'PUT' : 'POST';

      let res = await fetch(primaryUrl, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: sizeName.trim(),
          code: sizeCode.trim() || sizeName.trim(),
          sortOrder: Number(sizeSortOrder) || 0,
        }),
      });

      if (res.status === 404) {
        res = await fetch(fallbackUrl, {
          method,
          headers: authHeaders(),
          body: JSON.stringify({
            name: sizeName.trim(),
            code: sizeCode.trim() || sizeName.trim(),
            sortOrder: Number(sizeSortOrder) || 0,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save size');

      toast.success(editingSize ? 'Size updated!' : 'Size added successfully!');
      setIsSizeModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving size');
    } finally {
      setIsSubmittingSize(false);
    }
  };

  const handleDeleteSize = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete size "${name}"?`)) return;

    try {
      let res = await fetch(`${API_BASE}/api/sizes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/api/admin/sizes/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete size');

      toast.success(`Size "${name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting size');
    }
  };

  const filteredColors = colors.filter(c =>
    c.name.toLowerCase().includes(colorSearch.toLowerCase())
  );

  const filteredSizes = sizes.filter(s =>
    s.name.toLowerCase().includes(sizeSearch.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(sizeSearch.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Colors & Sizes</h1>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Master Attributes
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage custom color swatches and apparel size options available in product dropdowns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {activeTab === 'colors' ? (
              <Button onClick={handleOpenAddColor} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add New Color
              </Button>
            ) : (
              <Button onClick={handleOpenAddSize} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add New Size
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="colors" value={activeTab} onValueChange={(val) => setActiveTab(val as 'colors' | 'sizes')} className="space-y-6">
          <TabsList className="bg-muted/40 p-1 border border-border/40 rounded-xl">
            <TabsTrigger value="colors" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4" />
              Colors ({colors.length})
            </TabsTrigger>
            <TabsTrigger value="sizes" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Ruler className="h-4 w-4" />
              Sizes ({sizes.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB: COLORS */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Color Swatches List
                    </CardTitle>
                    <CardDescription>
                      These color options will automatically appear in Product Color selection dropdowns.
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search colors..."
                      value={colorSearch}
                      onChange={(e) => setColorSearch(e.target.value)}
                      className="pl-9 h-10 rounded-lg"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                    Loading colors...
                  </div>
                ) : filteredColors.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                    <Palette className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">No colors found</p>
                    <p className="text-xs mt-1">Click "Add New Color" to add your first color swatch.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredColors.map((color) => (
                      <motion.div
                        key={color.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="h-9 w-9 rounded-full border border-black/10 shadow-inner flex-shrink-0"
                            style={{ backgroundColor: color.hexCode || '#CCCCCC' }}
                          />
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-sm truncate text-foreground">{color.name}</h3>
                            <p className="text-[11px] font-mono text-muted-foreground truncate uppercase">
                              {color.hexCode || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                            Active
                          </Badge>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditColor(color)}
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteColor(color.id, color.name)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: SIZES */}
          <TabsContent value="sizes" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-primary" />
                      Apparel Sizes List
                    </CardTitle>
                    <CardDescription>
                      Standard and custom size options for garments, pants, and footwear.
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sizes..."
                      value={sizeSearch}
                      onChange={(e) => setSizeSearch(e.target.value)}
                      className="pl-9 h-10 rounded-lg"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                    Loading sizes...
                  </div>
                ) : filteredSizes.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                    <Ruler className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">No sizes found</p>
                    <p className="text-xs mt-1">Click "Add New Size" to create size options.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredSizes.map((size) => (
                      <motion.div
                        key={size.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                            {size.code || size.name}
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                            #Order: {size.sortOrder}
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <h3 className="font-semibold text-sm text-foreground truncate">{size.name}</h3>
                          <p className="text-xs text-muted-foreground">Code: {size.code || 'N/A'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                            Active
                          </Badge>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditSize(size)}
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSize(size.id, size.name)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: ADD / EDIT COLOR */}
        <Dialog open={isColorModalOpen} onOpenChange={setIsColorModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {editingColor ? 'Edit Color Swatch' : 'Add New Color Swatch'}
              </DialogTitle>
              <DialogDescription>
                Create or update a color attribute for product variants.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveColor} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="color-name">Color Name *</Label>
                <Input
                  id="color-name"
                  placeholder="e.g. Royal Blue, Crimson Red, Lavender"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-hex">Color Preview & Hex Code</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color-picker"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="h-11 w-14 rounded-lg border border-border/60 bg-background cursor-pointer p-1"
                  />
                  <Input
                    id="color-hex"
                    placeholder="#3B82F6"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="font-mono uppercase tracking-wider"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsColorModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingColor} className="bg-primary hover:bg-primary/90">
                  {isSubmittingColor ? 'Saving...' : editingColor ? 'Update Color' : 'Add Color'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL: ADD / EDIT SIZE */}
        <Dialog open={isSizeModalOpen} onOpenChange={setIsSizeModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                {editingSize ? 'Edit Size Option' : 'Add New Size Option'}
              </DialogTitle>
              <DialogDescription>
                Define apparel, footwear, or waist size options for products.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSize} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="size-name">Size Name *</Label>
                <Input
                  id="size-name"
                  placeholder="e.g. Extra Large, 32 Waist, 42 EU"
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size-code">Short Code</Label>
                  <Input
                    id="size-code"
                    placeholder="e.g. XL, 32, 42"
                    value={sizeCode}
                    onChange={(e) => setSizeCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size-sort">Display Order</Label>
                  <Input
                    id="size-sort"
                    type="number"
                    value={sizeSortOrder}
                    onChange={(e) => setSizeSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsSizeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingSize} className="bg-primary hover:bg-primary/90">
                  {isSubmittingSize ? 'Saving...' : editingSize ? 'Update Size' : 'Add Size'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
