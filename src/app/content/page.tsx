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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [contentType, setContentType] = useState<'PLAY' | 'POST' | 'STORY'>('PLAY');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
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

      // Generate local previews
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select at least one media file.');
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = authHeaders() as Record<string, string>;
      // Delete Content-Type so browser sets boundary for multipart
      delete headers['Content-Type'];

      const formData = new FormData();
      formData.append('type', contentType);
      if (title) formData.append('title', title);
      if (caption) formData.append('caption', caption);
      formData.append('sortOrder', sortOrder);

      const productIds = taggedProducts.map((p) => p.id);
      formData.append('productIds', JSON.stringify(productIds));

      selectedFiles.forEach((file) => {
        formData.append('media', file);
      });

      const res = await fetch(`${API_BASE}/api/admin/content`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setIsSheetOpen(false);
        resetForm();
        fetchContent();
      } else {
        alert(json.message || 'Failed to upload content');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error uploading content: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContentType('PLAY');
    setTitle('');
    setCaption('');
    setSortOrder('0');
    setSelectedFiles([]);
    setFilePreviews([]);
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
          description="Upload and manage admin-created shoppable videos, Instagram-style feed posts, and 24-hour expiring stories for mobile app users."
        >
          <Button
            onClick={() => {
              resetForm();
              setIsSheetOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Upload New Content
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
                  activeTab === tab ? 'bg-teal-600 text-white' : 'text-gray-600'
                }`}
              >
                {tab === 'ALL' && 'All Types'}
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
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-900 relative flex items-center justify-center border">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upload Content Side Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create & Upload Content</SheetTitle>
              <SheetDescription>
                Select content type, upload media file(s), and tag products.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {/* Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Content Type
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('PLAY')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      contentType === 'PLAY'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Play className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">PLAY</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('POST')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      contentType === 'POST'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">POST</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('STORY')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      contentType === 'STORY'
                        ? 'border-amber-600 bg-amber-50 text-amber-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">STORY</span>
                  </button>
                </div>

                {/* Validation hint per type */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  {contentType === 'PLAY' && (
                    <p>⚡ <b>PLAY:</b> Single full-screen vertical video (MP4/WebM), max 60s / 50MB.</p>
                  )}
                  {contentType === 'POST' && (
                    <p>📸 <b>POST:</b> 1 to 10 images (JPEG/PNG/WebP), max 5MB each (carousel).</p>
                  )}
                  {contentType === 'STORY' && (
                    <p>⭕ <b>STORY:</b> Single image (max 5MB) or video (max 20MB). Auto-expires after 24 hours.</p>
                  )}
                </div>
              </div>

              {/* Media File Upload Dropzone */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Upload Media File(s)
                </Label>
                <div className="border-2 border-dashed border-gray-200 hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-gray-50/50">
                  <input
                    type="file"
                    multiple={contentType === 'POST'}
                    accept={contentType === 'PLAY' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700">
                    Click or drag & drop file(s) here
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {contentType === 'POST' ? 'Multiple images allowed' : 'Single file only'}
                  </p>
                </div>

                {/* File Previews */}
                {filePreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {filePreviews.map((src, i) => (
                      <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border bg-gray-900 relative">
                        {selectedFiles[i]?.type.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                            VIDEO
                          </div>
                        ) : (
                          <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Summer Silk Saree Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Caption / Description
                </Label>
                <Textarea
                  id="caption"
                  rows={3}
                  placeholder="e.g. Handcrafted pure silk sarees with Zari embroidery. Tap to shop now!"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              {/* Tagged Products */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tag Products (Shoppable Links)
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Search product name to tag..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {isSearchingProducts && (
                    <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {availableProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto divide-y">
                    {availableProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProduct(prod)}
                        className="p-2 flex items-center gap-2 hover:bg-teal-50 cursor-pointer transition-colors"
                      >
                        <img
                          src={getImageUrl(prod.thumbnailUrl)}
                          alt={prod.name}
                          className="w-8 h-8 rounded object-cover border"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-gray-800">{prod.name}</p>
                          <p className="text-teal-600 font-bold">₹{prod.basePrice}</p>
                        </div>
                        <Plus className="w-4 h-4 text-teal-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Tagged Products Pills */}
                {taggedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {taggedProducts.map((prod) => (
                      <span
                        key={prod.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold"
                      >
                        {prod.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod.id)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sort Order
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>

              <SheetFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading Media...
                    </span>
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
