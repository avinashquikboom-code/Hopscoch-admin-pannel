'use client';
import { API_BASE, getImageUrl } from '@/lib/api';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { STANDARD_COLORS, STANDARD_SIZES } from '@/lib/constants';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';
import { toast } from '@/components/ui/toast';
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
  Sheet,
  SheetContent,
  SheetDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Save,
  Filter,
  Download,
  Package,
  CheckCircle2,
  AlertTriangle,
  Star,
  DollarSign,
  Layers,
  Sparkles,
  Grid3X3,
  List,
  TrendingUp,
  X,
  RefreshCw,
  Palette,
  Ruler,
  SlidersHorizontal
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeProduct(raw: any) {
  const stockFromVariant = raw.variants && raw.variants.length > 0 ? raw.variants[0].stock : undefined;
  const skuFromVariant = raw.variants && raw.variants.length > 0 ? raw.variants[0].sku : undefined;
  let imgs: any[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    imgs = raw.images.map((img: any) => {
      if (typeof img === 'string') return { url: img };
      return { url: img?.url || img?.image_url || img?.imageUrl || '' };
    }).filter((img: any) => img.url);
  }
  if (imgs.length === 0 && raw.thumbnailUrl) {
    imgs = [{ url: raw.thumbnailUrl }];
  }

  const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];
  const colors = Array.from(new Set(rawVariants.map((v: any) => v.color).filter((c: any) => c && c !== 'Default')));
  const sizes = Array.from(new Set(rawVariants.map((v: any) => v.size).filter((s: any) => s && s !== 'One Size')));

  return {
    id: String(raw.id || raw._id || Math.random()),
    name: raw.name || raw.title || 'Unnamed Product',
    sku: raw.sku || skuFromVariant || raw.code || `SKU-${raw.id ? String(raw.id).slice(0, 6) : '000'}`,
    price: Number(raw.basePrice || raw.price || raw.sellingPrice || raw.mrp || 0),
    shippingCharge: Number(raw.shippingCharge ?? raw.shipping_charge ?? 0),
    isGiftWrapAvailable: raw.isGiftWrapAvailable ?? raw.is_gift_wrap_available ?? true,
    giftWrapCharge: Number(raw.giftWrapCharge ?? raw.gift_wrap_charge ?? 0),
    stock: Number(raw.stock ?? stockFromVariant ?? raw.stockQuantity ?? raw.inventory?.quantity ?? 0),
    category: raw.category?.name || raw.categoryName || raw.category || 'General',
    categoryId: raw.categoryId || raw.category?.id,
    subCategory: raw.subCategory?.name || raw.subCategory || '',
    brand: raw.brand?.name || raw.brandName || raw.brand || 'Unbranded',
    brandId: raw.brandId || raw.brand?.id,
    hsnCode: raw.hsnCode || raw.hsn_code || '',
    gender: raw.gender || 'UNISEX',
    ageGroup: raw.ageGroup || raw.age_group || 'ADULT',
    taxRuleId: raw.taxRuleId || raw.tax_rule_id,
    taxRule: raw.taxRule,
    taxType: raw.taxType || raw.taxRule?.taxType || 'GST',
    taxPercent: raw.taxPercent ?? raw.taxRule?.rate ?? '',
    status: (raw.status || (raw.isActive ? 'published' : 'draft')).toLowerCase(),
    isFeatured: raw.isFeatured ?? false,
    isTrending: raw.isTrending ?? false,
    isBestSeller: raw.isBestSeller ?? false,
    isNewArrival: raw.isNewArrival ?? false,
    description: raw.description || raw.shortDescription || '',
    images: imgs,
    thumbnailUrl: raw.thumbnailUrl || (imgs.length > 0 ? imgs[0].url : null),
    variants: rawVariants,
    colors: colors,
    sizes: sizes,
  };
}

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fmt: fmtPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [shippingType, setShippingType] = useState<'free' | 'paid'>('free');
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', shippingCharge: '0.00', isGiftWrapAvailable: true, giftWrapCharge: '0.00', stock: '', category: '', subCategory: '', brand: '', colors: [] as string[], sizes: [] as string[], description: '', status: 'PUBLISHED', taxType: 'GST', taxPercent: '', selectedTaxRuleId: '' });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>(STANDARD_COLORS);
  const [availableSizes, setAvailableSizes] = useState<string[]>(STANDARD_SIZES);
  const [existingTaxRules, setExistingTaxRules] = useState<any[]>([]);
  const [fetchedTaxTypes, setFetchedTaxTypes] = useState<string[]>(['GST', 'IGST', 'VAT', 'EXCLUSIVE', 'INCLUSIVE', 'NONE']);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editShippingCharge, setEditShippingCharge] = useState('');
  const [editShippingType, setEditShippingType] = useState<'free' | 'paid'>('free');
  const [editIsGiftWrapAvailable, setEditIsGiftWrapAvailable] = useState(true);
  const [editGiftWrapCharge, setEditGiftWrapCharge] = useState('0.00');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('PUBLISHED');
  const [editHsnCode, setEditHsnCode] = useState('');
  const [editGender, setEditGender] = useState('UNISEX');
  const [editAgeGroup, setEditAgeGroup] = useState('ADULT');
  const [editTaxType, setEditTaxType] = useState('GST');
  const [editTaxPercent, setEditTaxPercent] = useState('');
  const [editSelectedTaxRuleId, setEditSelectedTaxRuleId] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsTrending, setEditIsTrending] = useState(false);
  const [editIsNewArrival, setEditIsNewArrival] = useState(false);
  const [editIsBestSeller, setEditIsBestSeller] = useState(false);

  const startEditingProduct = useCallback((product: any) => {
    setSelectedProduct(product);
    setEditName(product.name || '');
    setEditSku(product.sku || '');
    setEditPrice(String(product.price ?? 0));
    setEditStock(String(product.stock ?? 0));
    setEditShippingCharge(String(product.shippingCharge ?? 0));
    setEditShippingType(Number(product.shippingCharge ?? 0) > 0 ? 'paid' : 'free');
    setEditIsGiftWrapAvailable(product.isGiftWrapAvailable !== false);
    setEditGiftWrapCharge(String(product.giftWrapCharge ?? 0));
    setEditBrand(product.brand || '');
    setEditCategory(product.category || '');
    setEditSubCategory(product.subCategory || '');
    setEditDesc(product.description || '');
    setEditStatus(product.status?.toUpperCase() || 'PUBLISHED');
    setEditHsnCode(product.hsnCode || '');
    setEditGender(product.gender || 'UNISEX');
    setEditAgeGroup(product.ageGroup || 'ADULT');
    setEditTaxType(product.taxType || product.taxRule?.taxType || 'GST');
    setEditTaxPercent(product.taxPercent !== undefined && product.taxPercent !== null && product.taxPercent !== '' ? String(product.taxPercent) : (product.taxRule?.rate !== undefined ? String(product.taxRule.rate) : ''));
    setEditSelectedTaxRuleId(product.taxRuleId ? String(product.taxRuleId) : '');
    setEditIsFeatured(product.isFeatured ?? false);
    setEditIsTrending(product.isTrending ?? false);
    setEditIsNewArrival(product.isNewArrival ?? false);
    setEditIsBestSeller(product.isBestSeller ?? false);
    setIsEditing(true);

    if (product.id) {
      fetch(`${API_BASE}/api/admin/products/${product.id}`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.data) {
            const raw = json.data;
            setEditName(raw.name || '');
            setEditSku(raw.sku || (raw.variants && raw.variants[0]?.sku) || '');
            setEditPrice(String(raw.basePrice ?? raw.price ?? 0));
            setEditStock(String(raw.stock ?? (raw.variants && raw.variants[0]?.stock) ?? 0));
            const rawShipCharge = raw.shippingCharge ?? raw.shipping_charge ?? 0;
            setEditShippingCharge(String(rawShipCharge));
            setEditShippingType(Number(rawShipCharge) > 0 ? 'paid' : 'free');
            setEditIsGiftWrapAvailable(raw.isGiftWrapAvailable ?? raw.is_gift_wrap_available ?? true);
            const catName = raw.categoryName || raw.category?.parent?.name || raw.category?.name || raw.category || '';
            const subCatName = raw.subCategory || raw.subCategoryName || (raw.category?.parent ? raw.category?.name : '') || '';
            setEditBrand(raw.brand?.name || raw.brandName || raw.brand || '');
            setEditCategory(catName);
            setEditSubCategory(subCatName);
            setEditDesc(raw.description || '');
            setEditStatus((raw.status || 'PUBLISHED').toUpperCase());
            setEditHsnCode(raw.hsnCode || raw.hsn_code || '');
            setEditGender(raw.gender || 'UNISEX');
            setEditAgeGroup(raw.ageGroup || raw.age_group || 'ADULT');
            if (raw.taxRuleId || raw.tax_rule_id) {
              setEditSelectedTaxRuleId(String(raw.taxRuleId || raw.tax_rule_id));
            }
            if (raw.taxRule) {
              setEditTaxType(raw.taxRule.taxType || raw.taxRule.type || 'GST');
              setEditTaxPercent(String(raw.taxRule.rate || ''));
            }
            setEditIsFeatured(raw.isFeatured ?? false);
            setEditIsTrending(raw.isTrending ?? false);
            setEditIsNewArrival(raw.isNewArrival ?? false);
            setEditIsBestSeller(raw.isBestSeller ?? false);
          }
        })
        .catch(err => console.error('Error loading product details:', err));
    }
  }, []);

  const fetchCategories = useCallback(async (triggerSubCatFetch?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        const json = await res.json();
        const raw = json.data ?? json ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setCategories(list);
        if (list.length > 0) {
          const targetCatName = triggerSubCatFetch ?? list[0].name;
          const targetCat = list.find((c: any) => c.name === targetCatName) ?? list[0];
          if (!triggerSubCatFetch) {
            setFormData(prev => ({ ...prev, category: targetCat.name }));
          }
          // Auto-load subcategories for the (selected or first) category
          try {
            const subRes = await fetch(`${API_BASE}/api/categories/${targetCat.id}/children`);
            if (subRes.ok) {
              const subJson = await subRes.json();
              const subRaw = subJson.data ?? subJson ?? [];
              setSubCategories(Array.isArray(subRaw) ? subRaw : []);
            } else if (Array.isArray(targetCat.children)) {
              setSubCategories(targetCat.children.filter((c: any) => !c.deletedAt));
            }
          } catch (_) {
            if (Array.isArray(targetCat.children)) {
              setSubCategories(targetCat.children.filter((c: any) => !c.deletedAt));
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching categories in products page:', e);
    }
  }, []);

  // Dynamically compute subcategories from categories data
  const displayedSubCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const activeCatName = isEditing ? editCategory : formData.category;
    // If a specific parent category is selected
    if (activeCatName) {
      const parent = categories.find((c: any) => c.name.toLowerCase() === activeCatName.toLowerCase());
      if (parent && Array.isArray(parent.children) && parent.children.length > 0) {
        return parent.children.filter((c: any) => !c.deletedAt);
      }
    }

    // Fallback: combine all subcategories across all categories
    const allSubs: any[] = [];
    categories.forEach((parent: any) => {
      if (Array.isArray(parent.children)) {
        parent.children.forEach((sub: any) => {
          if (!sub.deletedAt && !allSubs.some((s: any) => s.id === sub.id)) {
            allSubs.push({ ...sub, parentName: parent.name });
          }
        });
      }
    });
    return allSubs;
  }, [categories, formData.category, isEditing, editCategory]);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/brands`);
      if (res.ok) {
        const json = await res.json();
        const raw = json.data ?? json ?? [];
        setBrands(Array.isArray(raw) ? raw : []);
        if (Array.isArray(raw) && raw.length > 0) {
          setFormData(prev => ({ ...prev, brand: raw[0].name }));
        }
      }
    } catch (e) {
      console.error('Error fetching brands in products page:', e);
    }
  }, []);

  const fetchColorsAndSizes = useCallback(async () => {
    try {
      const [colorRes, sizeRes] = await Promise.all([
        fetch(`${API_BASE}/api/colors`),
        fetch(`${API_BASE}/api/sizes`),
      ]);

      if (colorRes.ok) {
        const colorJson = await colorRes.json();
        const colorData = colorJson.data || colorJson;
        if (Array.isArray(colorData) && colorData.length > 0) {
          const fetchedNames = colorData.map((c: any) => c.name);
          setAvailableColors(fetchedNames);
        }
      }

      if (sizeRes.ok) {
        const sizeJson = await sizeRes.json();
        const sizeData = sizeJson.data || sizeJson;
        if (Array.isArray(sizeData) && sizeData.length > 0) {
          const fetchedNames = sizeData.map((s: any) => s.name);
          setAvailableSizes(fetchedNames);
        }
      }
    } catch (e) {
      console.error('Error fetching colors/sizes in products page:', e);
    }
  }, []);

  const fetchTaxRules = useCallback(async () => {
    setTaxLoading(true);
    try {
      let res = await fetch(`${API_BASE}/api/admin/taxes`, { headers: authHeaders() });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/taxes`, { headers: authHeaders() });
      }
      if (res.ok) {
        const json = await res.json();
        const raw = json.data?.taxes ?? json.taxes ?? json.data ?? json ?? [];
        setExistingTaxRules(Array.isArray(raw) ? raw.filter((t: any) => t.isActive !== false) : []);
      }

      let typesRes = await fetch(`${API_BASE}/api/admin/taxes/types`, { headers: authHeaders() });
      if (!typesRes.ok) {
        typesRes = await fetch(`${API_BASE}/api/taxes/types`, { headers: authHeaders() });
      }
      if (typesRes.ok) {
        const typesJson = await typesRes.json();
        const rawTypes = typesJson.data || typesJson;
        if (Array.isArray(rawTypes) && rawTypes.length > 0) {
          const list = rawTypes.map((t: any) => typeof t === 'string' ? t : (t.name || t.id || t.code));
          const unique = Array.from(new Set(['GST', 'IGST', 'VAT', 'EXCLUSIVE', 'INCLUSIVE', ...list]));
          setFetchedTaxTypes(unique);
        }
      }
    } catch (e) {
      console.error('Error fetching tax rules:', e);
    } finally {
      setTaxLoading(false);
    }
  }, []);

  // Re-fetch fresh data whenever the Add New Product sheet opens
  useEffect(() => {
    if (addSheetOpen) {
      // Refresh categories + subcategories for currently selected category
      fetchCategories(formData.category || undefined);
      // Refresh tax rules (picks up any newly added from the taxes/settings page)
      fetchTaxRules();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSheetOpen]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchColorsAndSizes();
    fetchTaxRules();
  }, [fetchCategories, fetchBrands, fetchColorsAndSizes, fetchTaxRules]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState('all');

  const [newVarColor, setNewVarColor] = useState('');
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarStock, setNewVarStock] = useState('');
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const handleAddVariant = async (productId: string | number) => {
    if (!newVarColor && !newVarSize) return;
    try {
      const payload = {
        variants: [
          {
            color: newVarColor || 'Default',
            size: newVarSize || 'One Size',
            price: newVarPrice ? parseFloat(newVarPrice) : undefined,
            stock: newVarStock ? parseInt(newVarStock) : 0,
          }
        ]
      };
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedJson = await res.json();
        if (updatedJson.data) {
          const norm = normalizeProduct(updatedJson.data);
          setSelectedProduct(norm);
        }
        fetchProducts();
        setNewVarColor('');
        setNewVarSize('');
        setNewVarPrice('');
        setNewVarStock('');
        setIsAddingVariant(false);
      }
    } catch (err) {
      console.error('Failed to add variant:', err);
    }
  };

  const handleDeleteVariant = async (productId: string | number, variantId: string | number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchProducts();
        if (selectedProduct && selectedProduct.variants) {
          setSelectedProduct({
            ...selectedProduct,
            variants: selectedProduct.variants.filter((v: any) => String(v.id) !== String(variantId))
          });
        }
      }
    } catch (err) {
      console.error('Failed to delete variant:', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      console.log('📌 [fetchProducts] GET /api/admin/products?limit=1000');
      const res = await fetch(`${API_BASE}/api/admin/products?limit=1000`, { headers: authHeaders() });
      const json = await res.json();
      console.log('📥 [fetchProducts] Server Response:', res.status, json);
      if (!res.ok) throw new Error(json.message || 'Failed to load products');

      const raw = json.data?.products ?? (Array.isArray(json.data) ? json.data : []) ?? json.products ?? json ?? [];
      const normalized = Array.isArray(raw) ? raw.map(normalizeProduct) : [];
      console.log('✅ Normalized products list:', normalized);
      setProductsList(normalized);
    } catch (e: any) {
      console.error('❌ [fetchProducts] Error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const colors = formData.colors || [];
    const sizes = formData.sizes || [];

    let variants: any[] = [];
    const baseSku = (formData.sku || 'SKU').trim().toUpperCase();

    if (colors.length > 0 || sizes.length > 0) {
      const cList = colors.length > 0 ? colors : ['Default'];
      const sList = sizes.length > 0 ? sizes : ['One Size'];
      let idx = 1;
      for (const c of cList) {
        for (const s of sList) {
          variants.push({
            sku: `${baseSku}-${c.toUpperCase().replace(/\s+/g, '-')}-${s.toUpperCase().replace(/\s+/g, '-')}-${idx++}`,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            color: c,
            size: s,
          });
        }
      }
    }

    const isSavedRule = formData.selectedTaxRuleId && formData.selectedTaxRuleId !== '__custom__' && formData.selectedTaxRuleId !== '__none__';
    const isExemptRule = formData.selectedTaxRuleId === '__none__';

    const finalShippingCharge = shippingType === 'free' ? 0 : (parseFloat(formData.shippingCharge) || 0);

    const body: any = {
      name: formData.name, 
      sku: formData.sku && formData.sku.trim() !== '' ? formData.sku.trim() : undefined,
      price: parseFloat(formData.price) || 0,
      shippingCharge: finalShippingCharge,
      isGiftWrapAvailable: formData.isGiftWrapAvailable,
      giftWrapCharge: formData.isGiftWrapAvailable ? (parseFloat(formData.giftWrapCharge) || 0) : 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      subCategory: formData.subCategory || undefined,
      brand: formData.brand,
      description: formData.description,
      status: formData.status,
      taxRuleId: isSavedRule ? Number(formData.selectedTaxRuleId) : (isExemptRule ? null : undefined),
      taxType: !isSavedRule ? (isExemptRule ? 'NONE' : (formData.taxType || 'GST')) : undefined,
      taxPercent: !isSavedRule ? (isExemptRule ? 0 : (formData.taxPercent ? parseFloat(formData.taxPercent) : undefined)) : undefined,
      isFeatured: false,
      isTrending: false,
      isBestSeller: false,
    };

    if (variants.length > 0) {
      body.variants = variants;
    }

    try {
      console.log('📌 [handleAddProduct] POST /api/admin/products', body);
      const res = await fetch(`${API_BASE}/api/admin/products`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const json = await res.json();
      console.log('📥 [handleAddProduct] Server Response:', res.status, json);
      if (!res.ok) {
        throw new Error(json.message || `Failed to add product (Status ${res.status})`);
      }
      toast.success('Product created successfully!');

      if (imageFiles.length > 0) {
        const productId = json.data?.id || json.id;
        if (productId) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

          await Promise.all(
            imageFiles.map(async (file) => {
              const uploadFormData = new FormData();
              uploadFormData.append('image', file);
              uploadFormData.append('productId', String(productId));

              console.log('📤 Uploading image for product:', productId, file.name);
              const imgRes = await fetch(`${API_BASE}/api/admin/images`, {
                method: 'POST',
                headers: uploadHeaders,
                body: uploadFormData,
              });
              const imgJson = await imgRes.json().catch(() => ({}));
              console.log('📥 Image upload response:', imgRes.status, imgJson);
            })
          );
        }
      }

      const createdProduct = json.data || json;
      const optimisticProduct = {
        ...normalizeProduct(createdProduct),
        stock: body.stock,
        price: body.price,
        category: body.category,
        brand: body.brand,
        images: imageFiles.map(file => ({ url: URL.createObjectURL(file) })),
      };
      setProductsList(prev => [optimisticProduct, ...prev]);

      setAddSheetOpen(false);
      setShippingType('free');
      setImageFiles([]);
      setSubCategories([]);
      setFormData({ name: '', sku: '', price: '', shippingCharge: '0.00', isGiftWrapAvailable: true, giftWrapCharge: '0.00', stock: '', category: categories[0]?.name || '', subCategory: '', brand: brands[0]?.name || '', colors: [], sizes: [], description: '', status: 'PUBLISHED', taxType: 'GST', taxPercent: '', selectedTaxRuleId: '' });
      
      fetchProducts();
      fetchCategories();
    } catch (err: any) {
      console.error('❌ [handleAddProduct] Error:', err);
      toast.error(err.message || 'Failed to add product');
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    let updatedImages = [...(selectedProduct.images || [])];
    if (editImageFiles.length > 0) {
      updatedImages = [
        ...updatedImages,
        ...editImageFiles.map(file => ({ url: URL.createObjectURL(file) }))
      ];
    }

    const updated = {
      ...selectedProduct,
      name: editName,
      sku: editSku,
      price: parseFloat(editPrice) || 0,
      stock: editStock !== '' ? parseInt(editStock) : selectedProduct.stock,
      shippingCharge: parseFloat(editShippingCharge) || 0,
      isGiftWrapAvailable: editIsGiftWrapAvailable,
      giftWrapCharge: editIsGiftWrapAvailable ? (parseFloat(editGiftWrapCharge) || 0) : 0,
      brand: editBrand,
      category: editCategory,
      subCategory: editSubCategory,
      description: editDesc,
      status: editStatus.toLowerCase(),
      hsnCode: editHsnCode,
      gender: editGender,
      ageGroup: editAgeGroup,
      isFeatured: editIsFeatured,
      isTrending: editIsTrending,
      isNewArrival: editIsNewArrival,
      isBestSeller: editIsBestSeller,
      images: updatedImages,
    };
    
    setProductsList(prev => prev.map(p => p.id === selectedProduct.id ? updated : p));
    setSelectedProduct(updated);
    setIsEditing(false);

    try {
      const isSavedRule = editSelectedTaxRuleId && editSelectedTaxRuleId !== '__custom__' && editSelectedTaxRuleId !== '__none__';
      const isExemptRule = editSelectedTaxRuleId === '__none__';

      const body: any = {
        name: editName,
        sku: editSku || undefined,
        price: parseFloat(editPrice) || 0,
        stock: editStock !== '' ? parseInt(editStock) : undefined,
        shippingCharge: parseFloat(editShippingCharge) || 0,
        isGiftWrapAvailable: editIsGiftWrapAvailable,
        giftWrapCharge: editIsGiftWrapAvailable ? (parseFloat(editGiftWrapCharge) || 0) : 0,
        brand: editBrand,
        category: editCategory,
        subCategory: editSubCategory,
        description: editDesc,
        status: editStatus,
        hsnCode: editHsnCode || undefined,
        gender: editGender,
        ageGroup: editAgeGroup,
        isFeatured: editIsFeatured,
        isTrending: editIsTrending,
        isNewArrival: editIsNewArrival,
        isBestSeller: editIsBestSeller,
        taxRuleId: isSavedRule ? Number(editSelectedTaxRuleId) : (isExemptRule ? null : undefined),
        taxType: !isSavedRule ? (isExemptRule ? 'NONE' : (editTaxType || 'GST')) : undefined,
        taxPercent: !isSavedRule ? (isExemptRule ? 0 : (editTaxPercent ? parseFloat(editTaxPercent) : undefined)) : undefined,
      };
      console.log('📌 [handleSaveProduct] PUT /api/admin/products/' + selectedProduct.id, body);
      const res = await fetch(`${API_BASE}/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      console.log('📥 [handleSaveProduct] Server Response:', res.status, json);
      if (!res.ok) {
        throw new Error(json.message || `Failed to update product (Status ${res.status})`);
      }
      toast.success('Product updated successfully!');

      if (editImageFiles.length > 0) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        await Promise.all(
          editImageFiles.map(async (file) => {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            uploadFormData.append('productId', String(selectedProduct.id));

            console.log('📤 Uploading image for product edit:', selectedProduct.id, file.name);
            const imgRes = await fetch(`${API_BASE}/api/admin/images`, {
              method: 'POST',
              headers: uploadHeaders,
              body: uploadFormData,
            });
            const imgJson = await imgRes.json().catch(() => ({}));
            console.log('📥 Image upload response:', imgRes.status, imgJson);
          })
        );
        setEditImageFiles([]);
      }

      fetchProducts();
    } catch (err: any) {
      console.error('❌ [handleSaveProduct] Error:', err);
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleUpdateStock = async (productId: string, quantity: number) => {
    const product = productsList.find(p => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + quantity);

    // Optimistic update
    setProductsList(prev => 
      prev.map(p => {
        if (p.id === productId) {
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    setSelectedProduct((prev: any) => {
      if (prev && prev.id === productId) {
        return { ...prev, stock: newStock };
      }
      return prev;
    });

    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ stock: newStock }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update stock');
      }
      toast.success('Stock updated successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update stock');
      // Revert on error
      setProductsList(prev => 
        prev.map(p => p.id === productId ? { ...p, stock: product.stock } : p)
      );
      setSelectedProduct((prev: any) => {
        if (prev && prev.id === productId) {
          return { ...prev, stock: product.stock };
        }
        return prev;
      });
    }
  };

  const handleToggleFeatured = (productId: string) => {
    setProductsList(prev => 
      prev.map(p => {
        if (p.id === productId) {
          return { ...p, isFeatured: !p.isFeatured };
        }
        return p;
      })
    );
    setSelectedProduct((prev: any) => {
      if (prev && prev.id === productId) {
        return { ...prev, isFeatured: !prev.isFeatured };
      }
      return prev;
    });
  };

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    const next = currentStatus.toUpperCase() === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    // optimistic update
    setProductsList(prev => prev.map(p => p.id === productId ? { ...p, status: next.toLowerCase() } : p));
    setSelectedProduct((prev: any) => prev && prev.id === productId ? { ...prev, status: next.toLowerCase() } : prev);
    try {
      console.log('📌 [handleToggleStatus] PUT /api/admin/products/' + productId, { status: next });
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      console.log('📥 [handleToggleStatus] Server Response:', res.status, json);
      if (!res.ok) {
        throw new Error(json.message || `Failed to toggle status (Status ${res.status})`);
      }
      toast.success(`Product status set to ${next}`);
    } catch (err: any) {
      console.error('❌ [handleToggleStatus] Error:', err);
      toast.error(err.message || 'Failed to toggle status');
      // revert on error
      setProductsList(prev => prev.map(p => p.id === productId ? { ...p, status: currentStatus.toLowerCase() } : p));
      setSelectedProduct((prev: any) => prev && prev.id === productId ? { ...prev, status: currentStatus.toLowerCase() } : prev);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProductsList(prev => prev.filter(p => p.id !== productId));
    setSelectedProduct(null);
    try {
      console.log('📌 [handleDeleteProduct] DELETE /api/admin/products/' + productId);
      const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, { method: 'DELETE', headers: authHeaders() });
      const json = await res.json();
      console.log('📥 [handleDeleteProduct] Server Response:', res.status, json);
      if (!res.ok) {
        throw new Error(json.message || `Failed to delete product (Status ${res.status})`);
      }
      toast.success('Product deleted successfully');
    } catch (err: any) {
      console.error('❌ [handleDeleteProduct] Error:', err);
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesBrand = brandFilter === 'all' || product.brand === brandFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? (product.status === 'published' || product.status === 'active')
          : product.status === statusFilter);
      
      let matchesStock = true;
      if (stockLevelFilter !== 'all') {
        if (stockLevelFilter === 'out') matchesStock = product.stock === 0;
        else if (stockLevelFilter === 'low') matchesStock = product.stock > 0 && product.stock < 20;
        else if (stockLevelFilter === 'in') matchesStock = product.stock >= 20;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock;
    });
  }, [productsList, searchQuery, categoryFilter, brandFilter, statusFilter, stockLevelFilter]);

  const stats = useMemo(() => {
    const totalCount = productsList.length;
    const activeCount = productsList.filter(p => p.status === 'published' || p.status === 'active').length;
    const lowStockCount = productsList.filter(p => p.stock < 20).length;
    const featuredCount = productsList.filter(p => p.isFeatured).length;

    return {
      totalCount,
      activeCount,
      lowStockCount,
      featuredCount
    };
  }, [productsList]);

  const getProductGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      'from-pink-400/20 to-rose-500/20 text-rose-500',
      'from-purple-400/20 to-indigo-500/20 text-indigo-500',
      'from-blue-400/20 to-cyan-500/20 text-cyan-500',
      'from-emerald-400/20 to-teal-500/20 text-teal-500',
      'from-amber-400/20 to-orange-500/20 text-orange-500',
    ];
    return gradients[Math.abs(hash) % gradients.length];
  };

  const isFiltersApplied = categoryFilter !== 'all' || brandFilter !== 'all' || statusFilter !== 'all' || stockLevelFilter !== 'all';

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setBrandFilter('all');
    setStatusFilter('all');
    setStockLevelFilter('all');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Product"
          titlePart2="Inventory"
          badgeText="Products Command Center"
          subtitle="Manage your product inventory, monitor stock levels, and publish items to the store."
          actions={
            <Button onClick={() => setAddSheetOpen(true)} className="bg-primary hover:bg-primary-dark h-10 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          }
        />

        {/* Products Sub-Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-3 overflow-x-auto">
          <Link
            href="/products"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-primary/10 text-primary border border-primary/20"
          >
            <Package className="h-4 w-4" />
            All Products
          </Link>
          <Link
            href="/colors-sizes"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Palette className="h-4 w-4 text-purple-500" />
            Colors & Sizes
          </Link>
        </div>

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Total Products</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.totalCount} SKUs</p>
                  <p className="text-xs text-muted-foreground mt-1">Active items in catalog</p>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Active & Published</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.activeCount} Live</p>
                  <p className="text-xs text-muted-foreground mt-1">Visible to customers online</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Low Stock Items</p>
                  <p className="text-2xl font-bold text-amber-500 mt-2">{stats.lowStockCount} Alert</p>
                  <p className="text-xs text-muted-foreground mt-1">With less than 20 units remaining</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-lg bg-card hover:border-border/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Featured Products</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.featuredCount} Showcased</p>
                  <p className="text-xs text-muted-foreground mt-1">Highlighted on storefront banners</p>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Product Dashboard Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6">
            
            {/* Toolbar Actions */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search query input */}
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#14b8a6] transition-colors" />
                  <Input
                    placeholder="Search products by name, SKU, or brand..."
                    className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter and Export buttons */}
                <div className="flex items-center gap-2">
                  {selectedProducts.length > 0 && (
                    <div className="flex items-center gap-2 animate-fade-in mr-2">
                      <span className="text-xs text-muted-foreground font-medium bg-muted/60 border border-border/40 px-2 py-1.5 rounded-lg select-all">
                        {selectedProducts.length} selected
                      </span>
                      {selectedProducts.length === 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-10 px-3 flex items-center gap-1.5 border-[#14b8a6]/40 hover:border-[#14b8a6] hover:bg-[#14b8a6]/5 text-[#0d9488]"
                          onClick={() => {
                            const selectedId = selectedProducts[0];
                            const product = productsList.find(p => p.id === selectedId);
                            if (product) {
                              startEditingProduct(product);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-lg h-10 px-3 flex items-center gap-1.5"
                        onClick={async () => {
                          try {
                            const idsToDelete = [...selectedProducts];
                            setProductsList(prev => prev.filter(p => !idsToDelete.includes(p.id)));
                            setSelectedProducts([]);
                            
                            await Promise.all(
                              idsToDelete.map(id =>
                                fetch(`${API_BASE}/api/admin/products/${id}`, {
                                  method: 'DELETE',
                                  headers: authHeaders(),
                                })
                              )
                            );
                            toast.success('Selected products deleted successfully!');
                            fetchProducts();
                          } catch (err: any) {
                            console.error(err);
                            toast.error('Failed to delete some products');
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <div className="h-6 w-[1px] bg-border/30 mx-1" />
                    </div>
                  )}

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
                    <div className="p-4 bg-muted/30 border border-border/40 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {/* Filter by Category */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Category
                        </span>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Brand */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          Brand
                        </span>
                        <select
                          value={brandFilter}
                          onChange={(e) => setBrandFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Brands</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Status */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          Status
                        </span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>

                      {/* Filter by Stock Level */}
                      <div className="space-y-1.5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            Stock Level
                          </span>
                          <select
                            value={stockLevelFilter}
                            onChange={(e) => setStockLevelFilter(e.target.value)}
                            className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#14b8a6]/30 cursor-pointer mt-1"
                          >
                            <option value="all">All Levels</option>
                            <option value="in">Healthy Stock (20+)</option>
                            <option value="low">Low Stock (&lt;20)</option>
                            <option value="out">Out of Stock (0)</option>
                          </select>
                        </div>
                        {isFiltersApplied && (
                          <Button 
                            onClick={handleResetFilters} 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-semibold text-[#14b8a6] hover:text-[#0d9488] self-end p-0 h-6 mt-1.5"
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

            <div className="my-6 border-b border-border/20" />

            {/* Products Table */}
            <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/20">
                    <TableHead className="w-12 font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Product</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">SKU</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Price</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Stock</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Category</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Featured</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching products found</p>
                          <p className="text-xs text-muted-foreground font-light">Try adjusting your filters or search keywords</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const gradientColor = getProductGradient(product.name);
                      
                      return (
                        <TableRow 
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer group/row"
                        >
                          <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="rounded cursor-pointer"
                              checked={selectedProducts.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, product.id]);
                                } else {
                                  setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                }
                              }}
                            />
                          </TableCell>
                          
                          {/* Image and product info */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              {product.images && product.images.length > 0 ? (
                                <img 
                                  src={getImageUrl(product.images[0]?.url || product.images[0])} 
                                  alt={product.name} 
                                  className="w-11 h-11 rounded-lg object-cover shadow-sm flex-shrink-0"
                                />
                              ) : (
                                <div className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${gradientColor} flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 text-white`}>
                                  {product.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground truncate font-normal">{product.brand}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* SKU */}
                          <TableCell className="py-4">
                            <span className="font-mono font-bold text-xs bg-muted/60 border border-border/40 text-foreground px-2.5 py-1 rounded-md select-all group-hover/row:border-[#14b8a6]/25 transition-all">
                              {product.sku}
                            </span>
                          </TableCell>

                          {/* Price & Shipping */}
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground">{fmtPrice(product.price)}</span>
                              {Number(product.shippingCharge || 0) > 0 ? (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  + {fmtPrice(product.shippingCharge)} shipping
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-muted-foreground">Free shipping</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Stock Level */}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-sm font-bold ${
                                product.stock === 0
                                  ? 'text-rose-500'
                                  : product.stock < 20
                                  ? 'text-amber-500'
                                  : 'text-foreground'
                              }`}>
                                {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                              </span>
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    product.stock === 0
                                      ? 'bg-rose-500'
                                      : product.stock < 20
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                            {product.category}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell className="py-4">
                            {(() => {
                              const s = (product.status || '').toLowerCase();
                              const isPublished = s === 'published' || s === 'active';
                              const isDraft = s === 'draft';
                              const cfg = isPublished
                                ? { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/25', label: 'Published' }
                                : isDraft
                                ? { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/25', label: 'Draft' }
                                : { dot: 'bg-gray-400', bg: 'bg-gray-500/10', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-500/20', label: 'Archived' };
                              return (
                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isPublished ? 'animate-pulse' : ''}`} />
                                  {cfg.label}
                                </span>
                              );
                            })()}
                          </TableCell>

                          {/* Tags / Featured */}
                          <TableCell className="py-4">
                            <div className="flex gap-1">
                              {product.isFeatured && (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-purple-500 border-purple-500/20 bg-purple-500/5">Featured</Badge>
                              )}
                              {product.isTrending && (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-cyan-500 border-cyan-500/20 bg-cyan-500/5">Trending</Badge>
                              )}
                              {product.isBestSeller && (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 border-emerald-500/20 bg-emerald-500/5">Best Seller</Badge>
                              )}
                              {!product.isFeatured && !product.isTrending && !product.isBestSeller && (
                                <span className="text-muted-foreground text-xs font-normal italic">-</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Action drop down menu */}
                          <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                              } />
                              <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-44">
                                <DropdownMenuItem onClick={() => setSelectedProduct(product)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                  <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" />
                                  Quick Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEditingProduct(product)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                  <Edit className="mr-2 h-4 w-4 text-[#0d9488]" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleFeatured(product.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                  <Star className="mr-2 h-4 w-4 text-amber-500" />
                                  {product.isFeatured ? 'Unfeature' : 'Feature Product'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(product.id, product.status)}
                                  className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium"
                                >
                                  {['published', 'active'].includes(product.status?.toLowerCase())
                                    ? <><span className="mr-2 text-base leading-none">◌</span>Unpublish</>
                                    : <><span className="mr-2 text-base leading-none text-emerald-500">✓</span>Publish</>}
                                </DropdownMenuItem>
                                <div className="my-1 border-t border-border/10 mx-2" />
                                <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                  <Trash2 className="mr-2 h-4 w-4 text-rose-500" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>


          </CardContent>
        </Card>

        {/* Add Product Modal (Slide drawer) */}
        <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add New Product
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Define the catalog details, pricing, and starting warehouse stock counts.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU Code</Label>
                    <Input
                      id="sku"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. SKU-100"
                      className="rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="brand" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Label</Label>
                    <select
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      {brands.length > 0 ? (
                        brands.map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))
                      ) : (
                        <option value="">No Brands Available</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 899.00"
                      className="rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starting Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="e.g. 50"
                      className="rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <MultiSelectDropdown
                    label="Color Options"
                    placeholder="Select colors..."
                    options={availableColors}
                    selectedValues={formData.colors}
                    onChange={(colors) => setFormData({ ...formData, colors })}
                  />
                  <MultiSelectDropdown
                    label="Size Options"
                    placeholder="Select sizes..."
                    options={availableSizes}
                    selectedValues={formData.sizes}
                    onChange={(sizes) => setFormData({ ...formData, sizes })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Department</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value, subCategory: '' });
                    }}
                    className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="">— Select Category Department —</option>
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">No Categories Available</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subCategory" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub-Category</Label>
                  <div className="relative">
                    <select
                      id="subCategory"
                      value={formData.subCategory}
                      onChange={(e) => {
                        const selectedSubName = e.target.value;
                        setFormData((prev) => {
                          let nextCat = prev.category;
                          if (!nextCat && selectedSubName) {
                            const match = displayedSubCategories.find((s: any) => s.name === selectedSubName);
                            if (match?.parentName) nextCat = match.parentName;
                          }
                          return { ...prev, subCategory: selectedSubName, category: nextCat };
                        });
                      }}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="">— None —</option>
                      {displayedSubCategories.map((sc: any) => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}{sc.parentName ? ` (${sc.parentName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {displayedSubCategories.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">No sub-categories found. Add them from the <strong>Sub-Categories</strong> page.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tax Configuration</Label>

                  {/* API-driven tax rule selector */}
                  {taxLoading ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Loading tax rules...</p>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="taxRuleSelect" className="text-xs font-semibold text-muted-foreground">Select Tax Rule</Label>
                      <select
                        id="taxRuleSelect"
                        value={formData.selectedTaxRuleId}
                        onChange={(e) => {
                          const ruleId = e.target.value;
                          if (ruleId === '__custom__' || ruleId === '') {
                            setFormData({ ...formData, selectedTaxRuleId: '', taxType: 'GST', taxPercent: '' });
                          } else if (ruleId === '__none__') {
                            setFormData({ ...formData, selectedTaxRuleId: '__none__', taxType: 'NONE', taxPercent: '0' });
                          } else {
                            const rule = existingTaxRules.find((t: any) => String(t.id) === ruleId);
                            setFormData({
                              ...formData,
                              selectedTaxRuleId: ruleId,
                              taxType: (rule?.taxType || rule?.type || 'GST').toUpperCase(),
                              taxPercent: rule ? String(Number(rule.rate ?? rule.taxPercent ?? 0)) : '',
                            });
                          }
                        }}
                        className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                      >
                        <option value="">— Select Saved Tax Rule —</option>
                        {existingTaxRules.map((tax: any) => (
                          <option key={tax.id} value={String(tax.id)}>
                            {tax.name} — {tax.taxType || tax.type || 'GST'} @ {Number(tax.rate)}%
                          </option>
                        ))}
                        <option value="__none__">None / Exempt (0%)</option>
                        <option value="__custom__">+ Custom Tax Rate...</option>
                      </select>
                    </div>
                  )}

                  {/* Replicated Tax Type and Tax % Rate inputs */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="taxType" className="text-xs font-semibold text-muted-foreground">Tax Type</Label>
                      <select
                        id="taxType"
                        value={formData.taxType}
                        onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                        disabled={Boolean(formData.selectedTaxRuleId && formData.selectedTaxRuleId !== '__custom__')}
                        className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer disabled:opacity-75"
                      >
                        {fetchedTaxTypes.map((t) => (
                          <option key={t} value={t.toUpperCase()}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taxPercent" className="text-xs font-semibold text-muted-foreground">Tax % Rate</Label>
                      <input
                        id="taxPercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.taxPercent}
                        onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                        disabled={Boolean(formData.selectedTaxRuleId && formData.selectedTaxRuleId !== '__custom__')}
                        placeholder="e.g. 18"
                        className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-75"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Configuration */}
                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      🚚 Shipping Configuration
                    </Label>
                    <span className="text-xs font-bold text-foreground">
                      {shippingType === 'free' ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Free Delivery</span>
                      ) : (
                        <span className="text-primary">₹{formData.shippingCharge || '0.00'}</span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShippingType('free');
                        setFormData(prev => ({ ...prev, shippingCharge: '0.00' }));
                      }}
                      className={`h-11 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        shippingType === 'free'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                          : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                      }`}
                    >
                      <span className="text-base">🎁</span> Free Shipping
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShippingType('paid');
                        if (formData.shippingCharge === '0.00' || !formData.shippingCharge) {
                          setFormData(prev => ({ ...prev, shippingCharge: '' }));
                        }
                      }}
                      className={`h-11 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        shippingType === 'paid'
                          ? 'border-primary/60 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                          : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                      }`}
                    >
                      <span className="text-base">💳</span> Paid Shipping
                    </button>
                  </div>

                  {shippingType === 'paid' && (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="shippingChargeAmount" className="text-xs font-semibold text-muted-foreground">
                        Shipping Charge Amount (₹)
                      </Label>
                      <Input
                        id="shippingChargeAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shippingCharge}
                        onChange={(e) => setFormData({ ...formData, shippingCharge: e.target.value })}
                        placeholder="Enter shipping fee (e.g. 50.00)"
                        className="h-11 rounded-lg border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                      />
                    </div>
                  )}
                </div>

                {/* Gift Wrapping Configuration */}
                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      🎁 Gift Wrapping Option
                    </Label>
                    <span className="text-xs font-bold text-foreground">
                      {formData.isGiftWrapAvailable ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Available (₹{formData.giftWrapCharge || '0.00'})</span>
                      ) : (
                        <span className="text-muted-foreground">Disabled</span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isGiftWrapAvailable: true }))}
                      className={`h-11 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        formData.isGiftWrapAvailable
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                          : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                      }`}
                    >
                      <span className="text-base">🎀</span> Enable Gift Wrap
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isGiftWrapAvailable: false, giftWrapCharge: '0.00' }))}
                      className={`h-11 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !formData.isGiftWrapAvailable
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/30'
                          : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                      }`}
                    >
                      <span className="text-base">🚫</span> Not Available
                    </button>
                  </div>

                  {formData.isGiftWrapAvailable && (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="giftWrapChargeAmount" className="text-xs font-semibold text-muted-foreground">
                        Gift Wrapping Charge (₹)
                      </Label>
                      <Input
                        id="giftWrapChargeAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.giftWrapCharge}
                        onChange={(e) => setFormData({ ...formData, giftWrapCharge: e.target.value })}
                        placeholder="Enter wrapping fee (e.g. 50.00)"
                        className="h-11 rounded-lg border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Publishing Status</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'PUBLISHED', label: 'Published', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/40' },
                      { value: 'DRAFT',     label: 'Draft',     color: 'text-amber-600',   bg: 'bg-amber-500/10 border-amber-500/40' },
                      { value: 'ARCHIVED',  label: 'Archived',  color: 'text-gray-500',     bg: 'bg-gray-500/10 border-gray-400/40' },
                    ].map(({ value, label, color, bg }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: value })}
                        className={`h-10 rounded-lg border text-xs font-bold transition-all ${
                          formData.status === value
                            ? `${bg} ${color}`
                            : 'border-border/40 text-muted-foreground hover:border-border/70'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this product for your storefront catalog..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="images" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Images (Add 1 or more)</Label>
                  <div className="space-y-3">
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setImageFiles(Array.from(e.target.files));
                        }
                      }}
                      className="rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11 cursor-pointer pt-2"
                    />
                    {imageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {imageFiles.map((file, idx) => (
                          <div key={idx} className="w-12 h-12 rounded-lg border border-border/40 overflow-hidden relative group flex-shrink-0">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`preview-${idx}`} 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFiles(prev => prev.filter((_, i) => i !== idx));
                              }}
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

              <div className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setAddSheetOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95">
                  Publish SKU
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View & Edit Product Details Drawer */}
        <Sheet open={selectedProduct !== null} onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setIsEditing(false); } }}>
          <SheetTrigger nativeButton={false} render={<span />} />
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            {selectedProduct && (
              <>
                {/* Header (Fixed Top Bar) */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3 flex-shrink-0 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm bg-muted/60 border border-border/40 px-3 py-1 rounded-lg select-all">
                        {isEditing ? editSku || selectedProduct.sku : selectedProduct.sku}
                      </span>
                      <button
                        type="button"
                        title="Click to toggle Published / Draft"
                        onClick={() => handleToggleStatus(selectedProduct.id, selectedProduct.status)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80 active:scale-95 cursor-pointer ${
                          ['published', 'active'].includes(selectedProduct.status?.toLowerCase())
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                            : selectedProduct.status?.toLowerCase() === 'archived'
                              ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {['published', 'active'].includes(selectedProduct.status?.toLowerCase()) ? '✓ Published' : selectedProduct.status?.toLowerCase() === 'archived' ? 'Archived' : '◌ Draft'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={isEditing ? "default" : "outline"}
                        size="sm" 
                        className={`h-9 px-3 text-xs font-bold gap-1.5 rounded-lg transition-colors cursor-pointer ${isEditing ? 'bg-primary text-white hover:bg-primary-dark' : ''}`} 
                        onClick={() => {
                          if (isEditing) {
                            handleSaveProduct();
                          } else {
                            startEditingProduct(selectedProduct);
                          }
                        }}
                        title={isEditing ? "Save Product Details" : "Edit Product Details"}
                      >
                        {isEditing ? <><Save className="h-4 w-4" /> Save</> : <><Edit className="h-4 w-4" /> Edit</>}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-9 w-9 rounded-lg transition-colors ${selectedProduct.isFeatured ? 'text-amber-500 hover:text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20' : ''}`} 
                        onClick={() => handleToggleFeatured(selectedProduct.id)}
                        title="Toggle Featured Status"
                      >
                        <Star className="h-4.5 w-4.5 fill-current" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteProduct(selectedProduct.id)}
                        title="Delete Product"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-extrabold text-primary uppercase tracking-wider">Editing Product</h2>
                        <span className="text-xs text-muted-foreground font-medium">Scroll down to modify all fields</span>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-light">Brand: {selectedProduct.brand} | SKU: {selectedProduct.sku}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Content (Scrollable Container) */}
                <ScrollArea className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Visual Product card image/placeholder */}
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <div className="w-full h-44 rounded-xl border border-border/30 overflow-hidden relative group flex-shrink-0">
                      <img 
                        src={getImageUrl(selectedProduct.images[0]?.url || selectedProduct.images[0])} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                        Product Photo
                      </span>
                    </div>
                  ) : (
                    <div className={`w-full h-44 rounded-xl bg-gradient-to-tr ${getProductGradient(selectedProduct.name)} flex items-center justify-center shadow-inner relative overflow-hidden group flex-shrink-0`}>
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Package className="h-16 w-16 opacity-30 group-hover:scale-110 transition-transform duration-300" />
                      <span className="absolute bottom-3 right-3 text-xs font-bold bg-background/80 px-2 py-0.5 rounded-md backdrop-blur border border-border/20">
                        Catalog Preview Placeholder
                      </span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="space-y-5">
                      {/* Name & SKU */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Product Name</Label>
                          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 rounded-lg border-border/50 bg-background focus:border-primary text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SKU</Label>
                          <Input value={editSku} onChange={e => setEditSku(e.target.value)} className="h-9 rounded-lg border-border/50 bg-background font-mono text-xs focus:border-primary" />
                        </div>
                      </div>

                      {/* Category & SubCategory */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">Select Category</option>
                            {categories.map((c: any) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sub-Category</Label>
                          <select
                            value={editSubCategory}
                            onChange={(e) => setEditSubCategory(e.target.value)}
                            className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">Select Sub-Category</option>
                            {displayedSubCategories.map((sub: any) => (
                              <option key={sub.id} value={sub.name}>{sub.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Brand */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Brand</Label>
                        <select
                          value={editBrand}
                          onChange={(e) => setEditBrand(e.target.value)}
                          className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="">Select Brand</option>
                          {brands.map((b: any) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                          {editBrand && !brands.some((b: any) => b.name === editBrand) && (
                            <option value={editBrand}>{editBrand} (current)</option>
                          )}
                        </select>
                      </div>

                      {/* Demographics: Gender & Age Group */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gender</Label>
                          <select
                            value={editGender}
                            onChange={(e) => setEditGender(e.target.value)}
                            className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="UNISEX">Unisex</option>
                            <option value="MEN">Men</option>
                            <option value="WOMEN">Women</option>
                            <option value="KIDS">Kids</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Age Group</Label>
                          <select
                            value={editAgeGroup}
                            onChange={(e) => setEditAgeGroup(e.target.value)}
                            className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="ADULT">Adult</option>
                            <option value="TEEN">Teen</option>
                            <option value="KIDS">Kids</option>
                            <option value="INFANT">Infant</option>
                          </select>
                        </div>
                      </div>

                      {/* Pricing & Stock */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Price (₹)</Label>
                          <Input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="h-9 rounded-lg border-border/50 bg-background font-mono text-xs focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Qty</Label>
                          <Input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} className="h-9 rounded-lg border-border/50 bg-background font-mono text-xs focus:border-primary" />
                        </div>
                      </div>

                      {/* Shipping Configuration */}
                      <div className="p-3 rounded-xl border border-border/40 bg-muted/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">🚚 Shipping</Label>
                          <span className="text-xs font-bold">
                            {editShippingType === 'free' ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Free Delivery</span>
                            ) : (
                              <span className="text-primary">₹{editShippingCharge || '0.00'}</span>
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditShippingType('free'); setEditShippingCharge('0'); }}
                            className={`h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              editShippingType === 'free'
                                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                                : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                            }`}
                          >
                            <span>🎁</span> Free Shipping
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditShippingType('paid'); if (!editShippingCharge || editShippingCharge === '0') setEditShippingCharge(''); }}
                            className={`h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              editShippingType === 'paid'
                                ? 'border-primary/60 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                                : 'border-border/50 text-muted-foreground hover:border-border/80 bg-background'
                            }`}
                          >
                            <span>💳</span> Paid Shipping
                          </button>
                        </div>
                        {editShippingType === 'paid' && (
                          <div className="space-y-1 pt-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shipping Charge (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editShippingCharge}
                              onChange={e => setEditShippingCharge(e.target.value)}
                              placeholder="e.g. 50.00"
                              className="h-9 rounded-lg border-border/50 bg-background font-mono text-xs focus:border-primary"
                            />
                          </div>
                        )}
                      </div>

                      {/* Gift Wrap Settings */}
                      <div className="p-3 rounded-xl border border-border/40 bg-muted/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={editIsGiftWrapAvailable}
                              onChange={(e) => setEditIsGiftWrapAvailable(e.target.checked)}
                              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                            Gift Wrapping Available
                          </Label>
                          {editIsGiftWrapAvailable && (
                            <span className="text-[10px] font-bold text-emerald-600">Enabled</span>
                          )}
                        </div>
                        {editIsGiftWrapAvailable && (
                          <div className="space-y-1 pt-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gift Wrap Fee (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editGiftWrapCharge}
                              onChange={(e) => setEditGiftWrapCharge(e.target.value)}
                              className="h-8 text-xs font-mono rounded-md border-border/50 bg-background"
                            />
                          </div>
                        )}
                      </div>

                      {/* Tax & HSN Settings */}
                      <div className="p-3.5 rounded-xl border border-border/40 bg-muted/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            🏷️ Tax & GST Configuration
                          </Label>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Saved Tax Rule</Label>
                          <select
                            value={editSelectedTaxRuleId}
                            onChange={(e) => {
                              const ruleId = e.target.value;
                              if (ruleId === '__custom__' || ruleId === '') {
                                setEditSelectedTaxRuleId('');
                                setEditTaxType('GST');
                                setEditTaxPercent('');
                              } else if (ruleId === '__none__') {
                                setEditSelectedTaxRuleId('__none__');
                                setEditTaxType('NONE');
                                setEditTaxPercent('0');
                              } else {
                                const rule = existingTaxRules.find((t: any) => String(t.id) === ruleId);
                                setEditSelectedTaxRuleId(ruleId);
                                setEditTaxType((rule?.taxType || rule?.type || 'GST').toUpperCase());
                                setEditTaxPercent(rule ? String(Number(rule.rate ?? rule.taxPercent ?? 0)) : '');
                              }
                            }}
                            className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">— Select Saved Tax Rule —</option>
                            {existingTaxRules.map((tax: any) => (
                              <option key={tax.id} value={String(tax.id)}>
                                {tax.name} — {tax.taxType || tax.type || 'GST'} @ {Number(tax.rate)}%
                              </option>
                            ))}
                            <option value="__none__">None / Exempt (0%)</option>
                            <option value="__custom__">+ Custom Tax Rate...</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tax Type</Label>
                            <select
                              value={editTaxType}
                              onChange={(e) => setEditTaxType(e.target.value)}
                              disabled={Boolean(editSelectedTaxRuleId && editSelectedTaxRuleId !== '__custom__')}
                              className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs outline-none focus:border-primary cursor-pointer disabled:opacity-75"
                            >
                              {fetchedTaxTypes.map((t) => (
                                <option key={t} value={t.toUpperCase()}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tax Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editTaxPercent}
                              onChange={(e) => setEditTaxPercent(e.target.value)}
                              disabled={Boolean(editSelectedTaxRuleId && editSelectedTaxRuleId !== '__custom__')}
                              placeholder="0.00"
                              className="h-9 rounded-lg border-border/50 bg-background text-xs focus:border-primary disabled:opacity-75 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HSN Code</Label>
                            <Input
                              value={editHsnCode}
                              onChange={(e) => setEditHsnCode(e.target.value)}
                              placeholder="6204"
                              className="h-9 rounded-lg border-border/50 bg-background font-mono text-xs focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Storefront Badges */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Storefront Highlights</Label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/40 bg-background cursor-pointer">
                            <input type="checkbox" checked={editIsFeatured} onChange={e => setEditIsFeatured(e.target.checked)} className="rounded text-purple-600" />
                            <span className="font-semibold text-purple-600">Featured</span>
                          </label>
                          <label className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/40 bg-background cursor-pointer">
                            <input type="checkbox" checked={editIsTrending} onChange={e => setEditIsTrending(e.target.checked)} className="rounded text-cyan-600" />
                            <span className="font-semibold text-cyan-600">Trending</span>
                          </label>
                          <label className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/40 bg-background cursor-pointer">
                            <input type="checkbox" checked={editIsNewArrival} onChange={e => setEditIsNewArrival(e.target.checked)} className="rounded text-blue-600" />
                            <span className="font-semibold text-blue-600">New Arrival</span>
                          </label>
                          <label className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/40 bg-background cursor-pointer">
                            <input type="checkbox" checked={editIsBestSeller} onChange={e => setEditIsBestSeller(e.target.checked)} className="rounded text-emerald-600" />
                            <span className="font-semibold text-emerald-600">Best Seller</span>
                          </label>
                        </div>
                      </div>

                      {/* Publishing Status */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Publishing Status</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'PUBLISHED', label: '✓ Published', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/40' },
                            { value: 'DRAFT',     label: '◌ Draft',     color: 'text-amber-600',   bg: 'bg-amber-500/10 border-amber-500/40' },
                            { value: 'ARCHIVED',  label: 'Archived',    color: 'text-gray-500',    bg: 'bg-gray-500/10 border-gray-400/40' },
                          ].map(({ value, label, color, bg }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setEditStatus(value)}
                              className={`h-9 rounded-lg border text-xs font-bold transition-all ${
                                editStatus === value
                                  ? `${bg} ${color}`
                                  : 'border-border/40 text-muted-foreground hover:border-border/70'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Catalog Description</Label>
                        <textarea
                          rows={4}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full p-3 rounded-lg border border-border/50 bg-background text-xs focus:border-primary outline-none resize-none"
                        />
                      </div>

                      {/* Product Images (Existing + Upload New) */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Product Images</Label>
                        
                        {/* Existing Product Images list */}
                        {selectedProduct.images && selectedProduct.images.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground">Current Images:</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.images.map((img: any, idx: number) => {
                                const imgId = img.id;
                                const imgUrl = getImageUrl(img.url || img);
                                return (
                                  <div key={imgId || idx} className="w-14 h-14 rounded-lg border border-border/40 overflow-hidden relative group flex-shrink-0">
                                    <img src={imgUrl} alt={`existing-img-${idx}`} className="w-full h-full object-cover" />
                                    {imgId && (
                                      <button
                                        type="button"
                                        title="Delete image from product"
                                        onClick={async () => {
                                          try {
                                            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                                            const res = await fetch(`${API_BASE}/api/admin/images/${imgId}`, {
                                              method: 'DELETE',
                                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                                            });
                                            if (res.ok) {
                                              toast.success('Image deleted');
                                              const remaining = selectedProduct.images.filter((i: any) => i.id !== imgId);
                                              setSelectedProduct({ ...selectedProduct, images: remaining });
                                              setProductsList(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, images: remaining } : p));
                                            } else {
                                              toast.error('Failed to delete image');
                                            }
                                          } catch (e) {
                                            toast.error('Error deleting image');
                                          }
                                        }}
                                        className="absolute inset-0 bg-rose-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Upload New Images */}
                        <div className="pt-1">
                          <Label htmlFor="edit-images" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upload Additional Images</Label>
                          <Input
                            id="edit-images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                setEditImageFiles(Array.from(e.target.files));
                              }
                            }}
                            className="h-9 rounded-lg border-border/50 focus:border-primary pt-1 text-xs cursor-pointer"
                          />
                          {editImageFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {editImageFiles.map((file, idx) => (
                                <div key={idx} className="w-12 h-12 rounded-lg border border-border/40 overflow-hidden relative group flex-shrink-0">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`edit-preview-${idx}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditImageFiles(prev => prev.filter((_, i) => i !== idx))}
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

                      <div className="pt-3">
                        <Button onClick={handleSaveProduct} className="w-full h-10 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md">
                          <Save className="h-4 w-4" /> Save All Product Changes
                        </Button>
                      </div>

                    </div>
                  ) : (
                    <>
                      {/* Read-Only Product Overview Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                          <CardContent className="p-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-primary" /> Listing Price
                            </span>
                            <h4 className="text-xl font-black text-foreground mt-1">{fmtPrice(selectedProduct.price)}</h4>
                          </CardContent>
                        </Card>

                        <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                          <CardContent className="p-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              🚚 Shipping Fee
                            </span>
                            <h4 className="text-xl font-black text-foreground mt-1">
                              {Number(selectedProduct.shippingCharge || 0) > 0 ? fmtPrice(selectedProduct.shippingCharge) : 'Free'}
                            </h4>
                          </CardContent>
                        </Card>

                        <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                          <CardContent className="p-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              🎁 Gift Wrap Fee
                            </span>
                            <h4 className="text-xl font-black text-foreground mt-1">
                              {selectedProduct.isGiftWrapAvailable !== false
                                ? (Number(selectedProduct.giftWrapCharge || 0) > 0 ? fmtPrice(selectedProduct.giftWrapCharge) : 'Free')
                                : 'Disabled'}
                            </h4>
                          </CardContent>
                        </Card>

                        <Card className="border-border/30 bg-muted/10 shadow-sm rounded-lg">
                          <CardContent className="p-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                              <Package className="h-3.5 w-3.5 text-primary" /> Total Stock
                            </span>
                            <h4 className={`text-xl font-black mt-1 ${selectedProduct.stock < 20 ? 'text-amber-500' : 'text-foreground'}`}>
                              {selectedProduct.stock} Units
                            </h4>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Storefront Badges */}
                      {(selectedProduct.isFeatured || selectedProduct.isTrending || selectedProduct.isNewArrival || selectedProduct.isBestSeller) && (
                        <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg border border-border/30 bg-muted/5">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Badges:</span>
                          {selectedProduct.isFeatured && (
                            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-purple-600 border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5">Featured</Badge>
                          )}
                          {selectedProduct.isTrending && (
                            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-cyan-600 border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5">Trending</Badge>
                          )}
                          {selectedProduct.isNewArrival && (
                            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-blue-600 border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5">New Arrival</Badge>
                          )}
                          {selectedProduct.isBestSeller && (
                            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-emerald-600 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">Best Seller</Badge>
                          )}
                        </div>
                      )}

                      {/* Taxonomy & Specifications Card */}
                      <Card className="border-border/30 bg-muted/5 rounded-xl">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Specifications & Metadata</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Category</span>
                              <span className="font-bold text-foreground block truncate">{selectedProduct.category || 'General'}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Sub-Category</span>
                              <span className="font-bold text-foreground block truncate">{selectedProduct.subCategory || 'N/A'}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Brand</span>
                              <span className="font-bold text-foreground block truncate">{selectedProduct.brand || 'Unbranded'}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Gender Target</span>
                              <span className="font-bold text-foreground block uppercase">{selectedProduct.gender || 'UNISEX'}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Age Group</span>
                              <span className="font-bold text-foreground block uppercase">{selectedProduct.ageGroup || 'ADULT'}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-background border border-border/30 space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Tax & HSN</span>
                              <span className="font-bold text-foreground block font-mono">
                                {selectedProduct.taxType || 'GST'} {selectedProduct.taxPercent ? `${selectedProduct.taxPercent}%` : ''} {selectedProduct.hsnCode ? `(HSN: ${selectedProduct.hsnCode})` : ''}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                  {/* Color & Size Options Section */}
                  {((selectedProduct.colors && selectedProduct.colors.length > 0) || (selectedProduct.sizes && selectedProduct.sizes.length > 0) || (selectedProduct.variants && selectedProduct.variants.length > 0)) && (
                    <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-muted/10">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Color & Size Options</h3>
                      {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground">Colors:</span>
                          {selectedProduct.colors.map((c: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground">Sizes:</span>
                          {selectedProduct.sizes.map((s: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2.5 py-0.5">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="pt-3 border-t border-border/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Product Variants ({selectedProduct.variants ? selectedProduct.variants.length : 0})
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 rounded-md border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
                            onClick={() => setIsAddingVariant(!isAddingVariant)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {isAddingVariant ? 'Cancel' : 'Add Variant'}
                          </Button>
                        </div>

                        {/* Add New Variant Inline Form */}
                        {isAddingVariant && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                            <span className="text-xs font-bold text-primary block">Create New Variant</span>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Color (e.g. Red)"
                                value={newVarColor}
                                onChange={(e) => setNewVarColor(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                              <Input
                                placeholder="Size (e.g. XL)"
                                value={newVarSize}
                                onChange={(e) => setNewVarSize(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                              <Input
                                type="number"
                                placeholder="Price (₹)"
                                value={newVarPrice}
                                onChange={(e) => setNewVarPrice(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                              <Input
                                type="number"
                                placeholder="Stock"
                                value={newVarStock}
                                onChange={(e) => setNewVarStock(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 text-xs w-full bg-primary text-white rounded-md cursor-pointer"
                              onClick={() => handleAddVariant(selectedProduct.id)}
                            >
                              Save Variant
                            </Button>
                          </div>
                        )}

                        {/* Variants List */}
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {selectedProduct.variants.map((v: any, idx: number) => {
                              const hasOrders = v._count?.orderItems > 0 || v.hasOrders;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/40 text-xs">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] text-muted-foreground">{v.sku || `VAR-${v.id}`}</span>
                                    {v.color && v.color !== 'Default' && <Badge variant="outline" className="text-[10px] py-0">{v.color}</Badge>}
                                    {v.size && v.size !== 'One Size' && <Badge variant="outline" className="text-[10px] py-0">{v.size}</Badge>}
                                    <span className="font-bold text-foreground text-xs">₹{v.price}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-muted-foreground text-xs">{v.stock} in stock</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={`h-6 w-6 rounded-md ${hasOrders ? 'opacity-40 cursor-not-allowed text-muted-foreground' : 'text-rose-500 hover:bg-rose-500/10 cursor-pointer'}`}
                                      title={hasOrders ? `Cannot delete: referenced by existing orders` : `Remove variant`}
                                      onClick={() => handleDeleteVariant(selectedProduct.id, v.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inventory Control Panel</h3>
                    <Card className="border-border/30 bg-muted/5 rounded-xl shadow-sm">
                      <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Warehouse Stock</span>
                            <span className={`text-2xl font-black mt-1 ${selectedProduct.stock < 20 ? 'text-amber-500' : 'text-foreground'}`}>
                              {selectedProduct.stock} Units
                            </span>
                          </div>
                        </div>
                        {/* Adjust quantities interface */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button 
                            variant="outline" 
                            className="h-10 w-10 p-0 text-foreground text-lg rounded-lg border-border/40 font-bold"
                            onClick={() => handleUpdateStock(selectedProduct.id, -1)}
                          >
                            -
                          </Button>
                          <Input 
                            type="number" 
                            placeholder="Qty"
                            className="w-16 h-10 text-center rounded-lg border-border/40 font-mono font-bold"
                            value={adjustQtyInput}
                            onChange={(e) => setAdjustQtyInput(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            className="h-10 w-10 p-0 text-foreground text-lg rounded-lg border-border/40 font-bold"
                            onClick={() => handleUpdateStock(selectedProduct.id, 1)}
                          >
                            +
                          </Button>
                          <Button
                            className="h-10 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3"
                            onClick={() => {
                              const qty = parseInt(adjustQtyInput) || 0;
                              if (qty !== 0) {
                                handleUpdateStock(selectedProduct.id, qty);
                                setAdjustQtyInput('');
                              }
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Catalog Description</h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>
                </>
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
