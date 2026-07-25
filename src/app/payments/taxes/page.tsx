'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AppDrawer } from '@/components/ui/app-drawer';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE, authHeaders } from '@/lib/api';
import {
  Plus, Edit, Trash2, Percent, Search, Filter, RefreshCw, CheckCircle2, XCircle,
  Eye, Globe, FileText, CheckSquare, Square, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface TaxRule {
  id: string;
  name: string;
  taxCode: string;
  taxType: string;
  country: string;
  state?: string | null;
  zipCode?: string | null;
  rate: number;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  description?: string | null;
  priority: number;
  displayOrder: number;
  isDefault: boolean;
  isActive: boolean;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  createdAt?: string;
}

const COUNTRIES = [
  { code: 'IN', name: 'India (IN)' },
  { code: 'US', name: 'United States (US)' },
  { code: 'GB', name: 'United Kingdom (GB)' },
  { code: 'CA', name: 'Canada (CA)' },
  { code: 'AU', name: 'Australia (AU)' },
  { code: 'AE', name: 'United Arab Emirates (AE)' },
  { code: 'DE', name: 'Germany (DE)' },
  { code: 'FR', name: 'France (FR)' },
];

export default function TaxesPage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dynamicTaxTypes, setDynamicTaxTypes] = useState<string[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection & Bulk Action State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer / Modal States
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [viewingRule, setViewingRule] = useState<TaxRule | null>(null);

  const fetchTaxTypes = useCallback(async () => {
    try {
      let res = await fetch(`${API_BASE}/api/admin/taxes/types`, { headers: authHeaders() });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/taxes/types`, { headers: authHeaders() });
      }
      if (res.ok) {
        const json = await res.json();
        const raw = json.data || json;
        if (Array.isArray(raw) && raw.length > 0) {
          const names = raw.map((item: any) => typeof item === 'string' ? item : (item.name || item.id || item.code));
          setDynamicTaxTypes(Array.from(new Set(names)));
        }
      }
    } catch (e) {
      console.warn('Could not fetch dynamic tax types', e);
    }
  }, []);

  // Form State
  const [form, setForm] = useState({
    name: '',
    taxCode: '',
    taxType: '',
    country: '',
    state: '',
    zipCode: '',
    rate: '',
    cgst: '',
    sgst: '',
    igst: '',
    description: '',
    priority: '0',
    displayOrder: '0',
    isDefault: false,
    isActive: true,
    effectiveDate: '',
    expiryDate: '',
  });

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
      });
      if (selectedType !== 'ALL') queryParams.append('taxType', selectedType);
      if (selectedCountry !== 'ALL') queryParams.append('country', selectedCountry);
      if (selectedStatus !== 'ALL') queryParams.append('isActive', String(selectedStatus === 'ACTIVE'));

      let res = await fetch(`${API_BASE}/api/admin/taxes?${queryParams.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/taxes?${queryParams.toString()}`, {
          headers: authHeaders(),
        });
      }

      if (res.ok) {
        const json = await res.json();
        const rawList =
          json.data?.taxes ||
          json.taxes ||
          (Array.isArray(json.data) ? json.data : []) ||
          (Array.isArray(json) ? json : []);
        const paginationObj = json.data?.pagination || json.pagination;

        const items: TaxRule[] = Array.isArray(rawList)
          ? rawList.map((t: any) => ({
              id: String(t.id),
              name: t.name,
              taxCode: t.taxCode || t.code || `TAX-${t.id}`,
              taxType: t.taxType?.name || t.taxType?.code || t.taxType || t.type || 'GST',
              country: t.country || 'IN',
              state: t.state || null,
              zipCode: t.zipCode || null,
              rate: Number(t.rate || 0),
              cgst: t.cgst !== undefined && t.cgst !== null ? Number(t.cgst) : Number(t.rate || 0) / 2,
              sgst: t.sgst !== undefined && t.sgst !== null ? Number(t.sgst) : Number(t.rate || 0) / 2,
              igst: t.igst !== undefined && t.igst !== null ? Number(t.igst) : Number(t.rate || 0),
              description: t.description || null,
              priority: Number(t.priority || 0),
              displayOrder: Number(t.displayOrder || 0),
              isDefault: Boolean(t.isDefault),
              isActive: t.isActive !== false,
              effectiveDate: t.effectiveDate ? String(t.effectiveDate).split('T')[0] : null,
              expiryDate: t.expiryDate ? String(t.expiryDate).split('T')[0] : null,
              createdAt: t.createdAt,
            }))
          : [];

        setRules(items);
        setTotalPages(paginationObj?.totalPages || 1);
        setTotalCount(paginationObj?.total || items.length);
      }
    } catch (err) {
      console.error('Failed to fetch tax rules:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedType, selectedCountry, selectedStatus]);

  useEffect(() => {
    fetchTaxes();
    fetchTaxTypes();
  }, [fetchTaxes, fetchTaxTypes]);

  // Open Add Drawer
  const handleOpenAdd = () => {
    setEditingRule(null);
    setForm({
      name: '',
      taxCode: '',
      taxType: '',
      country: '',
      state: '',
      zipCode: '',
      rate: '',
      cgst: '',
      sgst: '',
      igst: '',
      description: '',
      priority: '0',
      displayOrder: '0',
      isDefault: false,
      isActive: true,
      effectiveDate: '',
      expiryDate: '',
    });
    setOpenDrawer(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (rule: TaxRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      taxCode: rule.taxCode,
      taxType: rule.taxType,
      country: rule.country || 'IN',
      state: rule.state || '',
      zipCode: rule.zipCode || '',
      rate: String(rule.rate),
      cgst: String(rule.cgst ?? rule.rate / 2),
      sgst: String(rule.sgst ?? rule.rate / 2),
      igst: String(rule.igst ?? rule.rate),
      description: rule.description || '',
      priority: String(rule.priority),
      displayOrder: String(rule.displayOrder),
      isDefault: rule.isDefault,
      isActive: rule.isActive,
      effectiveDate: rule.effectiveDate || '',
      expiryDate: rule.expiryDate || '',
    });
    setOpenDrawer(true);
  };

  // Auto calculate CGST/SGST/IGST when rate changes
  const handleRateChange = (newRate: string) => {
    const val = parseFloat(newRate) || 0;
    setForm((prev) => ({
      ...prev,
      rate: newRate,
      cgst: String(val / 2),
      sgst: String(val / 2),
      igst: String(val),
    }));
  };

  // Add or Update Handler
  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      taxCode: form.taxCode.toUpperCase().trim(),
      type: 'PERCENTAGE',
      taxType: form.taxType,
      country: form.country,
      state: form.state.trim() || undefined,
      zipCode: form.zipCode.trim() || undefined,
      rate: parseFloat(form.rate) || 0,
      cgst: parseFloat(form.cgst) || 0,
      sgst: parseFloat(form.sgst) || 0,
      igst: parseFloat(form.igst) || 0,
      description: form.description.trim() || undefined,
      priority: parseInt(form.priority) || 0,
      displayOrder: parseInt(form.displayOrder) || 0,
      isDefault: form.isDefault,
      isActive: form.isActive,
      effectiveDate: form.effectiveDate || undefined,
      expiryDate: form.expiryDate || undefined,
    };

    try {
      const url = editingRule
        ? `${API_BASE}/api/admin/taxes/${editingRule.id}`
        : `${API_BASE}/api/admin/taxes`;
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.errors?.join(', ') || 'Failed to save tax rule');
        return;
      }

      toast.success(`Tax rule ${editingRule ? 'updated' : 'created'} successfully!`);
      setOpenDrawer(false);
      setEditingRule(null);
      fetchTaxes();
    } catch (err: any) {
      console.error('Failed to save tax rule:', err);
      toast.error(err.message || 'Server error saving tax rule');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax rule?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/taxes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success('Tax rule deleted');
        fetchTaxes();
      } else {
        toast.error('Failed to delete tax rule');
      }
    } catch (err) {
      toast.error('Failed to delete tax rule');
    }
  };

  // Toggle Active Status Directly
  const handleToggleStatus = async (rule: TaxRule) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/taxes/${rule.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (res.ok) {
        toast.success(`Tax rule ${!rule.isActive ? 'activated' : 'deactivated'}`);
        fetchTaxes();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'ENABLE' | 'DISABLE' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    if (action === 'DELETE' && !confirm(`Are you sure you want to delete ${selectedIds.length} tax rules?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/taxes/bulk`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action,
          taxRuleIds: selectedIds.map(Number),
        }),
      });

      if (res.ok) {
        toast.success(`Bulk ${action.toLowerCase()} completed for ${selectedIds.length} items`);
        setSelectedIds([]);
        fetchTaxes();
      }
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rules.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <PageHeader
          titlePart1="Finance"
          titlePart2="Tax Management"
          badgeText="Multi-Country Engine"
          subtitle="Configure GST, VAT, Sales Tax, and country-specific tax rules across all jurisdictions."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTaxes}
                className="h-10 rounded-lg border-border/50 gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleOpenAdd}
                className="h-10 rounded-lg gap-2 bg-[#0d9488] hover:bg-[#0c857a] text-white font-bold shadow-md shadow-teal-500/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Tax Rule
              </Button>
            </div>
          }
        />

        {/* GST & Tax Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/40 bg-card rounded-xl shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <span>Active Rules</span>
                <Percent className="h-4 w-4 text-[#0d9488]" />
              </div>
              <p className="text-2xl font-black mt-2 text-foreground">{rules.filter((r) => r.isActive).length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card rounded-xl shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <span>Countries</span>
                <Globe className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black mt-2 text-blue-500">
                {new Set(rules.map((r) => r.country)).size || 1}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card rounded-xl shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <span>GST Standard</span>
                <ShieldCheck className="h-4 w-4 text-violet-500" />
              </div>
              <p className="text-2xl font-black mt-2 text-violet-500">18%</p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card rounded-xl shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <span>Total Tax Rules</span>
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black mt-2 text-amber-500">{totalCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter & Bulk Actions Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/40">
          <div className="flex flex-1 items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tax name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-lg text-sm bg-background border-border/50"
              />
            </div>

            {/* Filter by Tax Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-lg border border-border/50 bg-background px-3 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Tax Types</option>
              {dynamicTaxTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Filter by Country */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="h-10 rounded-lg border border-border/50 bg-background px-3 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-lg border border-border/50 bg-background px-3 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Bulk Action Buttons */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                {selectedIds.length} Selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('ENABLE')}
                className="h-9 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 rounded-lg"
              >
                Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('DISABLE')}
                className="h-9 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 rounded-lg"
              >
                Disable
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('DELETE')}
                className="h-9 text-xs rounded-lg"
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Tax Rules Table */}
        <Card className="border-border/40 bg-card rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="cursor-pointer border-none bg-transparent">
                      {selectedIds.length === rules.length && rules.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-[#0d9488]" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Tax Code</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">CGST %</th>
                  <th className="p-3.5">SGST %</th>
                  <th className="p-3.5">IGST %</th>
                  <th className="p-3.5">Total Rate %</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground animate-pulse font-semibold">
                      Loading Tax Rules...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No tax rules found matching your filters.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => {
                    const isSelected = selectedIds.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isSelected ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <button onClick={() => toggleSelect(r.id)} className="cursor-pointer border-none bg-transparent">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-[#0d9488]" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-foreground">{r.taxCode}</td>
                        <td className="p-3.5 font-semibold text-foreground">{r.name}</td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              r.taxType?.toLowerCase().includes('inclusive')
                                ? 'border-indigo-300 text-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                                : r.taxType?.toLowerCase().includes('exclusive')
                                ? 'border-sky-300 text-sky-700 bg-sky-50/50 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800'
                                : 'border-teal-300 text-teal-700 bg-teal-50/50 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800'
                            }`}
                          >
                            {r.taxType}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-bold uppercase">{r.country}</td>
                        <td className="p-3.5 text-muted-foreground">{r.cgst ?? (r.rate / 2)}%</td>
                        <td className="p-3.5 text-muted-foreground">{r.sgst ?? (r.rate / 2)}%</td>
                        <td className="p-3.5 text-muted-foreground">{r.igst ?? r.rate}%</td>
                        <td className="p-3.5 font-black text-emerald-600 text-sm">{r.rate}%</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStatus(r)}
                            className="inline-flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                          >
                            {r.isActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">
                                <XCircle className="h-3 w-3 mr-1" /> Inactive
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                              onClick={() => setViewingRule(r)}
                              title="View Rule Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-teal-600 hover:bg-teal-50"
                              onClick={() => handleOpenEdit(r)}
                              title="Edit Tax Rule"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50"
                              onClick={() => handleDelete(r.id)}
                              title="Delete Tax Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground">
            <div>
              Showing {rules.length} of {totalCount} tax rules (Page {page} of {totalPages})
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span>Page size:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="h-8 rounded border border-border/50 bg-background text-xs px-2 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* View Details Modal */}
        {viewingRule && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono font-bold border-teal-300 text-teal-700">
                    {viewingRule.taxCode}
                  </Badge>
                  <h3 className="font-bold text-base text-foreground">{viewingRule.name}</h3>
                </div>
                <button
                  onClick={() => setViewingRule(null)}
                  className="text-muted-foreground hover:text-foreground font-bold border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Tax Type</span>
                  <p className="font-bold text-foreground">{viewingRule.taxType}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Country</span>
                  <p className="font-bold text-foreground">{viewingRule.country}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Total Rate</span>
                  <p className="font-black text-emerald-600 text-base">{viewingRule.rate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">GST Breakdown</span>
                  <p className="font-bold text-foreground">
                    CGST: {viewingRule.cgst}% | SGST: {viewingRule.sgst}% | IGST: {viewingRule.igst}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Effective Date</span>
                  <p className="font-bold text-foreground">{viewingRule.effectiveDate || 'Immediate'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Expiry Date</span>
                  <p className="font-bold text-foreground">{viewingRule.expiryDate || 'No Expiration'}</p>
                </div>
              </div>

              {viewingRule.description && (
                <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground block mb-1">Description:</span>
                  {viewingRule.description}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setViewingRule(null)} className="rounded-lg bg-primary text-white">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Tax Drawer */}
        <AppDrawer
          title={editingRule ? 'Edit Tax Rule' : 'Add Tax Rule'}
          subtitle={
            editingRule
              ? 'Update the selected GST/VAT tax rule configuration.'
              : 'Create a new GST, VAT, or Sales Tax rule for your catalog.'
          }
          open={openDrawer}
          onClose={setOpenDrawer}
          onSubmit={handleAddOrUpdate}
        >
          <div className="space-y-4 text-xs">
            {/* Rule Name & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tax Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. GST 18% Standard"
                  className="h-10 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tax Code *</Label>
                <Input
                  required
                  value={form.taxCode}
                  onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
                  placeholder="e.g. GST_18_IN"
                  className="h-10 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Tax Type & Country */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tax Type *</Label>
                <select
                  value={form.taxType}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const isNoTaxSelected = !selected || ['No Tax', 'NO_TAX', 'NONE', 'None', 'Exempt'].includes(selected);
                    if (isNoTaxSelected) {
                      setForm({ ...form, taxType: selected, rate: '0', cgst: '0', sgst: '0', igst: '0' });
                    } else {
                      setForm({ ...form, taxType: selected, rate: form.rate === '0' ? '18' : form.rate });
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium outline-none cursor-pointer"
                >
                  {dynamicTaxTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Country *</Label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium outline-none cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Helper computed boolean for No Tax */}
            {(() => {
              const isNoTax = !form.taxType || ['No Tax', 'NO_TAX', 'NONE', 'None', 'Exempt'].includes(form.taxType);
              return (
                <>
                  {/* Tax Calculation Mode (Inclusive vs Exclusive) */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Tax Calculation Mode (Inclusive vs Exclusive) *</span>
                      {isNoTax && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Disabled for No Tax
                        </span>
                      )}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isNoTax}
                        onClick={() => setForm({ ...form, taxType: form.taxType === 'Inclusive' ? 'GST' : 'Exclusive' })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          isNoTax
                            ? 'opacity-40 cursor-not-allowed bg-muted/10 border-border/40 text-muted-foreground'
                            : form.taxType !== 'Inclusive'
                            ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs cursor-pointer'
                            : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 cursor-pointer'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          🔹 Exclusive
                        </span>
                        <span className="text-[10px] font-normal opacity-80">Tax added extra at checkout</span>
                      </button>

                      <button
                        type="button"
                        disabled={isNoTax}
                        onClick={() => setForm({ ...form, taxType: 'Inclusive' })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          isNoTax
                            ? 'opacity-40 cursor-not-allowed bg-muted/10 border-border/40 text-muted-foreground'
                            : form.taxType === 'Inclusive'
                            ? 'border-indigo-500 bg-indigo-500/10 text-foreground font-bold shadow-xs cursor-pointer'
                            : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 cursor-pointer'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          🔸 Inclusive
                        </span>
                        <span className="text-[10px] font-normal opacity-80">Price is inclusive of tax (MRP)</span>
                      </button>
                    </div>
                  </div>

                  {/* Total Rate % */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Total Tax Rate (%) *</span>
                      {isNoTax && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Locked to 0%</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      required={!isNoTax}
                      disabled={isNoTax}
                      value={isNoTax ? '0' : form.rate}
                      onChange={(e) => handleRateChange(e.target.value)}
                      placeholder="18"
                      className={`h-10 rounded-lg text-xs font-bold ${
                        isNoTax ? 'bg-muted/30 text-muted-foreground opacity-60 cursor-not-allowed' : 'text-emerald-600'
                      }`}
                    />
                  </div>

                  {/* GST Component Breakdown (CGST, SGST, IGST) */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    isNoTax ? 'bg-muted/20 border-border/30 opacity-50' : 'bg-muted/40 border-border/40'
                  } space-y-2`}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      GST Component Breakdown (Auto-Calculated)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">CGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={isNoTax}
                          value={isNoTax ? '0' : form.cgst}
                          onChange={(e) => setForm({ ...form, cgst: e.target.value })}
                          className="h-9 text-xs rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">SGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={isNoTax}
                          value={isNoTax ? '0' : form.sgst}
                          onChange={(e) => setForm({ ...form, sgst: e.target.value })}
                          className="h-9 text-xs rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">IGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={isNoTax}
                          value={isNoTax ? '0' : form.igst}
                          onChange={(e) => setForm({ ...form, igst: e.target.value })}
                          className="h-9 text-xs rounded-lg bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Priority & Display Order */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority Order</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="h-10 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Display Order</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                  className="h-10 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Effective & Expiry Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Effective Date</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  className="h-10 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="h-10 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief details regarding this tax rule..."
                className="h-10 rounded-lg text-xs"
              />
            </div>

            {/* Toggles: Active Status & Default Tax */}
            <div className="space-y-3 border-t border-border/40 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Active Status</Label>
                  <p className="text-[10px] text-muted-foreground">Enable or disable this rule</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Default Tax for Country</Label>
                  <p className="text-[10px] text-muted-foreground">Apply by default to unassigned items</p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                />
              </div>
            </div>
          </div>
        </AppDrawer>
      </div>
    </AdminLayout>
  );
}
