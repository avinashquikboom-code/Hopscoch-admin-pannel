'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { toast } from '@/components/ui/toast';
import { API_BASE } from '@/lib/api';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
  Power,
} from 'lucide-react';

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') ||
        localStorage.getItem('admin_token') ||
        localStorage.getItem('token')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault: boolean;
  shiprocketPickupName?: string | null;
  createdAt: string;
  _count?: {
    inventory?: number;
    movements?: number;
  };
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab filter: ALL | ACTIVE | INACTIVE
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal / Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Default action loading
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    phone: '',
    email: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    isDefault: false,
    shiprocketPickupName: '',
  });

  const smartFetch = async (path: string, options: RequestInit = {}) => {
    const headers = { ...authHeaders(), ...(options.headers || {}) };
    const opts = { ...options, headers };

    // 1. Try standard /api/admin/... or /api/inventory/... first
    const primaryUrl = `${API_BASE}${path}`;
    let res = await fetch(primaryUrl, opts);

    if (res.status === 404) {
      // 2. If path is /api/admin/..., try /api/v1/admin/...
      if (path.startsWith('/api/admin/')) {
        const altUrl = `${API_BASE}/api/v1${path.replace('/api', '')}`;
        const altRes = await fetch(altUrl, opts);
        if (altRes.ok || altRes.status !== 404) return altRes;
      }
      // 3. If path is /api/v1/admin/..., try /api/admin/...
      else if (path.startsWith('/api/v1/admin/')) {
        const altUrl = `${API_BASE}/api${path.replace('/api/v1', '')}`;
        const altRes = await fetch(altUrl, opts);
        if (altRes.ok || altRes.status !== 404) return altRes;
      }
      // 4. If path is /api/inventory/..., try /api/v1/inventory/...
      else if (path.startsWith('/api/inventory/')) {
        const altUrl = `${API_BASE}/api/v1${path.replace('/api', '')}`;
        const altRes = await fetch(altUrl, opts);
        if (altRes.ok || altRes.status !== 404) return altRes;
      }
    }
    return res;
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await smartFetch('/api/admin/warehouses');
      const json = await res.json();
      let list: Warehouse[] = [];
      if (json.success && Array.isArray(json.data?.warehouses)) {
        list = json.data.warehouses;
      } else if (Array.isArray(json.data)) {
        list = json.data;
      }
      setWarehouses(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses');
      toast.error('Failed to load warehouse list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openAddDrawer = () => {
    setEditingWarehouse(null);
    const autoCode = `WRH-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      name: '',
      code: autoCode,
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
      isDefault: warehouses.length === 0,
      shiprocketPickupName: '',
    });
    setShowDrawer(true);
  };

  const openEditDrawer = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      name: wh.name || '',
      code: wh.code || '',
      address: wh.address || '',
      city: wh.city || '',
      state: wh.state || '',
      country: wh.country || 'India',
      pincode: wh.pincode || '',
      phone: wh.phone || '',
      email: wh.email || '',
      status: wh.status || 'ACTIVE',
      isDefault: wh.isDefault || false,
      shiprocketPickupName: wh.shiprocketPickupName || '',
    });
    setShowDrawer(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim()) return toast.error('Warehouse Name is required');
    if (!formData.address.trim()) return toast.error('Address is required');
    if (!formData.city.trim()) return toast.error('City is required');
    if (!formData.state.trim()) return toast.error('State is required');
    if (!formData.pincode.trim()) return toast.error('Pincode is required');
    if (!formData.phone.trim()) return toast.error('Phone is required');
    if (!formData.email.trim()) return toast.error('Email is required');

    setSubmitting(true);
    try {
      const isEdit = !!editingWarehouse;
      const path = isEdit
        ? `/api/admin/warehouses/${editingWarehouse.id}`
        : `/api/admin/warehouses`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await smartFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        toast.success(
          isEdit
            ? 'Warehouse updated successfully'
            : 'Warehouse created successfully'
        );
        setShowDrawer(false);
        fetchWarehouses();
      } else {
        toast.error(json.message || 'Operation failed');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (wh: Warehouse) => {
    if (wh.isDefault && wh.status === 'ACTIVE') {
      return toast.error(
        'Cannot set default warehouse to INACTIVE. Mark another warehouse as default first.'
      );
    }
    const newStatus = wh.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingStatusId(wh.id);
    try {
      const res = await smartFetch(`/api/admin/warehouses/${wh.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`${wh.name} status changed to ${newStatus}`);
        fetchWarehouses();
      } else {
        toast.error(json.message || 'Failed to update warehouse status');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleSetDefault = async (wh: Warehouse) => {
    if (wh.isDefault) return;
    setSettingDefaultId(wh.id);
    try {
      // Primary: PUT /api/admin/warehouses/:id with { isDefault: true, status: 'ACTIVE' }
      let res = await smartFetch(`/api/admin/warehouses/${wh.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isDefault: true, status: 'ACTIVE' }),
      });

      // Fallback: POST /api/inventory/warehouses/:id/set-default
      if (res.status === 404 || !res.ok) {
        res = await smartFetch(`/api/inventory/warehouses/${wh.id}/set-default`, {
          method: 'POST',
        });
      }

      const json = await res.json();
      if (res.ok && (json.success || json.data || json.id)) {
        toast.success(`${wh.name} is now the default warehouse`);
        fetchWarehouses();
      } else {
        toast.error(json.message || 'Failed to set default warehouse');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const target = warehouses.find((w) => w.id === deleteId);
    if (target?.isDefault) {
      toast.error(
        'Cannot delete the default warehouse. Mark another warehouse as default first.'
      );
      setDeleteId(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await smartFetch(`/api/admin/warehouses/${deleteId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'Warehouse removed');
        const targetId = deleteId;
        setDeleteId(null);
        setWarehouses((prev) => prev.filter((w) => w.id !== targetId));
        fetchWarehouses();
      } else {
        toast.error(json.message || 'Failed to delete warehouse');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Calculate Filter Counts
  const activeCount = warehouses.filter((w) => w.status === 'ACTIVE').length;
  const inactiveCount = warehouses.filter((w) => w.status === 'INACTIVE').length;

  const displayedWarehouses = warehouses.filter((w) => {
    if (statusTab === 'ACTIVE') return w.status === 'ACTIVE';
    if (statusTab === 'INACTIVE') return w.status === 'INACTIVE';
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Warehouse"
          titlePart2="Management"
          badgeText="Fulfillment Hub"
          subtitle="Manage physical warehouses, addresses, default dispatches, and active/inactive status."
          actions={
            <div className="flex gap-2">
              <Button
                onClick={openAddDrawer}
                className="rounded-md gap-2 text-xs bg-primary text-white hover:bg-primary/95 shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Warehouse
              </Button>
              <Button
                onClick={fetchWarehouses}
                variant="ghost"
                size="icon"
                className="rounded-md h-9 w-9"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          }
        />

        {/* Warehouses Table Card */}
        <Card className="border-border/40 bg-card rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" /> Physical
              Warehouses ({warehouses.length})
            </CardTitle>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40">
              <button
                onClick={() => setStatusTab('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  statusTab === 'ALL'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({warehouses.length})
              </button>
              <button
                onClick={() => setStatusTab('ACTIVE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  statusTab === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusTab('INACTIVE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  statusTab === 'INACTIVE'
                    ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-500 font-medium">
                {error}
              </div>
            ) : displayedWarehouses.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <p className="font-semibold text-foreground">
                  No warehouses found in {statusTab.toLowerCase()} view
                </p>
                <p className="text-xs">
                  {statusTab === 'INACTIVE'
                    ? 'There are no inactive warehouses.'
                    : 'Create your first warehouse facility to manage inventory dispatches.'}
                </p>
                {statusTab === 'ALL' && (
                  <Button
                    onClick={openAddDrawer}
                    size="sm"
                    className="bg-primary text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create Warehouse
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs uppercase font-bold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Warehouse / Code</th>
                      <th className="px-4 py-3">Location Address</th>
                      <th className="px-4 py-3">Contact Details</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {displayedWarehouses.map((wh) => (
                      <tr
                        key={wh.id}
                        className={`hover:bg-muted/10 transition-colors ${
                          wh.status === 'INACTIVE' ? 'opacity-70 bg-muted/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2 font-bold text-foreground">
                                {wh.name}
                                {wh.isDefault && (
                                  <Badge className="bg-teal-500/15 text-teal-600 border border-teal-500/30 text-[10px] gap-1 px-2 py-0.5">
                                    <Star className="h-3 w-3 fill-teal-600" /> DEFAULT
                                  </Badge>
                                )}
                              </div>
                              <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                {wh.code}
                              </code>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium text-foreground">{wh.address}</p>
                            <p className="text-muted-foreground">
                              {wh.city}, {wh.state} - {wh.pincode} ({wh.country})
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-0.5 text-muted-foreground">
                            <p className="flex items-center gap-1 font-medium text-foreground">
                              <Phone className="h-3 w-3 text-teal-600" /> {wh.phone}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" /> {wh.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(wh)}
                            disabled={togglingStatusId === wh.id}
                            title="Click to toggle Active / Inactive status"
                            className="cursor-pointer group"
                          >
                            {togglingStatusId === wh.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                            ) : wh.status === 'ACTIVE' ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] gap-1 group-hover:bg-emerald-500/30 transition-colors">
                                <CheckCircle2 className="h-3 w-3" /> ACTIVE
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/15 text-rose-600 border border-rose-500/30 text-[10px] gap-1 group-hover:bg-rose-500/30 transition-colors">
                                <XCircle className="h-3 w-3" /> INACTIVE
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active/Inactive Quick Action */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(wh)}
                              disabled={togglingStatusId === wh.id || (wh.isDefault && wh.status === 'ACTIVE')}
                              title={
                                wh.status === 'ACTIVE'
                                  ? 'Deactivate Warehouse'
                                  : 'Activate Warehouse'
                              }
                              className={`h-8 w-8 p-0 cursor-pointer ${
                                wh.status === 'ACTIVE'
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-emerald-500 hover:text-emerald-600'
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>

                            {!wh.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetDefault(wh)}
                                disabled={settingDefaultId === wh.id}
                                className="h-8 text-xs border-teal-500/30 text-teal-600 hover:bg-teal-500/10 cursor-pointer"
                              >
                                {settingDefaultId === wh.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Star className="h-3 w-3 mr-1" />
                                )}
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDrawer(wh)}
                              className="h-8 w-8 p-0 cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(wh.id)}
                              disabled={wh.isDefault}
                              title={
                                wh.isDefault
                                  ? 'Cannot delete default warehouse'
                                  : 'Delete warehouse'
                              }
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right-Side Slide-Over Drawer Panel */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-card h-full border-l border-border/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingWarehouse
                      ? `Update configuration for ${editingWarehouse.code}`
                      : 'Create a new physical warehouse facility'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDrawer(false)}
                  className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                  {/* Basic Details */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                      Facility Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Warehouse Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Central Mumbai Hub"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Warehouse Code (Auto-generated)
                        </label>
                        <input
                          type="text"
                          value={formData.code}
                          readOnly
                          disabled
                          className="w-full p-2.5 rounded-md border border-border/60 bg-muted/50 font-mono text-muted-foreground cursor-not-allowed select-none opacity-80"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Address */}
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                      Physical Location
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="Plot No. 12, Logistics Park"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          placeholder="Maharashtra"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          placeholder="400001"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                      Contact Information
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Phone *
                        </label>
                        <input
                          type="text"
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          placeholder="warehouse@company.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings & Configuration */}
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                      Settings & Status
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full p-2.5 rounded-md border border-border bg-background font-medium focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isDefault}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                isDefault: e.target.checked,
                              })
                            }
                            className="rounded border-border text-teal-600 focus:ring-teal-500 h-4 w-4"
                          />
                          Set as Default Warehouse
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Shiprocket Pickup Location Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Primary_Hub_01"
                        value={formData.shiprocketPickupName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shiprocketPickupName: e.target.value,
                          })
                        }
                        className="w-full p-2.5 rounded-md border border-border bg-background text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Optional reference identifier for legacy Shiprocket pickup mapping.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t bg-muted/20 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDrawer(false)}
                    className="flex-1 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white font-bold cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border/80 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                Delete Warehouse?
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to delete this warehouse? If inventory or stock logs are assigned to it, its status will be set to INACTIVE instead of permanent deletion.
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
