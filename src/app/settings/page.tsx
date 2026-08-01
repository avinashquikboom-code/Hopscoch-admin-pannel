'use client';
import { API_BASE } from '@/lib/api';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCurrency, getCurrencyForCountry, getLanguageForCountry } from '@/context/currency-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  Save,
  Upload,
  Store,
  CreditCard,
  Truck,
  Bell,
  Palette,
  Globe,
  Settings,
  CheckCircle2,
  Volume2,
  Sliders,
  Sparkles,
  Plus,
  Search,
  Send,
  Trash2,
  Tag,
  ShoppingBag,
  Users,
  Calendar,
  Clock,
  Radio,
  Eye,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeNotification(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    title: raw.title || 'System Notification',
    message: raw.message || raw.body || '',
    type: raw.type || 'general',
    sendToAll: raw.sendToAll ?? true,
    targetUsers: Array.isArray(raw.targetUsers) ? raw.targetUsers : [],
    isSent: raw.isSent !== undefined ? raw.isSent : (raw.status === 'sent'),
    sentAt: raw.sentAt ? new Date(raw.sentAt).toLocaleString() : raw.createdAt ? new Date(raw.createdAt).toLocaleString() : '',
  };
}

const notificationTypes: Record<string, { label: string; icon: any; color: string }> = {
  offer: { label: 'Offer', icon: Tag, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  coupon: { label: 'Coupon', icon: Tag, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  order: { label: 'Order Update', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  general: { label: 'General', icon: Bell, color: 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20' },
};

export default function SettingsPage() {
  const { setCurrencyCode } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [config, setConfig] = useState({
    storeName: 'FCI Seller',
    sellerName: 'FCI Seller Retail Pvt. Ltd.',
    sellerContactNumber: '+91 9876543210',
    storeEmail: 'admin@fciseller.com',
    storePhone: '+91 9876543210',
    storeAddress: '123 Fashion Street, New York, NY 10001',
    country: 'IN',
    currency: 'INR',
    language: 'en',
    timezone: 'UTC',
    metaTitle: 'FCI Seller - Luxury Fashion Store',
    metaDescription: 'Discover premium couture fashion and high-end accessories at FCI Seller. Exquisite quality for the modern wardrobe.',
    newOrderAlerts: true,
    lowStockWarnings: true,
    weeklyDigests: false,
  });

  // Notification management state
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilterType, setNotifFilterType] = useState('all');
  const [isAddNotifOpen, setIsAddNotifOpen] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [notifForm, setNotifForm] = useState({ title: '', type: 'general', message: '', targetUsers: '' });

  // Reset Data Modal State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== 'DELETE ALL DATA' || !resetPassword) return;

    setResetLoading(true);
    setResetError(null);
    try {
      let res = await fetch(`${API_BASE}/api/v1/admin/settings/reset-data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ password: resetPassword, scope: 'all' }),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/admin/reset-data`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ password: resetPassword, scope: 'all' }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to reset store data');

      toast.success('All store data has been successfully reset.');
      setIsResetOpen(false);
      setResetPassword('');
      setResetConfirmText('');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setResetError(err.message || 'Reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setConfig(prev => ({ ...prev, ...json.data }));
      }
    } catch {}

    try {
      const curRes = await fetch(`${API_BASE}/api/settings/currencies`, { headers: authHeaders() });
      const curJson = await curRes.json();
      if (curRes.ok && curJson.data) {
        setAvailableCurrencies(curJson.data);
      }
    } catch {}

    try {
      const langRes = await fetch(`${API_BASE}/api/settings/languages`, { headers: authHeaders() });
      const langJson = await langRes.json();
      if (langRes.ok && langJson.data) {
        setAvailableLanguages(langJson.data);
      }
    } catch {}

    try {
      const cRes = await fetch(`${API_BASE}/api/settings/countries`, { headers: authHeaders() });
      const cJson = await cRes.json();
      if (cRes.ok && cJson.data) {
        setAvailableCountries(cJson.data);
      }
    } catch {}
  }, []);

  const handleCountryChange = async (countryCode: string) => {
    let autoCurrency = getCurrencyForCountry(countryCode);
    let autoLanguage = getLanguageForCountry(countryCode);

    try {
      const res = await fetch(`${API_BASE}/api/settings/country-info/${countryCode}`);
      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.currencyCode) autoCurrency = json.data.currencyCode;
        if (json.data.languageCode) autoLanguage = json.data.languageCode;
      }
    } catch {}

    setConfig(prev => ({
      ...prev,
      country: countryCode,
      currency: autoCurrency,
      language: autoLanguage,
    }));
    setCurrencyCode(autoCurrency);
    toast.info(`Auto-selected currency (${autoCurrency}) and language (${autoLanguage}) via API for ${countryCode}`);
  };

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: authHeaders() });
      const json = await res.json();
      const raw = json.data ?? json.notifications ?? json ?? [];
      setNotificationsList(Array.isArray(raw) ? raw.map(normalizeNotification) : []);
    } catch {
      setNotificationsList([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchNotifications();
  }, [fetchSettings, fetchNotifications]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setIsSaved(true);
        setCurrencyCode(config.currency);
        toast.success('Store configuration saved successfully');
        setTimeout(() => setIsSaved(false), 2500);
      } else {
        toast.error('Failed to save store configuration');
      }
    } catch {
      toast.error('Network error saving store configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) return;
    const body = {
      title: notifForm.title,
      type: notifForm.type,
      message: notifForm.message,
      sendToAll: sendToAll,
      targetUsers: sendToAll ? [] : notifForm.targetUsers.split(',').map(u => u.trim()).filter(Boolean),
      isSent: false,
    };
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchNotifications();
      } else {
        setNotificationsList(prev => [normalizeNotification({ ...body, id: String(Date.now()) }), ...prev]);
      }
    } catch {
      setNotificationsList(prev => [normalizeNotification({ ...body, id: String(Date.now()) }), ...prev]);
    }
    setNotifForm({ title: '', type: 'general', message: '', targetUsers: '' });
    setSendToAll(true);
    setIsAddNotifOpen(false);
  };

  const handleSendNotification = async (id: string) => {
    const formattedDate = new Date().toLocaleString();
    setNotificationsList(prev =>
      prev.map(n => n.id === id ? { ...n, isSent: true, sentAt: formattedDate } : n)
    );
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/send`, { method: 'POST', headers: authHeaders() });
    } catch {}
  };

  const handleDeleteNotification = async (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
  };

  const filteredNotifications = useMemo(() => {
    return notificationsList.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(notifSearch.toLowerCase()) ||
        n.message.toLowerCase().includes(notifSearch.toLowerCase());
      const matchesType = notifFilterType === 'all' || n.type === notifFilterType;
      return matchesSearch && matchesType;
    });
  }, [notificationsList, notifSearch, notifFilterType]);

  const notifStats = useMemo(() => {
    const total = notificationsList.length;
    const sent = notificationsList.filter(n => n.isSent).length;
    const pending = total - sent;
    const broadcast = notificationsList.filter(n => n.sendToAll).length;
    return { total, sent, pending, broadcast };
  }, [notificationsList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="System"
          titlePart2="Settings"
          badgeText="System Configuration"
          subtitle="Configure core store metadata, language preferences, and notification broadcasts."
        />

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/40 p-1 border border-border/20 rounded-xl flex overflow-x-auto w-full md:w-fit justify-start h-auto">
            <TabsTrigger value="general" className="rounded-lg py-2 px-4 text-xs font-semibold">General Settings</TabsTrigger>
            <TabsTrigger value="store" className="rounded-lg py-2 px-4 text-xs font-semibold">Store Branding</TabsTrigger>
            <TabsTrigger value="notification" className="rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5">
              <span>Notifications</span>
              <Badge variant="secondary" className="bg-[#14b8a6]/15 text-[#14b8a6] border-none text-[10px] px-1.5 py-0 h-4">
                {notificationsList.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reset" className="rounded-lg py-2 px-4 text-xs font-semibold text-rose-500 hover:text-rose-600 data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Data Reset</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">General Configuration</h3>
                  <p className="text-xs text-muted-foreground font-light">Set key contact details and system localized coordinates.</p>
                </div>
                <Separator className="border-border/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Name</Label>
                    <Input id="storeName" value={config.storeName} onChange={e => setConfig(prev => ({ ...prev, storeName: e.target.value }))} className="h-10 rounded-lg border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Email</Label>
                    <Input id="storeEmail" type="email" value={config.storeEmail} onChange={e => setConfig(prev => ({ ...prev, storeEmail: e.target.value }))} className="h-10 rounded-lg border-border/50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sellerName" className="text-xs font-bold uppercase tracking-wider text-primary">Seller Legal Business Name</Label>
                    <Input id="sellerName" value={config.sellerName} onChange={e => setConfig(prev => ({ ...prev, sellerName: e.target.value }))} placeholder="e.g. FCI Seller Retail Pvt. Ltd." className="h-10 rounded-lg border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sellerContactNumber" className="text-xs font-bold uppercase tracking-wider text-primary">Seller Contact Phone Number</Label>
                    <Input id="sellerContactNumber" type="tel" value={config.sellerContactNumber} onChange={e => setConfig(prev => ({ ...prev, sellerContactNumber: e.target.value }))} placeholder="e.g. +91 9876543210" className="h-10 rounded-lg border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storePhone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Hotline Phone</Label>
                  <Input id="storePhone" type="tel" value={config.storePhone} onChange={e => setConfig(prev => ({ ...prev, storePhone: e.target.value }))} className="h-10 rounded-lg border-border/50" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storeAddress" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">HQ Store Address</Label>
                  <Textarea 
                    id="storeAddress" 
                    rows={3} 
                    value={config.storeAddress}
                    onChange={e => setConfig(prev => ({ ...prev, storeAddress: e.target.value }))}
                    className="rounded-lg border-border/50 bg-background resize-none text-sm p-3 focus:border-primary focus:ring-1 focus:ring-primary/20" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="storeCountry" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Country Region</Label>
                    <select
                      id="storeCountry"
                      value={config.country || 'IN'}
                      onChange={e => handleCountryChange(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer font-bold text-primary"
                    >
                      {availableCountries.length > 0 ? (
                        availableCountries.map((c: any) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="IN">India (IN)</option>
                          <option value="US">United States (US)</option>
                          <option value="GB">United Kingdom (GB)</option>
                          <option value="AE">UAE (AE)</option>
                          <option value="CA">Canada (CA)</option>
                          <option value="DE">Germany (DE)</option>
                          <option value="FR">France (FR)</option>
                          <option value="ES">Spain (ES)</option>
                          <option value="MY">Malaysia (MY)</option>
                          <option value="AU">Australia (AU)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Currency</Label>
                    <select
                      id="currency"
                      value={config.currency}
                      onChange={e => setConfig(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      {availableCurrencies.length > 0 ? (
                        availableCurrencies.map((c: any) => (
                          <option key={c.code || c.id} value={c.code}>
                            {c.code} ({c.symbol || ''}) - {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                          <option value="GBP">GBP (£) - British Pound</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="language" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Language</Label>
                    <select
                      id="language"
                      value={config.language}
                      onChange={e => setConfig(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      {availableLanguages.length > 0 ? (
                        availableLanguages.map((l: any) => (
                          <option key={l.code || l.id} value={l.code}>
                            {l.flag || ''} {l.name} ({l.code})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="en">English (en)</option>
                          <option value="hi">Hindi (hi)</option>
                          <option value="es">Spanish (es)</option>
                          <option value="fr">French (fr)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timezone Coordinates</Label>
                    <select
                      id="timezone"
                      value={config.timezone}
                      onChange={e => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="PST">PST</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-lg bg-primary text-white hover:bg-primary/95 shadow-sm h-11 px-6 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isLoading ? (
                      'Saving Changes...'
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Config Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save Configuration
                      </>
                    )}
                  </Button>
                </div>

                <Separator className="border-border/10 my-4" />
                <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Danger Zone — Reset All Store Data</h4>
                      <p className="text-[11px] text-muted-foreground">Purge all products, orders, inventory, customers, reviews, and logs.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                    onClick={() => setIsResetOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Reset Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store" className="mt-0">
            <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Branding & SEO Settings</h3>
                  <p className="text-xs text-muted-foreground font-light">Customize client-facing storefront meta assets.</p>
                </div>
                <Separator className="border-border/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Logo Asset</Label>
                    <div className="border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl p-6 text-center cursor-pointer">
                      <Upload className="h-7 w-7 mx-auto text-muted-foreground/80 mb-2" />
                      <p className="text-xs font-semibold text-foreground">Click to upload logo PNG</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Recommended 200x200px</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Favicon Icon Asset</Label>
                    <div className="border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl p-6 text-center cursor-pointer">
                      <Upload className="h-7 w-7 mx-auto text-muted-foreground/80 mb-2" />
                      <p className="text-xs font-semibold text-foreground">Click to upload favicon ICO</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Recommended 32x32px</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default SEO Meta Title</Label>
                  <Input id="metaTitle" defaultValue="FCI Seller - Luxury Fashion Store" className="h-10 rounded-lg border-border/50" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metaDescription" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default SEO Meta Description</Label>
                  <Textarea 
                    id="metaDescription" 
                    rows={3}
                    defaultValue="Discover premium couture fashion and high-end accessories at FCI Seller. Exquisite quality for the modern wardrobe."
                    className="rounded-lg border-border/50 bg-background resize-none text-sm p-3 focus:border-primary"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-lg bg-primary text-white hover:bg-primary/95 h-11 px-6 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isLoading ? 'Saving Changes...' : isSaved ? <><CheckCircle2 className="h-4 w-4" /> Brand Asset Saved</> : <><Save className="h-4 w-4" /> Save Brand Details</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notification" className="mt-0 space-y-6">
            {/* System Notification Toggles */}
            <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Automated Alert Triggers</h3>
                  <p className="text-xs text-muted-foreground font-light">Configure system-level automatic notification alerts and email briefs.</p>
                </div>
                <Separator className="border-border/10" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border border-border/30 rounded-xl bg-muted/15">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#14b8a6]/10 text-[#14b8a6] rounded-lg shrink-0">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">New Order Alerts</p>
                        <p className="text-[11px] text-muted-foreground font-light mt-0.5">Triggers on new sales</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border/30 rounded-xl bg-muted/15">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Low Stock Warnings</p>
                        <p className="text-[11px] text-muted-foreground font-light mt-0.5">Low inventory alerts</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border/30 rounded-xl bg-muted/15">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Review Alerts</p>
                        <p className="text-[11px] text-muted-foreground font-light mt-0.5">New buyer reviews</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live System Notifications Section */}
            <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">All Broadcast Notifications</h3>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/30">
                        {notifStats.total} Total
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-light">
                      Manage, dispatch, and review all push broadcasts sent across the application.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={fetchNotifications}
                      variant="outline" 
                      size="sm"
                      className="rounded-lg h-9 px-3 border-border/40 text-xs gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${notifLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button 
                      onClick={() => setIsAddNotifOpen(true)}
                      className="rounded-lg bg-primary hover:bg-primary/95 text-white h-9 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Send Notification
                    </Button>
                  </div>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 border border-border/20 rounded-xl bg-muted/20">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                    <p className="text-lg font-extrabold text-foreground mt-0.5">{notifStats.total}</p>
                  </div>
                  <div className="p-3 border border-emerald-500/20 rounded-xl bg-emerald-500/5">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Dispatched</span>
                    <p className="text-lg font-extrabold text-emerald-500 mt-0.5">{notifStats.sent}</p>
                  </div>
                  <div className="p-3 border border-amber-500/20 rounded-xl bg-amber-500/5">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Draft / Pending</span>
                    <p className="text-lg font-extrabold text-amber-500 mt-0.5">{notifStats.pending}</p>
                  </div>
                  <div className="p-3 border border-blue-500/20 rounded-xl bg-blue-500/5">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Broadcast All</span>
                    <p className="text-lg font-extrabold text-blue-500 mt-0.5">{notifStats.broadcast}</p>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search notifications by title or message..." 
                      value={notifSearch}
                      onChange={e => setNotifSearch(e.target.value)}
                      className="pl-9 h-9 rounded-lg border-border/40 text-xs bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                    {['all', 'general', 'offer', 'coupon', 'order'].map(t => (
                      <button
                        key={t}
                        onClick={() => setNotifFilterType(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                          notifFilterType === t 
                            ? 'bg-primary text-white font-bold shadow-xs' 
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Table */}
                <div className="border border-border/20 rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/10">
                        <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Notification</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Type</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Audience</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground uppercase">Status</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading notifications...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredNotifications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                            <div className="space-y-1">
                              <Bell className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                              <p className="font-semibold text-foreground">No notifications found</p>
                              <p className="text-[11px] text-muted-foreground font-light">Create a new broadcast using the button above.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredNotifications.map((item) => {
                          const typeMeta = notificationTypes[item.type] || notificationTypes.general;
                          const IconComp = typeMeta.icon;

                          return (
                            <TableRow key={item.id} className="border-border/10 hover:bg-muted/20 transition-colors">
                              <TableCell className="py-3">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${typeMeta.color}`}>
                                    <IconComp className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 max-w-md">
                                    <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge variant="outline" className={`text-[10px] font-bold capitalize border ${typeMeta.color}`}>
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3">
                                {item.sendToAll ? (
                                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-[10px] font-medium border border-blue-500/20">
                                    <Globe className="h-3 w-3 mr-1" /> Broadcast All
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 text-[10px] font-medium border border-purple-500/20">
                                    <Users className="h-3 w-3 mr-1" /> {item.targetUsers?.length || 0} Segment Users
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-3">
                                {item.isSent ? (
                                  <div className="space-y-0.5">
                                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
                                    </Badge>
                                    {item.sentAt && (
                                      <p className="text-[10px] text-muted-foreground font-mono">{item.sentAt}</p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-medium">
                                    <Clock className="h-3 w-3 mr-1" /> Draft / Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!item.isSent && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleSendNotification(item.id)}
                                      className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg gap-1 cursor-pointer"
                                    >
                                      <Send className="h-3 w-3" /> Dispatch
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteNotification(item.id)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
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
          </TabsContent>

          <TabsContent value="reset" className="mt-0 space-y-6">
            <Card className="border-rose-500/30 bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Danger Zone — Reset All Store Data</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                        Permanently delete products, orders, inventory, customers, reviews, and transactions. Admin user accounts and Tax Rules will be preserved.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 px-3 py-1 font-bold text-xs">
                    High Risk
                  </Badge>
                </div>

                <Separator className="border-border/10" />

                <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 space-y-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <p className="font-bold text-sm text-rose-800 dark:text-rose-200">⚠️ Summary of Data Purge Operations:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>All Products, Variants, Images, and Inventory movements</li>
                    <li>All Orders, Invoices, Payment history, and Return requests</li>
                    <li>All Customer Accounts (Admin user accounts remain preserved)</li>
                    <li>All Carts, Wishlists, Reviews, FAQs, Support Tickets, and Coupons</li>
                    <li>All Analytics logs, Notifications, and System activity history</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 h-11 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                    onClick={() => setIsResetOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Reset Store Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Two-Step Verification Modal for Data Reset */}
        {isResetOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                  <h3 className="text-lg font-extrabold">Confirm System Data Reset</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsResetOpen(false); setResetError(null); }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 space-y-1 font-medium">
                <p className="font-bold">⚠️ High-Risk Action Warning!</p>
                <p>This will permanently wipe all transactions, orders, inventory, products, and customer records from the database. This action cannot be undone.</p>
              </div>

              {resetError && (
                <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-600 font-semibold">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetData} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step 1: Re-enter Admin Password *
                  </Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter your current admin password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    className="h-10 text-xs rounded-lg border-border/50 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmString" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step 2: Type "DELETE ALL DATA" to confirm *
                  </Label>
                  <Input
                    id="confirmString"
                    type="text"
                    placeholder="DELETE ALL DATA"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    required
                    className="h-10 text-xs font-mono font-bold rounded-lg border-border/50 bg-background"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setIsResetOpen(false); setResetError(null); }}
                    className="rounded-lg h-10 px-4 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={resetLoading || resetConfirmText !== 'DELETE ALL DATA' || !resetPassword}
                    className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white h-10 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {resetLoading ? 'Wiping Data...' : 'I understand, wipe all data'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal for Creating New Broadcast Notification */}
        {isAddNotifOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Create Notification Broadcast</h3>
                    <p className="text-xs text-muted-foreground">Send real-time alerts or promotional push updates.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddNotifOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notification Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Flash Sale Live — 40% Off Couture!" 
                    value={notifForm.title}
                    onChange={e => setNotifForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="h-10 rounded-lg border-border/50 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notification Type</Label>
                  <select
                    id="type"
                    value={notifForm.type}
                    onChange={e => setNotifForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-border/50 bg-background px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="general">General Alert</option>
                    <option value="offer">Promotional Offer</option>
                    <option value="coupon">Coupon Voucher</option>
                    <option value="order">Order Update</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notification Body Message</Label>
                  <Textarea 
                    id="message" 
                    rows={3} 
                    placeholder="Enter message description..." 
                    value={notifForm.message}
                    onChange={e => setNotifForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="rounded-lg border-border/50 bg-background resize-none text-xs p-3 focus:border-primary"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="sendToAll" 
                      checked={sendToAll} 
                      onCheckedChange={(checked) => setSendToAll(Boolean(checked))} 
                    />
                    <Label htmlFor="sendToAll" className="text-xs font-medium cursor-pointer">
                      Broadcast to All Active Users
                    </Label>
                  </div>

                  {!sendToAll && (
                    <div className="space-y-1.5 pl-6">
                      <Label htmlFor="targetUsers" className="text-xs font-bold text-muted-foreground">Target User Emails (comma separated)</Label>
                      <Input 
                        id="targetUsers" 
                        placeholder="user1@example.com, user2@example.com" 
                        value={notifForm.targetUsers}
                        onChange={e => setNotifForm(prev => ({ ...prev, targetUsers: e.target.value }))}
                        className="h-9 rounded-lg border-border/50 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/20">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddNotifOpen(false)}
                    className="rounded-lg h-10 px-4 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="rounded-lg bg-primary hover:bg-primary/95 text-white h-10 px-5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Save Broadcast Draft
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
