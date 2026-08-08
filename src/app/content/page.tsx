'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, getImageUrl, authHeaders, api } from '@/lib/api';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Search,
  Trash2,
  Upload,
  Play,
  Image as ImageIcon,
  Clock,
  Eye,
  Heart,
  Tag,
  Loader2,
  X,
  Edit,
  CheckCircle2,
  Sparkles,
  Layers,
  FileVideo,
  Film,
  ShoppingBag,
} from 'lucide-react';

interface TaggedProduct {
  id: number;
  name: string;
  thumbnailUrl?: string;
  price: number;
}

interface ContentPost {
  id: number;
  type: 'PLAY' | 'POST' | 'STORY';
  title?: string;
  caption?: string;
  mediaUrls: string[];
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string;
  uploadedBy: string;
  isActive: boolean;
  viewCount: number;
  likeCount: number;
  sortOrder: number;
  expiresAt?: string;
  createdAt: string;
  taggedProducts: TaggedProduct[];
}

export default function ContentManagementPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PLAY' | 'POST' | 'STORY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [contentType, setContentType] = useState<'PLAY' | 'POST' | 'STORY'>('PLAY');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Product Tagging State
  const [productSearch, setProductSearch] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [taggedProducts, setTaggedProducts] = useState<any[]>([]);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { limit: '50' };
      if (activeTab !== 'ALL') {
        params.type = activeTab;
      }

      const res = await api.content.getAll(params);
      if (res.success && Array.isArray(res.data)) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Product Search for tagging
  useEffect(() => {
    if (!productSearch.trim()) {
      setAvailableProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingProducts(true);
        const res = await api.products.getAll({ search: productSearch, limit: '10' });
        const prods = res.data?.products || res.data || [];
        setAvailableProducts(Array.isArray(prods) ? prods : []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
      const previews = filesArr.map((f) => URL.createObjectURL(f));
      setFilePreviews(previews);
    }
  };

  const handleAddProduct = (prod: any) => {
    if (!taggedProducts.some((p) => p.id === prod.id)) {
      setTaggedProducts([...taggedProducts, prod]);
    }
    setProductSearch('');
    setAvailableProducts([]);
  };

  const handleRemoveProduct = (id: number) => {
    setTaggedProducts(taggedProducts.filter((p) => p.id !== id));
  };

  const openCreateSheet = () => {
    resetForm();
    setEditingPost(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (post: ContentPost) => {
    setEditingPost(post);
    setContentType(post.type);
    setTitle(post.title || '');
    setCaption(post.caption || '');
    setSortOrder(String(post.sortOrder || 0));
    setIsActive(post.isActive);
    setSelectedFiles([]);
    setFilePreviews(post.mediaUrls.map((url) => getImageUrl(url)));
    setThumbnailFile(null);
    setThumbnailPreview(post.thumbnailUrl ? getImageUrl(post.thumbnailUrl) : null);
    setTaggedProducts(post.taggedProducts || []);
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPost && selectedFiles.length === 0) {
      alert('Please select at least one media file.');
      return;
    }

    if (!editingPost && contentType === 'PLAY' && !thumbnailFile) {
      alert('Please select a video thumbnail image.');
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = authHeaders() as Record<string, string>;
      delete headers['Content-Type'];

      const formData = new FormData();
      formData.append('type', contentType);
      if (title) formData.append('title', title);
      if (caption) formData.append('caption', caption);
      formData.append('sortOrder', sortOrder);
      formData.append('isActive', String(isActive));

      const productIds = taggedProducts.map((p) => p.id);
      formData.append('productIds', JSON.stringify(productIds));

      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      let res;
      if (editingPost) {
        // Edit mode: PATCH endpoint
        res = await fetch(`${API_BASE}/api/admin/content/${editingPost.id}`, {
          method: 'PATCH',
          headers,
          body: formData,
        });
      } else {
        // Create mode: POST endpoint
        res = await fetch(`${API_BASE}/api/admin/content`, {
          method: 'POST',
          headers,
          body: formData,
        });
      }

      const json = await res.json();

      if (res.ok && (json.success || json.data)) {
        setIsSheetOpen(false);
        resetForm();
        fetchContent();
      } else {
        alert(json.message || 'Failed to save content item');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error saving content: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setContentType('PLAY');
    setTitle('');
    setCaption('');
    setSortOrder('0');
    setIsActive(true);
    setSelectedFiles([]);
    setFilePreviews([]);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setTaggedProducts([]);
  };

  const handleToggleActive = async (post: ContentPost) => {
    try {
      await api.content.update(post.id, { isActive: !post.isActive });
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;
    try {
      await api.content.delete(id);
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (post.title || '').toLowerCase().includes(query);
    const captionMatch = (post.caption || '').toLowerCase().includes(query);
    return titleMatch || captionMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Play, Posts & Stories"
          description="Create, edit, and manage shoppable vertical videos, feed posts, and 24-hour expiring stories for mobile app users."
        >
          <Button
            onClick={openCreateSheet}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create & Upload Content
          </Button>
        </PageHeader>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(['ALL', 'PLAY', 'POST', 'STORY'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={`capitalize font-semibold text-xs rounded-lg px-4 ${
                  activeTab === tab ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                {tab === 'ALL' && 'All Formats'}
                {tab === 'PLAY' && '⚡ PLAY (Vertical Video)'}
                {tab === 'POST' && '📸 POSTS (Carousel Feed)'}
                {tab === 'STORY' && '⭕ STORIES (24h Expiry)'}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search title or caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Content Table */}
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-sm">Loading content items...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                <ImageIcon className="w-12 h-12 text-gray-300" />
                <p className="text-base font-semibold text-gray-600">No content items found</p>
                <p className="text-xs text-gray-400">Upload your first Play video, feed Post, or Story to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title & Caption</TableHead>
                    <TableHead>Tagged Products</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center">Likes</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Media Preview */}
                      <TableCell>
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-900 relative flex items-center justify-center border shadow-xs">
                          {post.thumbnailUrl || (post.mediaUrls && post.mediaUrls[0]) ? (
                            <img
                              src={getImageUrl(post.thumbnailUrl || post.mediaUrls[0])}
                              alt={post.title || 'Content'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          )}
                          {post.mediaType === 'VIDEO' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell>
                        {post.type === 'PLAY' && (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold text-[10px]">
                            PLAY
                          </Badge>
                        )}
                        {post.type === 'POST' && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold text-[10px]">
                            POST
                          </Badge>
                        )}
                        {post.type === 'STORY' && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> STORY (24h)
                          </Badge>
                        )}
                      </TableCell>

                      {/* Title & Caption */}
                      <TableCell className="max-w-xs">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {post.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {post.caption || 'No caption provided.'}
                        </p>
                        {post.expiresAt && (
                          <p className="text-[10px] text-amber-600 font-medium mt-1">
                            Expires: {new Date(post.expiresAt).toLocaleString()}
                          </p>
                        )}
                      </TableCell>

                      {/* Tagged Products */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {post.taggedProducts && post.taggedProducts.length > 0 ? (
                            post.taggedProducts.map((tp) => (
                              <span
                                key={tp.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-medium border border-teal-100"
                              >
                                <Tag className="w-3 h-3" /> {tp.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Views */}
                      <TableCell className="text-center font-medium text-sm text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          {post.viewCount}
                        </div>
                      </TableCell>

                      {/* Likes */}
                      <TableCell className="text-center font-medium text-sm text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                          {post.likeCount}
                        </div>
                      </TableCell>

                      {/* Active Status */}
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleActive(post)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            post.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {post.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(post)}
                            className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* REDESIGNED CREATE & EDIT SIDE SHEET */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-l border-gray-200 shadow-2xl">
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-teal-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-white">
                      {editingPost ? `Edit Content #${editingPost.id}` : 'Create & Upload Content'}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-teal-100 mt-0.5">
                      {editingPost ? 'Modify content metadata, replace media, or tag products.' : 'Upload shoppable videos, carousel posts, or expiring stories.'}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* SECTION 1: CONTENT FORMAT SELECTOR */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" /> 1. Select Content Format
                </Label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setContentType('PLAY')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      contentType === 'PLAY'
                        ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {contentType === 'PLAY' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 absolute top-3 right-3" />
                    )}
                    <Play className="w-5 h-5 text-purple-600 mb-2" />
                    <p className="font-bold text-xs">PLAY</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Vertical Video</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('POST')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      contentType === 'POST'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {contentType === 'POST' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 absolute top-3 right-3" />
                    )}
                    <ImageIcon className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="font-bold text-xs">POST</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Carousel Feed</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('STORY')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      contentType === 'STORY'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {contentType === 'STORY' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 absolute top-3 right-3" />
                    )}
                    <Clock className="w-5 h-5 text-amber-600 mb-2" />
                    <p className="font-bold text-xs">STORY</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">24h Expiry</p>
                  </button>
                </div>

                {/* Format Guidance Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {contentType === 'PLAY' && (
                    <p>⚡ <b>PLAY format:</b> Upload a single full-screen 9:16 vertical video (MP4/WebM, up to 50MB). Requires a thumbnail image.</p>
                  )}
                  {contentType === 'POST' && (
                    <p>📸 <b>POST format:</b> Upload up to 10 carousel images (JPEG/PNG/WebP, up to 5MB each). Ideal for lookbooks & collections.</p>
                  )}
                  {contentType === 'STORY' && (
                    <p>⭕ <b>STORY format:</b> Upload a single image (max 5MB) or video (max 20MB). Automatically expires 24 hours after publishing.</p>
                  )}
                </div>
              </div>

              {/* SECTION 2: MEDIA UPLOAD DROPZONE */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-teal-600" /> 2. Upload Media File(s)
                  </span>
                  {editingPost && (
                    <span className="text-[11px] text-amber-600 font-medium">
                      (Leave blank to keep existing media)
                    </span>
                  )}
                </Label>

                <div className="border-2 border-dashed border-gray-200 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-gray-50/50 hover:bg-teal-50/20">
                  <input
                    type="file"
                    multiple={contentType === 'POST'}
                    accept={contentType === 'PLAY' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Click or drag & drop media file(s) here
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {contentType === 'POST' ? 'Select up to 10 images' : 'Select a single media file'}
                  </p>
                </div>

                {/* File Previews */}
                {filePreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Media Previews ({filePreviews.length}):
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {filePreviews.map((src, i) => (
                        <div key={i} className="w-20 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 relative shadow-xs flex-shrink-0">
                          {selectedFiles[i]?.type.startsWith('video/') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white p-2">
                              <FileVideo className="w-6 h-6 text-purple-400 mb-1" />
                              <span className="text-[9px] font-bold">VIDEO</span>
                            </div>
                          ) : (
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = selectedFiles.filter((_, idx) => idx !== i);
                              const newPreviews = filePreviews.filter((_, idx) => idx !== i);
                              setSelectedFiles(newFiles);
                              setFilePreviews(newPreviews);
                            }}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: THUMBNAIL UPLOAD (FOR PLAY) */}
              {contentType === 'PLAY' && (
                <div className="space-y-2.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <Label className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                    <span>3. Video Poster Thumbnail</span>
                    {!editingPost && <span className="text-[11px] text-purple-600 font-bold">* Required</span>}
                  </Label>
                  <div className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setThumbnailFile(file);
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <ImageIcon className="w-6 h-6 text-purple-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-purple-900">
                      {thumbnailFile ? thumbnailFile.name : 'Click to select custom thumbnail image'}
                    </p>
                    <p className="text-[10px] text-purple-500 mt-0.5">JPEG / PNG / WebP format</p>
                  </div>
                  {thumbnailPreview && (
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-14 h-18 rounded-lg overflow-hidden border border-purple-300 bg-gray-900 shadow-xs">
                        <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs text-purple-800">
                        <p className="font-semibold">Thumbnail Loaded</p>
                        <p className="text-[11px] text-purple-600">Will be shown on vertical video card grid</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: DETAILS (TITLE & CAPTION) */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Content Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Summer Silk Saree Launch 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="caption" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Caption / Description
                  </Label>
                  <Textarea
                    id="caption"
                    rows={3}
                    placeholder="e.g. Handcrafted pure silk sarees with Zari embroidery. Tap tagged items to shop now!"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* SECTION 5: TAG PRODUCTS */}
              <div className="space-y-2.5 pt-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-600" /> Tag Products (Shoppable Links)
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Type product name to search & tag..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="text-sm"
                  />
                  {isSearchingProducts && (
                    <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-teal-600" />
                  )}
                </div>

                {/* Available Products Search Results Dropdown */}
                {availableProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-xl bg-white shadow-xl max-h-48 overflow-y-auto divide-y z-20">
                    {availableProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProduct(prod)}
                        className="p-2.5 flex items-center gap-3 hover:bg-teal-50 cursor-pointer transition-colors"
                      >
                        <img
                          src={getImageUrl(prod.thumbnailUrl)}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover border"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-900">{prod.name}</p>
                          <p className="text-teal-600 font-bold mt-0.5">₹{prod.basePrice}</p>
                        </div>
                        <div className="p-1.5 rounded-full bg-teal-100 text-teal-700">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tagged Products Badges */}
                {taggedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {taggedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold shadow-2xs"
                      >
                        <Tag className="w-3.5 h-3.5 text-teal-600" />
                        <span>{prod.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod.id)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: VISIBILITY & SORT ORDER */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label htmlFor="sortOrder" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Sort Order Priority
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Visibility Status
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {isActive ? 'Published (Active)' : 'Draft (Inactive)'}
                  </button>
                </div>
              </div>

              <SheetFooter className="pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                    </span>
                  ) : editingPost ? (
                    'Update Content Item'
                  ) : (
                    'Publish Content'
                  )}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
