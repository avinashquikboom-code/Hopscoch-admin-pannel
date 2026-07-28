'use client';

import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '@/lib/api';
import { getCurrencyForCountry, getLanguageForCountry, useCurrency } from '@/context/currency-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2,
  Globe,
  DollarSign,
  MapPin,
  Star,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function LanguagesAndCurrencyPage() {
  const { setCurrencyCode } = useCurrency();
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Fetch languages, currencies, and countries from API
  useEffect(() => {
    fetchLanguages();
    fetchCurrencies();
    fetchCountries();
  }, []);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/languages`, { headers: getHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setLanguages(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch languages:', e);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/currencies`, { headers: getHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setCurrencies(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch currencies:', e);
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/countries`, { headers: getHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setCountries(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch countries:', e);
    }
  };

  const saveLanguages = async (updatedLangs: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/languages`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ languages: updatedLangs }),
      });
      if (res.ok) {
        toast.success('Languages configuration saved');
      } else {
        toast.error('Failed to save languages configuration');
      }
    } catch (e) {
      console.error('Failed to save languages:', e);
      toast.error('Network error saving languages');
    }
  };

  const saveCurrencies = async (updatedCurrs: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/currencies`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ currencies: updatedCurrs }),
      });

      if (res.ok) {
        toast.success('Currencies configuration saved');

        // Sync default currency with store settings if default currency changed
        const defaultCurr = updatedCurrs.find((c: any) => c.isDefault);
        if (defaultCurr) {
          setCurrencyCode(defaultCurr.code);
          await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ currency: defaultCurr.code }),
          }).catch(() => {});
        }
      } else {
        toast.error('Failed to save currencies configuration');
      }
    } catch (e) {
      console.error('Failed to save currencies:', e);
      toast.error('Network error saving currencies');
    }
  };

  const saveCountries = async (updatedCountries: any[]) => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/countries`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ countries: updatedCountries }),
      });
      if (res.ok) {
        toast.success('Countries configuration saved');
      } else {
        toast.error('Failed to save countries configuration');
      }
    } catch (e) {
      console.error('Failed to save countries:', e);
      toast.error('Network error saving countries');
    }
  };

  // Metadata dictionaries for auto-creation
  const CURRENCY_METADATA: Record<string, { symbol: string; name: string }> = {
    INR: { symbol: '₹', name: 'Indian Rupee' },
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    AED: { symbol: 'AED', name: 'UAE Dirham' },
    SAR: { symbol: 'SAR', name: 'Saudi Riyal' },
    BHD: { symbol: 'BD', name: 'Bahraini Dinar' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
    CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
  };

  const LANGUAGE_METADATA: Record<string, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇺🇸' },
    hi: { name: 'Hindi', flag: '🇮🇳' },
    es: { name: 'Spanish', flag: '🇪🇸' },
    fr: { name: 'French', flag: '🇫🇷' },
    de: { name: 'German', flag: '🇩🇪' },
    ar: { name: 'Arabic', flag: '🇸🇦' },
    ms: { name: 'Bahasa Melayu', flag: '🇲🇾' },
    nl: { name: 'Nederlands', flag: '🇳🇱' },
    it: { name: 'Italian', flag: '🇮🇹' },
    ja: { name: 'Japanese', flag: '🇯🇵' },
    zh: { name: 'Chinese', flag: '🇨🇳' },
  };

  // Explicit Set Default Handlers
  const handleSetDefaultCountry = async (code: string) => {
    let autoCurrency = getCurrencyForCountry(code);
    let autoLanguage = getLanguageForCountry(code);

    // Fetch API for precise info if available
    try {
      const res = await fetch(`${API_BASE}/api/settings/country-info/${code}`);
      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.currencyCode) autoCurrency = json.data.currencyCode;
        if (json.data.languageCode) autoLanguage = json.data.languageCode;
      }
    } catch {}

    const updatedCountries = countries.map((c) => ({
      ...c,
      isDefault: c.code === code,
    }));
    setCountries(updatedCountries);
    await saveCountries(updatedCountries);

    // 1. Update/Add Default Currency
    let foundCurr = false;
    let updatedCurrs = currencies.map((curr) => {
      if (curr.code === autoCurrency) {
        foundCurr = true;
        return { ...curr, isDefault: true, isEnabled: true };
      }
      return { ...curr, isDefault: false };
    });

    if (!foundCurr) {
      const meta = CURRENCY_METADATA[autoCurrency] || { symbol: '$', name: autoCurrency };
      const newCurr = {
        id: String(Date.now()),
        code: autoCurrency,
        symbol: meta.symbol,
        name: meta.name,
        exchangeRate: 1.0,
        isDefault: true,
        isEnabled: true,
      };
      updatedCurrs.push(newCurr);
    }
    setCurrencies(updatedCurrs);
    await saveCurrencies(updatedCurrs);

    // 2. Update/Add Default Language
    let foundLang = false;
    let updatedLangs = languages.map((l) => {
      if (l.code === autoLanguage) {
        foundLang = true;
        return { ...l, isDefault: true, isEnabled: true };
      }
      return { ...l, isDefault: false };
    });

    if (!foundLang) {
      const meta = LANGUAGE_METADATA[autoLanguage] || { name: autoLanguage.toUpperCase(), flag: '🌐' };
      const newLang = {
        id: String(Date.now()),
        code: autoLanguage,
        name: meta.name,
        flag: meta.flag,
        isDefault: true,
        isEnabled: true,
      };
      updatedLangs.push(newLang);
    }
    setLanguages(updatedLangs);
    await saveLanguages(updatedLangs);

    // 3. Persist to store settings
    await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        country: code,
        currency: autoCurrency,
        language: autoLanguage,
      }),
    }).catch(() => {});

    setCurrencyCode(autoCurrency);
    toast.success(`Default country updated to ${code}. Auto-set Currency to ${autoCurrency} and Language to ${autoLanguage.toUpperCase()}`);
  };

  const handleSetDefaultCurrency = async (id: string) => {
    let targetCode = '';
    const updatedCurrs = currencies.map((c) => {
      if (c.id === id) {
        targetCode = c.code;
        return { ...c, isDefault: true, isEnabled: true };
      }
      return { ...c, isDefault: false };
    });

    setCurrencies(updatedCurrs);
    await saveCurrencies(updatedCurrs);

    if (targetCode) {
      setCurrencyCode(targetCode);
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ currency: targetCode }),
      }).catch(() => {});
      toast.success(`${targetCode} is now the default store currency`);
    }
  };

  const handleSetDefaultLanguage = async (id: string) => {
    let targetCode = '';
    let targetName = '';
    const updatedLangs = languages.map((l) => {
      if (l.id === id) {
        targetCode = l.code;
        targetName = l.name;
        return { ...l, isDefault: true, isEnabled: true };
      }
      return { ...l, isDefault: false };
    });

    setLanguages(updatedLangs);
    await saveLanguages(updatedLangs);

    if (targetCode) {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ language: targetCode }),
      }).catch(() => {});
      toast.success(`${targetName} (${targetCode}) is now the default system language`);
    }
  };

  // Dialog & Form states for Language
  const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);
  const [editingLangId, setEditingLangId] = useState<string | null>(null);
  const [langForm, setLangForm] = useState({ name: '', code: '', flag: '🌐', isDefault: false });

  // Dialog & Form states for Currency
  const [isCurrDialogOpen, setIsCurrDialogOpen] = useState(false);
  const [editingCurrId, setEditingCurrId] = useState<string | null>(null);
  const [currForm, setCurrForm] = useState({ name: '', code: '', symbol: '₹', exchangeRate: 1.0, isDefault: false });

  // Dialog & Form states for Country
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [editingCountryCode, setEditingCountryCode] = useState<string | null>(null);
  const [countryForm, setCountryForm] = useState({ name: '', code: '', isDefault: false });

  // Open Handlers
  const openCreateLanguage = () => {
    setEditingLangId(null);
    setLangForm({ name: '', code: '', flag: '🌐', isDefault: false });
    setIsLangDialogOpen(true);
  };

  const openEditLanguage = (lang: any) => {
    setEditingLangId(lang.id);
    setLangForm({
      name: lang.name || '',
      code: lang.code || '',
      flag: lang.flag || '🌐',
      isDefault: !!lang.isDefault,
    });
    setIsLangDialogOpen(true);
  };

  const openCreateCurrency = () => {
    setEditingCurrId(null);
    setCurrForm({ name: '', code: '', symbol: '₹', exchangeRate: 1.0, isDefault: false });
    setIsCurrDialogOpen(true);
  };

  const openEditCurrency = (curr: any) => {
    setEditingCurrId(curr.id);
    setCurrForm({
      name: curr.name || '',
      code: curr.code || '',
      symbol: curr.symbol || '$',
      exchangeRate: curr.exchangeRate ?? 1.0,
      isDefault: !!curr.isDefault,
    });
    setIsCurrDialogOpen(true);
  };

  const openCreateCountry = () => {
    setEditingCountryCode(null);
    setCountryForm({ name: '', code: '', isDefault: false });
    setIsCountryDialogOpen(true);
  };

  const openEditCountry = (country: any) => {
    setEditingCountryCode(country.code);
    setCountryForm({
      name: country.name || '',
      code: country.code || '',
      isDefault: !!country.isDefault,
    });
    setIsCountryDialogOpen(true);
  };

  // Save/Submit Handlers
  const handleSaveLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langForm.name || !langForm.code) return;

    let updatedLangs = [...languages];

    if (editingLangId) {
      if (langForm.isDefault) {
        updatedLangs = updatedLangs.map((l) => ({ ...l, isDefault: false }));
      }
      updatedLangs = updatedLangs.map((l) =>
        l.id === editingLangId
          ? {
              ...l,
              name: langForm.name.trim(),
              code: langForm.code.toLowerCase().trim(),
              flag: langForm.flag.trim(),
              isDefault: langForm.isDefault,
            }
          : l
      );
    } else {
      const newLang = {
        id: String(Date.now()),
        code: langForm.code.toLowerCase().trim(),
        name: langForm.name.trim(),
        flag: langForm.flag.trim(),
        isDefault: langForm.isDefault,
        isEnabled: true,
      };
      if (newLang.isDefault) {
        updatedLangs = updatedLangs.map((l) => ({ ...l, isDefault: false }));
      }
      updatedLangs.push(newLang);
    }

    setLanguages(updatedLangs);
    saveLanguages(updatedLangs);
    setLangForm({ name: '', code: '', flag: '🌐', isDefault: false });
    setEditingLangId(null);
    setIsLangDialogOpen(false);
  };

  const handleToggleLanguageStatus = (id: string) => {
    const finalLangs = languages.map((l) => (l.id === id ? { ...l, isEnabled: !l.isEnabled } : l));
    setLanguages(finalLangs);
    saveLanguages(finalLangs);
  };

  const handleDeleteLanguage = (id: string) => {
    const finalLangs = languages.filter((l) => l.id !== id);
    setLanguages(finalLangs);
    saveLanguages(finalLangs);
  };

  // Currency Handlers
  const handleSaveCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currForm.name || !currForm.code) return;

    let updatedCurrs = [...currencies];

    if (editingCurrId) {
      if (currForm.isDefault) {
        updatedCurrs = updatedCurrs.map((c) => ({ ...c, isDefault: false }));
      }
      updatedCurrs = updatedCurrs.map((c) =>
        c.id === editingCurrId
          ? {
              ...c,
              name: currForm.name.trim(),
              code: currForm.code.toUpperCase().trim(),
              symbol: currForm.symbol.trim(),
              exchangeRate: Number(currForm.exchangeRate),
              isDefault: currForm.isDefault,
            }
          : c
      );
    } else {
      const newCurr = {
        id: String(Date.now()),
        code: currForm.code.toUpperCase().trim(),
        symbol: currForm.symbol.trim(),
        name: currForm.name.trim(),
        exchangeRate: Number(currForm.exchangeRate),
        isDefault: currForm.isDefault,
        isEnabled: true,
      };
      if (newCurr.isDefault) {
        updatedCurrs = updatedCurrs.map((c) => ({ ...c, isDefault: false }));
      }
      updatedCurrs.push(newCurr);
    }

    setCurrencies(updatedCurrs);
    saveCurrencies(updatedCurrs);
    setCurrForm({ name: '', code: '', symbol: '₹', exchangeRate: 1.0, isDefault: false });
    setEditingCurrId(null);
    setIsCurrDialogOpen(false);
  };

  const handleToggleCurrencyStatus = (id: string) => {
    const finalCurrs = currencies.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c));
    setCurrencies(finalCurrs);
    saveCurrencies(finalCurrs);
  };

  const handleDeleteCurrency = (id: string) => {
    const finalCurrs = currencies.filter((c) => c.id !== id);
    setCurrencies(finalCurrs);
    saveCurrencies(finalCurrs);
  };

  // Country Handlers
  const handleSaveCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryForm.name || !countryForm.code) return;

    let updatedCountries = [...countries];
    const code = countryForm.code.toUpperCase().trim();
    const name = countryForm.name.trim();

    if (countryForm.isDefault) {
      updatedCountries = updatedCountries.map((c) => ({ ...c, isDefault: false }));
    }

    if (editingCountryCode) {
      updatedCountries = updatedCountries.map((c) => (c.code === editingCountryCode ? { code, name, isDefault: countryForm.isDefault } : c));
    } else {
      if (updatedCountries.some((c) => c.code === code)) {
        toast.error(`Country with ISO code ${code} already exists`);
        return;
      }
      updatedCountries.push({ code, name, isDefault: countryForm.isDefault });
    }

    setCountries(updatedCountries);
    saveCountries(updatedCountries);

    if (countryForm.isDefault) {
      handleSetDefaultCountry(code);
    }

    setCountryForm({ name: '', code: '', isDefault: false });
    setEditingCountryCode(null);
    setIsCountryDialogOpen(false);
  };

  const handleDeleteCountry = (code: string) => {
    const finalCountries = countries.filter((c) => c.code !== code);
    setCountries(finalCountries);
    saveCountries(finalCountries);
  };

  const [countrySorting, setCountrySorting] = useState<SortingState>([]);

  const countryColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'name', header: 'Country Name' },
    { accessorKey: 'code', header: 'ISO Code' },
  ], []);

  const countryTable = useReactTable({
    data: countries,
    columns: countryColumns,
    state: { sorting: countrySorting },
    onSortingChange: setCountrySorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Settings"
          titlePart2="Languages, Currencies & Countries"
          badgeText="Store Configuration"
          subtitle="Manage multi-lingual store configurations, global country regions, default currencies, and exchange rates."
        />

        <Tabs defaultValue="countries" className="space-y-6">
          <TabsList className="bg-muted/30 p-1 rounded-md border border-border/40 w-fit">
            <TabsTrigger value="countries" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Countries ({countries.length})
            </TabsTrigger>
            <TabsTrigger value="currencies" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" /> Currencies ({currencies.length})
            </TabsTrigger>
            <TabsTrigger value="languages" className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" /> Languages ({languages.length})
            </TabsTrigger>
          </TabsList>

          {/* Countries Tab Content */}
          <TabsContent value="countries" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Supported Countries & Shipping Regions</h2>
              <Sheet open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
                <SheetTrigger render={
                  <Button onClick={openCreateCountry} className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Country
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">{editingCountryCode ? 'Edit Country' : 'Add New Country'}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure a country region for customer shipping and currency mapping.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleSaveCountry} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="countryName" className="text-sm font-semibold">Country Name</Label>
                        <Input
                          id="countryName"
                          required
                          value={countryForm.name}
                          onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                          placeholder="e.g. Italy"
                          className="h-11 rounded-lg border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="countryCode" className="text-sm font-semibold">2-Letter ISO Code</Label>
                        <Input
                          id="countryCode"
                          required
                          maxLength={2}
                          value={countryForm.code}
                          onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value })}
                          placeholder="e.g. IT"
                          className="h-11 rounded-lg border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40 uppercase"
                        />
                      </div>
                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          id="countryDefault"
                          type="checkbox"
                          checked={countryForm.isDefault}
                          onChange={(e) => setCountryForm({ ...countryForm, isDefault: e.target.checked })}
                          className="rounded border-border/60 accent-primary h-4 w-4"
                        />
                        <Label htmlFor="countryDefault" className="text-sm text-muted-foreground select-none cursor-pointer">
                          Set as default store country
                        </Label>
                      </div>
                    </div>
                    <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setIsCountryDialogOpen(false)} className="rounded-lg">
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-lg bg-primary text-white hover:bg-primary/95">
                        {editingCountryCode ? 'Update Country' : 'Save Country'}
                      </Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
            </div>

            <Card className="border-border/40 rounded-lg bg-card">
              <CardContent className="p-6">
                <div className="border border-border/40 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" onClick={() => countryTable.getColumn('name')?.toggleSorting(countryTable.getColumn('name')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs">
                            Country Name <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>ISO Code</TableHead>
                        <TableHead>Mapped Currency</TableHead>
                        <TableHead>Mapped Language</TableHead>
                        <TableHead className="text-center">Default</TableHead>
                        <TableHead className="w-28 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryTable.getRowModel().rows.length ? (
                        countryTable.getRowModel().rows.map((row) => {
                        const c = row.original;
                        const mappedCurrency = getCurrencyForCountry(c.code);
                        const mappedLanguage = getLanguageForCountry(c.code);
                        return (
                          <TableRow key={row.id} className="hover:bg-muted/10">
                            <TableCell className="font-semibold text-sm text-foreground">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-sm font-mono font-bold text-primary">{c.code}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                {mappedCurrency}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="font-bold text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                {mappedLanguage.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {c.isDefault ? (
                                <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border-transparent rounded-full px-2.5 py-0.5">
                                  Default
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSetDefaultCountry(c.code)}
                                  className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                                >
                                  Set Default
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <div className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center cursor-pointer ml-auto">
                                    <MoreVertical className="h-4 w-4" />
                                  </div>
                                } />
                                <DropdownMenuContent align="end" className="w-40 p-1 rounded-md bg-card border border-border/60 shadow-lg">
                                  {!c.isDefault && (
                                    <DropdownMenuItem onClick={() => handleSetDefaultCountry(c.code)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                      <Star className="h-3.5 w-3.5 text-amber-500" /> Set as Default
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openEditCountry(c)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                    <Edit className="h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCountry(c.code)}
                                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer text-xs font-semibold flex items-center gap-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No countries configured</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {countries.length > 0 && (
                    <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                      <span className="text-muted-foreground font-semibold">
                        {countryTable.getFilteredRowModel().rows.length} of {countries.length} countries
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => countryTable.previousPage()} disabled={!countryTable.getCanPreviousPage()}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="px-2 font-bold text-foreground text-[11px]">
                          {countryTable.getState().pagination.pageIndex + 1} / {countryTable.getPageCount() || 1}
                        </span>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => countryTable.nextPage()} disabled={!countryTable.getCanNextPage()}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currencies Tab Content */}
          <TabsContent value="currencies" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Supported Currencies</h2>
              <Sheet open={isCurrDialogOpen} onOpenChange={setIsCurrDialogOpen}>
                <SheetTrigger render={
                  <Button onClick={openCreateCurrency} className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Currency
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">{editingCurrId ? 'Edit Currency' : 'Add Currency'}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure currency options and exchange rates.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleSaveCurrency} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currCode" className="text-xs font-semibold">Currency Code (ISO)</Label>
                          <Input
                            id="currCode"
                            required
                            value={currForm.code}
                            onChange={(e) => setCurrForm({ ...currForm, code: e.target.value })}
                            placeholder="e.g. CAD"
                            className="rounded-md border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currSymbol" className="text-xs font-semibold">Symbol</Label>
                          <Input
                            id="currSymbol"
                            required
                            value={currForm.symbol}
                            onChange={(e) => setCurrForm({ ...currForm, symbol: e.target.value })}
                            placeholder="e.g. CA$"
                            className="rounded-md border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40 h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currName" className="text-xs font-semibold">Currency Name</Label>
                        <Input
                          id="currName"
                          required
                          value={currForm.name}
                          onChange={(e) => setCurrForm({ ...currForm, name: e.target.value })}
                          placeholder="e.g. Canadian Dollar"
                          className="rounded-md border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currRate" className="text-xs font-semibold">Exchange Rate (vs Base INR / USD)</Label>
                        <Input
                          id="currRate"
                          type="number"
                          step="0.0001"
                          required
                          value={currForm.exchangeRate}
                          onChange={(e) => setCurrForm({ ...currForm, exchangeRate: Number(e.target.value) })}
                          className="rounded-md border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40 h-10"
                        />
                      </div>
                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          id="currDefault"
                          type="checkbox"
                          checked={currForm.isDefault}
                          onChange={(e) => setCurrForm({ ...currForm, isDefault: e.target.checked })}
                          className="rounded border-border/60 accent-primary h-4 w-4"
                        />
                        <Label htmlFor="currDefault" className="text-sm text-muted-foreground select-none cursor-pointer">
                          Set as default currency
                        </Label>
                      </div>
                    </div>
                    <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setIsCurrDialogOpen(false)} className="rounded-lg">
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-lg bg-primary text-white hover:bg-primary/95">
                        {editingCurrId ? 'Update Currency' : 'Save Currency'}
                      </Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
            </div>

            <Card className="border-border/40 rounded-lg bg-card">
              <CardContent className="p-6">
                <div className="border border-border/40 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Currency Code</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Exchange Rate</TableHead>
                        <TableHead className="text-center">Default</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currencies.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/10">
                          <TableCell className="font-semibold text-sm text-foreground">{c.code}</TableCell>
                          <TableCell className="text-sm font-mono font-semibold text-muted-foreground">{c.symbol}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.name}</TableCell>
                          <TableCell className="text-right text-sm font-semibold">{(c.exchangeRate || 1.0).toFixed(4)}</TableCell>
                          <TableCell className="text-center">
                            {c.isDefault ? (
                              <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border-transparent rounded-full px-2.5 py-0.5">
                                Default
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultCurrency(c.id)}
                                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                              >
                                Set Default
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={c.isEnabled}
                              onCheckedChange={() => handleToggleCurrencyStatus(c.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <div className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center cursor-pointer ml-auto">
                                  <MoreVertical className="h-4 w-4" />
                                </div>
                              } />
                              <DropdownMenuContent align="end" className="w-40 p-1 rounded-md bg-card border border-border/60 shadow-lg">
                                {!c.isDefault && (
                                  <DropdownMenuItem onClick={() => handleSetDefaultCurrency(c.id)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                    <Star className="h-3.5 w-3.5 text-amber-500" /> Set as Default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEditCurrency(c)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCurrency(c.id)}
                                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer text-xs font-semibold flex items-center gap-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Languages Tab Content */}
          <TabsContent value="languages" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Supported Languages</h2>
              <Sheet open={isLangDialogOpen} onOpenChange={setIsLangDialogOpen}>
                <SheetTrigger render={
                  <Button onClick={openCreateLanguage} className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Language
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">{editingLangId ? 'Edit Language' : 'Add Language'}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure language locale options for users.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleSaveLanguage} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="langName" className="text-sm font-semibold">Language Name</Label>
                        <Input
                          id="langName"
                          required
                          value={langForm.name}
                          onChange={(e) => setLangForm({ ...langForm, name: e.target.value })}
                          placeholder="e.g. Italian"
                          className="h-11 rounded-lg border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="langCode" className="text-sm font-semibold">Language Code (ISO)</Label>
                        <Input
                          id="langCode"
                          required
                          value={langForm.code}
                          onChange={(e) => setLangForm({ ...langForm, code: e.target.value })}
                          placeholder="e.g. it"
                          className="h-11 rounded-lg border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="langFlag" className="text-sm font-semibold">Emoji Flag</Label>
                        <Input
                          id="langFlag"
                          value={langForm.flag}
                          onChange={(e) => setLangForm({ ...langForm, flag: e.target.value })}
                          placeholder="e.g. 🇮🇹"
                          className="h-11 rounded-lg border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/40">
                          <input
                            id="langDefault"
                            type="checkbox"
                            checked={langForm.isDefault}
                            onChange={(e) => setLangForm({ ...langForm, isDefault: e.target.checked })}
                            className="rounded border-border/60 accent-primary h-5 w-5"
                          />
                          <div className="flex-1">
                            <Label htmlFor="langDefault" className="text-sm font-semibold cursor-pointer">Set as default language</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">This will be the default language for new users</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setIsLangDialogOpen(false)} className="rounded-lg">
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-lg bg-primary text-white hover:bg-primary/95">
                        {editingLangId ? 'Update Language' : 'Save Language'}
                      </Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
            </div>

            <Card className="border-border/40 rounded-lg bg-card">
              <CardContent className="p-6">
                <div className="border border-border/40 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Language Name</TableHead>
                        <TableHead>ISO Code</TableHead>
                        <TableHead className="text-center">Default</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {languages.map((l) => (
                        <TableRow key={l.id} className="hover:bg-muted/10">
                          <TableCell className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <span className="text-lg">{l.flag}</span>
                            <span>{l.name}</span>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{l.code}</TableCell>
                          <TableCell className="text-center">
                            {l.isDefault ? (
                              <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border-transparent rounded-full px-2.5 py-0.5">
                                Default
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultLanguage(l.id)}
                                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                              >
                                Set Default
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={l.isEnabled}
                              onCheckedChange={() => handleToggleLanguageStatus(l.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <div className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center cursor-pointer ml-auto">
                                  <MoreVertical className="h-4 w-4" />
                                </div>
                              } />
                              <DropdownMenuContent align="end" className="w-40 p-1 rounded-md bg-card border border-border/60 shadow-lg">
                                {!l.isDefault && (
                                  <DropdownMenuItem onClick={() => handleSetDefaultLanguage(l.id)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                    <Star className="h-3.5 w-3.5 text-amber-500" /> Set as Default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEditLanguage(l)} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLanguage(l.id)}
                                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer text-xs font-semibold flex items-center gap-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
