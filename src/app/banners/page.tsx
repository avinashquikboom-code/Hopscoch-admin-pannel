'use client';
import { API_BASE, getImageUrl } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Save, 
  Eye,
  Upload,
  Image as ImageIcon,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Globe,
  EyeOff,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/components/ui/toast';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeBanner(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    title: raw.title || 'Ad Banner',
    imageUrl: raw.imageUrl || raw.image_url || raw.image || '',
    type: raw.type || 'home',
    link: raw.link || raw.targetUrl || '/',
    position: Number(raw.position || raw.order || 1),
    startDate: raw.startDate ? new Date(raw.startDate).toLocaleDateString('en-CA') : '2026-01-01',
    endDate: raw.endDate ? new Date(raw.endDate).toLocaleDateString('en-CA') : '2026-12-31',
    isActive: raw.isActive ?? true,
    description: raw.description || '',
  };
}

const bannerTypes = {
  home: { label: 'Home Banner', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
  offer: { label: 'Offer Block', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  slider: { label: 'Slider Hero', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  popup: { label: 'Modal Popup', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

const bannerGradients = [
  'from-teal-400 to-emerald-500 text-white',
  'from-blue-400 to-indigo-500 text-white',
  'from-amber-400 to-orange-500 text-white',
  'from-purple-400 to-pink-500 text-white',
];

export default function BannersPage() {
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'home', link: '', position: '1', startDate: '', endDate: '', isActive: true, description: '' });
  const [selectedBanner, setSelectedBanner] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/banners`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load banners');
      const raw = json.data ?? json.banners ?? json ?? [];
      setBannersList(Array.isArray(raw) ? raw.map(normalizeBanner) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
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
        if (!uploadRes.ok) {
          throw new Error('Image upload failed');
        }
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.data?.url || uploadJson.url || '';
        if (!imageUrl) {
          throw new Error('No URL returned from server');
        }
      }

      const body = {
        title: formData.title,
        type: formData.type,
        link: formData.link || '/',
        position: String(formData.position || '1'),
        startDate: formData.startDate || '2026-01-01',
        endDate: formData.endDate || '2026-12-31',
        isActive: formData.isActive,
        description: formData.description,
        imageUrl,
      };

      const res = await fetch(`${API_BASE}/api/settings/banners`, { 
        method: 'POST', 
        headers: authHeaders(), 
        body: JSON.stringify(body) 
      });

      if (res.ok) { 
        toast.success('Banner created successfully');
        setFormData({ title: '', type: 'home', link: '', position: '1', startDate: '', endDate: '', isActive: true, description: '' });
        setImageFile(null);
        setIsAddOpen(false);
        await fetchBanners(); 
      } else { 
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.message || 'Failed to create banner');
      }
    } catch (err: any) {
      console.error('Error creating banner:', err);
      toast.error(`Error: ${err.message || 'Network Error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setBannersList(prev => 
      prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
    );
    setSelectedBanner((prev: any) => prev && prev.id === id ? { ...prev, isActive: !prev.isActive } : prev);
    try {
      const target = bannersList.find(b => b.id === id);
      if (target) {
        await fetch(`${API_BASE}/api/settings/banners/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ isActive: !target.isActive })
        });
      }
    } catch {}
  };

  const handleDeleteBanner = async (id: string) => {
    setBannersList(prev => prev.filter(b => b.id !== id));
    setSelectedBanner(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/banners/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        toast.error('Failed to delete banner on server');
        await fetchBanners();
      } else {
        toast.success('Banner deleted successfully');
      }
    } catch {
      toast.error('Network error while deleting banner');
      await fetchBanners();
    }
  };

  const handleSaveBanner = async () => {
    if (!selectedBanner) return;
    let imageUrl = selectedBanner.imageUrl;

    try {
      if (editImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', editImageFile);
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const uploadRes = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: uploadFormData,
        });
        if (!uploadRes.ok) {
          throw new Error('Image upload failed');
        }
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.data?.url || uploadJson.url || '';
        if (!imageUrl) {
          throw new Error('No URL returned from server');
        }
      }
    } catch (err: any) {
      console.error('Error uploading banner edit file:', err);
      toast.error(`Image upload failed: ${err.message || 'Network Error'}`);
      return; // Stop update
    }

    const updated = {
      ...selectedBanner,
      title: editTitle,
      link: editLink,
      position: parseInt(editPosition) || 1,
      description: editDesc,
      imageUrl,
    };

    setBannersList(prev => prev.map(b => b.id === selectedBanner.id ? updated : b));
    setSelectedBanner(updated);
    setIsEditing(false);
    setEditImageFile(null);

    try {
      await fetch(`${API_BASE}/api/settings/banners/${selectedBanner.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          title: editTitle,
          link: editLink,
          position: String(editPosition || '1'),
          description: editDesc,
          imageUrl,
        }),
      });
    } catch {}
  };

  const moveBanner = (id: string, direction: 'up' | 'down') => {
    // Basic local state swap for order reindexing
    setBannersList(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      
      const updated = [...prev];
      const temp = updated[idx].position;
      updated[idx].position = updated[targetIdx].position;
      updated[targetIdx].position = temp;
      
      // Sort again by position
      return updated.sort((a, b) => a.position - b.position);
    });
  };

  const filteredBanners = useMemo(() => {
    return bannersList.filter(banner =>
      banner.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bannersList, searchQuery]);

  const stats = useMemo(() => {
    const totalCount = bannersList.length;
    const activeCount = bannersList.filter(b => b.isActive).length;
    const homeCount = bannersList.filter(b => b.type === 'home').length;
    const sliderCount = bannersList.filter(b => b.type === 'slider').length;

    return {
      totalCount,
      activeCount,
      homeCount,
      sliderCount
    };
  }, [bannersList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Banner"
          titlePart2="Management"
          badgeText="Banners Command Center"
          subtitle="Manage promotional advertisements, homepage sliders, special discount banners and popup modals."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Add Banner
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Advertisements</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalCount} Ads</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Set across storefront assets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Promotions</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight text-emerald-500">{stats.activeCount} Active</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Visible on storefront now</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/5 to-cyan-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sliders & Carousels</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.sliderCount} Heroes</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Top sliding banners featured</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Main Showcase Banners</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.homeCount} Home</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Standalone primary banners</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banners Table Dashboard */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Media Banners Registry</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search banners by name..."
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Visual Mock</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Banner Detail</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Placement Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Position</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Date Campaign Timeline</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Sorting</TableHead>
                    <TableHead className="w-16 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner, idx) => {
                    const typeConfig = bannerTypes[banner.type as keyof typeof bannerTypes] || { label: 'Custom', color: 'bg-muted text-foreground border-transparent' };
                    return (
                      <TableRow 
                        key={banner.id}
                        onClick={() => setSelectedBanner(banner)}
                        className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                      >
                        {/* Visual Mock thumbnail */}
                        <TableCell className="py-4">
                          {banner.imageUrl ? (
                            <img 
                              src={getImageUrl(banner.imageUrl)} 
                              alt={banner.title} 
                              className="w-28 h-14 rounded-lg object-cover shadow-inner border border-border/20"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                          ) : (
                            <div className={`w-28 h-14 rounded-lg bg-gradient-to-tr ${bannerGradients[idx % bannerGradients.length]} flex items-center justify-center flex-shrink-0 shadow-inner relative overflow-hidden`}>
                              <ImageIcon className="h-5 w-5 text-white/50" />
                            </div>
                          )}
                        </TableCell>

                        {/* Title and URL link */}
                        <TableCell className="py-4">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground truncate">{banner.title}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-light mt-0.5 truncate">
                              <LinkIcon className="h-3 w-3 flex-shrink-0" />
                              <span>{banner.link}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type badge */}
                        <TableCell className="py-4">
                          <Badge className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${typeConfig.color}`}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Position Index */}
                        <TableCell className="py-4 text-center font-bold text-foreground">
                          {banner.position}
                        </TableCell>

                        {/* Dates */}
                        <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{banner.startDate} – {banner.endDate}</span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          <Badge
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold border select-none ${
                              banner.isActive
                                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}
                          >
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        {/* Sorting triggers */}
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted"
                              onClick={() => moveBanner(banner.id, 'up')}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted"
                              onClick={() => moveBanner(banner.id, 'down')}
                              disabled={idx === filteredBanners.length - 1}
                            >
                              <ArrowDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
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
                              <DropdownMenuItem onClick={() => setSelectedBanner(banner)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> Preview Ad
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(banner.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                {banner.isActive ? (
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
                              <DropdownMenuItem onClick={() => handleDeleteBanner(banner.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                <Trash2 className="mr-2 h-4 w-4 text-rose-500" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredBanners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching banners found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Banner Slide Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add Promotion Banner
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Define banner titles, targeting link URLs, scheduling calendars, and media files.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateBanner} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Banner Title</Label>
                  <Input 
                    id="title" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter banner title" 
                    className="h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="link" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Redirect Link URL</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="link" 
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="/festival-sale" 
                        className="pl-10 h-11 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Placement Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="home">Home Banner</option>
                      <option value="offer">Offer Block</option>
                      <option value="slider">Slider Hero</option>
                      <option value="popup">Modal Popup</option>
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description Details</Label>
                    <Input 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short summary for other admins..." 
                      className="h-11 rounded-lg border-border/50 focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="position" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Index Position</Label>
                    <Input 
                      id="position" 
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="h-11 rounded-lg border-border/50 focus:border-primary" 
                    />
                  </div>
                </div>

                {/* Upload image card */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ad Graphic Files Upload</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {imageFile ? (
                      <div className="space-y-2">
                        <img 
                          src={URL.createObjectURL(imageFile)} 
                          alt="Preview" 
                          className="max-h-24 mx-auto object-cover rounded-lg"
                        />
                        <p className="text-xs font-semibold text-foreground truncate">{imageFile.name}</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground/75 mb-2" />
                        <p className="text-sm font-semibold text-foreground">Click to upload banner assets</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Recommended size 1920x600px, PNG/WebP up to 5MB</p>
                      </>
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
                    Make this banner visible on storefront immediately
                  </Label>
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Publishing Ad...' : 'Publish Ad'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details Drawer */}
        <Sheet open={selectedBanner !== null} onOpenChange={(open) => { if (!open) { setSelectedBanner(null); setIsEditing(false); } }}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedBanner && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        POS: {selectedBanner.position}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedBanner.isActive
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedBanner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg transition-colors ${isEditing ? 'text-primary border-primary/40 bg-primary/5' : ''}`} 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveBanner();
                          } else {
                            setEditTitle(selectedBanner.title);
                            setEditLink(selectedBanner.link);
                            setEditPosition(String(selectedBanner.position));
                            setEditDesc(selectedBanner.description);
                            setIsEditing(true);
                          }
                        }}
                        title={isEditing ? "Save Banner Details" : "Edit Banner Details"}
                      >
                        {isEditing ? <Save className="h-4.5 w-4.5" /> : <Edit className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg`} 
                        onClick={() => handleToggleActive(selectedBanner.id)}
                        title="Toggle Status"
                      >
                        {selectedBanner.isActive ? <EyeOff className="h-4.5 w-4.5" /> : <Globe className="h-4.5 w-4.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteBanner(selectedBanner.id)}
                        title="Delete Banner"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Banner Title</Label>
                          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-foreground">{selectedBanner.title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-light">Redirect URL Link: {selectedBanner.link}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  {/* Mock mockup representation card */}
                  {selectedBanner.imageUrl ? (
                    <div className="w-full h-40 rounded-xl overflow-hidden shadow-md relative border border-border/20">
                      <img 
                        src={editImageFile ? URL.createObjectURL(editImageFile) : getImageUrl(selectedBanner.imageUrl)} 
                        alt={selectedBanner.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-black/40 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur">
                        {selectedBanner.type.toUpperCase()} PREVIEW
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-40 rounded-xl bg-gradient-to-tr ${bannerGradients[selectedBanner.position % bannerGradients.length]} flex flex-col justify-between p-5 shadow-inner relative overflow-hidden`}>
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest bg-black/20 self-start px-2 py-0.5 rounded backdrop-blur">
                        {selectedBanner.type.toUpperCase()} MOCKUP PREVIEW
                      </span>
                      <h4 className="text-lg font-black text-white leading-tight drop-shadow-md">
                        {isEditing ? editTitle : selectedBanner.title}
                      </h4>
                      <span className="text-[10px] text-white/80 border border-white/20 px-2 py-0.5 rounded bg-white/10 backdrop-blur self-end font-mono">
                        {isEditing ? editLink : selectedBanner.link}
                      </span>
                    </div>
                  )}

                  {/* Edit image file selector */}
                  {isEditing && (
                    <div className="space-y-1.5 mt-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Banner Graphic</Label>
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditImageFile(e.target.files[0]);
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <div 
                        onClick={() => editFileInputRef.current?.click()}
                        className="border border-dashed border-border/60 hover:border-primary rounded-lg p-3 text-center cursor-pointer hover:bg-primary/5 transition-all text-xs flex items-center justify-center gap-2 text-muted-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        {editImageFile ? `Change Image: ${editImageFile.name}` : "Click to select a new banner graphic file"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> Placement Layout
                        </span>
                        <h4 className="text-lg font-black text-foreground mt-1.5 capitalize">{selectedBanner.type} Ad</h4>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                      <CardContent className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Placement Position
                        </span>
                        {isEditing ? (
                          <Input type="number" value={editPosition} onChange={e => setEditPosition(e.target.value)} className="h-9 rounded-md border border-border/50 mt-1.5 text-sm focus:border-primary" />
                        ) : (
                          <h4 className="text-lg font-bold text-foreground mt-2 truncate">
                            Index Position: {selectedBanner.position}
                          </h4>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {isEditing && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Redirect Link</Label>
                      <Input value={editLink} onChange={e => setEditLink(e.target.value)} className="h-10 rounded-lg border-border/50 focus:border-primary" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Promotion Brief</h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none animate-fade-in"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {selectedBanner.description}
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
