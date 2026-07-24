'use client';
import { API_BASE } from '@/lib/api';
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown';
import { STANDARD_COLORS, STANDARD_SIZES } from '@/lib/constants';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';



export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [variants, setVariants] = useState([
    { sku: '', price: '', stock: '', color: '', size: '', material: '' }
  ]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Dynamic lists and loading/error states
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [selectedTaxRule, setSelectedTaxRule] = useState<string>('');
  const [taxType, setTaxType] = useState<string>('EXCLUSIVE');
  const [taxRate, setTaxRate] = useState<string>('');
  const [hsnCode, setHsnCode] = useState<string>('');

  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  const [price, setPrice] = useState<string>('');
  const [shippingCharge, setShippingCharge] = useState<string>('0.00');
  const [stock, setStock] = useState<string>('');

  const [availableColors, setAvailableColors] = useState<string[]>(STANDARD_COLORS);
  const [availableSizes, setAvailableSizes] = useState<string[]>(STANDARD_SIZES);

  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isSubcategoriesLoading, setIsSubcategoriesLoading] = useState(false);
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);

  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(null);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch initial Category & Brand lists & Tax rules
  useEffect(() => {
    const loadInitialData = async () => {
      setIsCategoriesLoading(true);
      setIsBrandsLoading(true);
      setCategoriesError(null);
      setBrandsError(null);

      try {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        if (!catRes.ok) throw new Error('Failed to load categories');
        const catJson = await catRes.json();
        const catData = catJson.data || catJson;
        if (Array.isArray(catData)) {
          // Parent categories are those where parentId is null
          const parents = catData.filter((c: any) => c.parentId === null);
          setParentCategories(parents);
        }
      } catch (err: any) {
        setCategoriesError(err.message || 'Failed to load categories');
      } finally {
        setIsCategoriesLoading(false);
      }

      try {
        const brandRes = await fetch(`${API_BASE}/api/brands`);
        if (!brandRes.ok) throw new Error('Failed to load brands');
        const brandJson = await brandRes.json();
        const brandData = brandJson.data || brandJson;
        if (Array.isArray(brandData)) {
          setBrands(brandData);
        }
      } catch (err: any) {
        setBrandsError(err.message || 'Failed to load brands');
      } finally {
        setIsBrandsLoading(false);
      }

      const fetchTaxRules = async () => {
        try {
          let taxRes = await fetch(`${API_BASE}/api/admin/taxes`, { headers: authHeaders() });
          if (!taxRes.ok) {
            taxRes = await fetch(`${API_BASE}/api/taxes`, { headers: authHeaders() });
          }
          if (taxRes.ok) {
            const taxJson = await taxRes.json();
            const taxData = taxJson.data?.taxes || taxJson.taxes || taxJson.data || taxJson;
            if (Array.isArray(taxData)) {
              setTaxRules(taxData.filter((t: any) => t.isActive !== false));
            }
          }
        } catch (err) {
          console.error('Failed to load tax rules:', err);
        }
      };

      await fetchTaxRules();

      // Fetch dynamic Colors & Sizes from API
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
      } catch (err) {
        console.error('Failed to load dynamic colors/sizes:', err);
      }
    };

    loadInitialData();
  }, []);

  // Fetch subcategories when parent category selection changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubCategory('');
      return;
    }

    const loadSubcategories = async () => {
      setIsSubcategoriesLoading(true);
      setSubcategoriesError(null);
      setSelectedSubCategory(''); // Reset selected subcategory

      try {
        const res = await fetch(`${API_BASE}/api/categories/${selectedCategory}/children`);
        if (!res.ok) throw new Error('Failed to load subcategories');
        const json = await res.json();
        const data = json.data || json;
        setSubcategories(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setSubcategoriesError(err.message || 'Failed to load subcategories');
      } finally {
        setIsSubcategoriesLoading(false);
      }
    };

    loadSubcategories();
  }, [selectedCategory]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants([...variants, { sku: '', price: '', stock: '', color: '', size: '', material: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    const formDataObj = new FormData(e.currentTarget);

    if (!selectedBrand) {
      alert('Please select a Brand.');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    if (!selectedCategory) {
      alert('Please select a Category.');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    if (subcategories.length > 0 && !selectedSubCategory) {
      alert('Please select a Sub Category.');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    const parsedPrice = parseFloat(price) || parseFloat(formDataObj.get('price') as string) || 0;
    const parsedShippingCharge = parseFloat(shippingCharge) || parseFloat(formDataObj.get('shippingCharge') as string) || 0;
    const parsedStock = parseInt(stock) || parseInt(formDataObj.get('stock') as string) || 0;

    const isSavedTaxRule = selectedTaxRule && selectedTaxRule !== 'none' && selectedTaxRule !== '__custom__';
    const body = {
      name: formDataObj.get('name') as string,
      sku: formDataObj.get('sku') as string,
      price: parsedPrice,
      basePrice: parsedPrice,
      shippingCharge: parsedShippingCharge,
      stock: parsedStock,
      categoryId: Number(selectedSubCategory || selectedCategory),
      brandId: Number(selectedBrand),
      taxRuleId: isSavedTaxRule ? Number(selectedTaxRule) : null,
      taxType: !isSavedTaxRule ? (taxType || 'GST') : undefined,
      taxPercent: !isSavedTaxRule && taxRate ? parseFloat(taxRate) : undefined,
      hsnCode: hsnCode.trim() || null,
      description: formDataObj.get('description') as string,
      shortDescription: formDataObj.get('shortDescription') as string,
      seoTitle: formDataObj.get('metaTitle') as string,
      seoDescription: formDataObj.get('metaDescription') as string,
      status: 'PUBLISHED',
      gender: 'UNISEX',
      ageGroup: 'ADULT',
      variants: (() => {
        let finalVars = variants
          .filter((v) => v.sku.trim() !== '' || v.color.trim() !== '' || v.size.trim() !== '')
          .map((v, idx) => {
            const baseSku = (formDataObj.get('sku') as string || 'SKU').trim().toUpperCase();
            const cleanColor = (v.color || 'DEFAULT').trim().toUpperCase().replace(/\s+/g, '-');
            const cleanSize = (v.size || 'ONETIME').trim().toUpperCase().replace(/\s+/g, '-');
            return {
              sku: v.sku.trim() || `${baseSku}-${cleanColor}-${cleanSize}-${idx + 1}`,
              price: parseFloat(v.price) || parsedPrice,
              stock: parseInt(v.stock) || parsedStock,
              color: v.color || null,
              size: v.size || null,
              material: v.material || null,
            };
          });

        if (finalVars.length === 0 && (selectedColors.length > 0 || selectedSizes.length > 0)) {
          const cList = selectedColors.length > 0 ? selectedColors : ['Default'];
          const sList = selectedSizes.length > 0 ? selectedSizes : ['One Size'];
          const baseSku = (formDataObj.get('sku') as string || 'SKU').trim().toUpperCase();
          let idx = 1;
          for (const c of cList) {
            for (const s of sList) {
              finalVars.push({
                sku: `${baseSku}-${c.toUpperCase().replace(/\s+/g, '-')}-${s.toUpperCase().replace(/\s+/g, '-')}-${idx++}`,
                price: parsedPrice,
                stock: parsedStock,
                color: c !== 'Default' ? c : null,
                size: s !== 'One Size' ? s : null,
                material: null,
              });
            }
          }
        }
        return finalVars;
      })(),
    };

    try {
      console.log('📌 Creating product at:', `${API_BASE}/api/admin/products`, body);
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      console.log('📥 Server response:', res.status, json);
      if (!res.ok) throw new Error(json.message || `Failed to save product (Status ${res.status})`);

      const productId = json.data?.id || json.id;

      // Handle file uploads if there are any
      if (productId && images.length > 0) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const uploadHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        await Promise.all(
          images.map(async (file) => {
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

      toast.success('Product created successfully!');
      router.push('/products');
    } catch (err: any) {
      console.error('❌ Error creating product:', err);
      toast.error(err.message || 'Failed to save product');
      alert(err.message || 'Failed to save product');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">New Product</h1>
              <p className="text-muted-foreground mt-1">Add a new product to your inventory</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-dark"
              type="submit"
              form="new-product-form"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>

        <form id="new-product-form" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="variants">Product Variants</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" keepMounted className="data-[hidden]:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the basic details for your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" name="name" placeholder="Enter product name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input id="sku" name="sku" placeholder="Enter SKU" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input 
                        id="price" 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCharge" className="font-bold text-primary flex items-center gap-1.5">
                        Shipping Charge (₹)
                      </Label>
                      <Input 
                        id="shippingCharge" 
                        name="shippingCharge" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={shippingCharge}
                        onChange={(e) => setShippingCharge(e.target.value)}
                        className="border-primary/40 focus:border-primary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock *</Label>
                      <Input 
                        id="stock" 
                        name="stock" 
                        type="number" 
                        placeholder="0" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Select value={selectedBrand} onValueChange={(val) => setSelectedBrand(val || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder={isBrandsLoading ? "Loading..." : "Select brand"} />
                        </SelectTrigger>
                        <SelectContent>
                          {brandsError ? (
                            <SelectItem value="error" disabled>{brandsError}</SelectItem>
                          ) : brands.length === 0 ? (
                            <SelectItem value="none" disabled>No brands found</SelectItem>
                          ) : (
                            brands.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder={isCategoriesLoading ? "Loading..." : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesError ? (
                            <SelectItem value="error" disabled>{categoriesError}</SelectItem>
                          ) : parentCategories.length === 0 ? (
                            <SelectItem value="none" disabled>No categories found</SelectItem>
                          ) : (
                            parentCategories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Sub Category</Label>
                      <Select 
                        value={selectedSubCategory} 
                        onValueChange={(val) => setSelectedSubCategory(val || '')}
                        disabled={!selectedCategory || isSubcategoriesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isSubcategoriesLoading 
                              ? "Loading subcategories..." 
                              : !selectedCategory 
                                ? "Select a category first" 
                                : subcategories.length === 0 
                                  ? "No subcategories found" 
                                  : "Select sub category"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategoriesError ? (
                            <SelectItem value="error" disabled>{subcategoriesError}</SelectItem>
                          ) : subcategories.length === 0 ? (
                            <SelectItem value="none" disabled>No subcategories found</SelectItem>
                          ) : (
                            subcategories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Color & Size Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <MultiSelectDropdown
                      label="Color Options"
                      placeholder="Select or add colors..."
                      options={availableColors}
                      selectedValues={selectedColors}
                      onChange={setSelectedColors}
                    />
                    <MultiSelectDropdown
                      label="Size Options"
                      placeholder="Select or add sizes..."
                      options={availableSizes}
                      selectedValues={selectedSizes}
                      onChange={setSelectedSizes}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      placeholder="Enter product description"
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea 
                      id="shortDescription" 
                      name="shortDescription"
                      placeholder="Enter short description for product cards"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input placeholder="Add tags (press Enter to add)" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">summer</Badge>
                      <Badge variant="secondary">new arrival</Badge>
                      <Badge variant="secondary">trending</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input id="keywords" placeholder="Enter keywords for search" />
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="featured" />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="trending" />
                      <Label htmlFor="trending">Trending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bestseller" />
                      <Label htmlFor="bestseller">Best Seller</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="newarrival" />
                      <Label htmlFor="newarrival">New Arrival</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" keepMounted className="data-[hidden]:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Inventory</CardTitle>
                  <CardDescription>Set pricing and stock information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pricing-price">Price (₹) *</Label>
                      <Input 
                        id="pricing-price" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mrp">MRP</Label>
                      <Input id="mrp" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount</Label>
                      <Input id="discount" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricing-shippingCharge" className="font-bold text-primary flex items-center gap-1.5">
                        Shipping Charge (₹)
                      </Label>
                      <Input 
                        id="pricing-shippingCharge" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={shippingCharge}
                        onChange={(e) => setShippingCharge(e.target.value)}
                        className="border-primary/40 focus:border-primary" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pricing-stock">Stock *</Label>
                      <Input 
                        id="pricing-stock" 
                        type="number" 
                        placeholder="0" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lowStock">Low Stock Threshold</Label>
                      <Input id="lowStock" type="number" placeholder="10" />
                    </div>
                  </div>

                  {/* Tax & GST Configuration */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Tax & GST Configuration</h4>
                        <p className="text-xs text-muted-foreground">Select a tax rule created in Tax Rules, or enter custom GST details.</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        {taxRules.length} Tax Rule(s) Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="taxRule">Tax Rule / GST Rate</Label>
                        <select
                          id="taxRule"
                          value={selectedTaxRule}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedTaxRule(val);
                            const found = taxRules.find((t: any) => String(t.id) === String(val));
                            if (found) {
                              if (found.hsnCode) setHsnCode(found.hsnCode);
                              setTaxType((found.taxType || found.type || 'GST').toUpperCase());
                              setTaxRate(found.rate !== undefined ? `${found.rate}` : (found.taxPercent !== undefined ? `${found.taxPercent}` : ''));
                            } else {
                              setTaxRate('');
                            }
                          }}
                          className="w-full h-10 rounded-md border border-border/50 bg-background px-3 py-1 text-sm focus:border-primary outline-none cursor-pointer"
                        >
                          <option value="">Default / Select Tax Rule</option>
                          {taxRules.map((rule) => (
                            <option key={rule.id} value={String(rule.id)}>
                              {rule.name} ({rule.rate}% — {rule.taxType || rule.type || 'GST'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxType">Tax Type</Label>
                        <select
                          id="taxType"
                          value={taxType}
                          onChange={(e) => setTaxType(e.target.value)}
                          className="w-full h-10 rounded-md border border-border/50 bg-background px-3 py-1 text-sm focus:border-primary outline-none cursor-pointer font-medium"
                        >
                          <option value="GST">GST</option>
                          <option value="IGST">IGST</option>
                          <option value="VAT">VAT</option>
                          <option value="EXCLUSIVE">Exclusive</option>
                          <option value="INCLUSIVE">Inclusive</option>
                          <option value="NONE">None / Exempt</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax % Rate</Label>
                        <Input
                          id="taxRate"
                          placeholder="Rate %"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          className="font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hsnCode">HSN / SAC Code</Label>
                        <Input
                          id="hsnCode"
                          placeholder="e.g. 6204 (Apparel)"
                          value={hsnCode}
                          onChange={(e) => setHsnCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" type="number" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (cm)</Label>
                      <Input id="length" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input id="width" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" type="number" placeholder="0" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" placeholder="Enter barcode" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" keepMounted className="data-[hidden]:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>Upload product images (drag & drop supported)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {images.map((image, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                            <ImageIcon className="h-full w-full p-8 text-muted-foreground" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            {index === 0 ? 'Thumbnail' : index + 1}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variants" keepMounted className="data-[hidden]:hidden">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Product Variants
                      </CardTitle>
                      <CardDescription>
                        Manage product variants (SKU, Price, Stock, Color, and Size) in a single consolidated list.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={addVariant}
                      className="bg-primary hover:bg-primary/90 gap-2 text-white font-semibold shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Variant Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {variants.map((variant, index) => (
                    <div key={index} className="border rounded-xl p-4 space-y-4 bg-card shadow-sm hover:border-primary/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold border-primary/30 text-primary">
                            Variant Option #{index + 1}
                          </Badge>
                          {variant.color && <Badge variant="secondary">{variant.color}</Badge>}
                          {variant.size && <Badge variant="secondary">{variant.size}</Badge>}
                        </div>
                        {variants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                            className="text-rose-500 hover:bg-rose-500/10 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">SKU Code</Label>
                          <Input
                            placeholder="e.g. SKU-RED-L"
                            value={variant.sku}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].sku = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Price (₹ / $)</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={variant.price}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].price = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Stock Qty</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.stock}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].stock = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Color</Label>
                          <Input
                            placeholder="e.g. Red, Navy, Black"
                            list={`color-options-${index}`}
                            value={variant.color}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].color = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                          <datalist id={`color-options-${index}`}>
                            {availableColors.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Size</Label>
                          <Input
                            placeholder="e.g. S, M, L, XL, 32"
                            list={`size-options-${index}`}
                            value={variant.size}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].size = e.target.value;
                              setVariants(newVariants);
                            }}
                          />
                          <datalist id={`size-options-${index}`}>
                            {availableSizes.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addVariant} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Custom Variant Row
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" keepMounted className="data-[hidden]:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>Optimize your product for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" placeholder="product-url-slug" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input id="metaTitle" name="metaTitle" placeholder="SEO title" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea 
                      id="metaDescription" 
                      name="metaDescription"
                      placeholder="SEO description"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input id="metaKeywords" placeholder="SEO keywords" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </AdminLayout>
  );
}
