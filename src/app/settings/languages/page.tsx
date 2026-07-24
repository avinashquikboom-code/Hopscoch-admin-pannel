'use client';

import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';
import { getCurrencyForCountry } from '@/context/currency-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2,
  Globe,
  DollarSign,
  MapPin
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function LanguagesAndCurrencyPage() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Fetch languages, currencies, and countries from API
  useEffect(() => {
    fetchLanguages();
    fetchCurrencies();
    fetchCountries();
  }, []);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/languages`);
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
      const res = await fetch(`${API_BASE}/api/settings/currencies`);
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
      const res = await fetch(`${API_BASE}/api/settings/countries`);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings/languages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ languages: updatedLangs }),
      });
    } catch (e) {
      console.error('Failed to save languages:', e);
    }
  };

  const saveCurrencies = async (updatedCurrs: any[]) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings/currencies`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currencies: updatedCurrs }),
      });
    } catch (e) {
      console.error('Failed to save currencies:', e);
    }
  };

  const saveCountries = async (updatedCountries: any[]) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings/countries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ countries: updatedCountries }),
      });
    } catch (e) {
      console.error('Failed to save countries:', e);
    }
  };

  // Dialog & Form states for Language
  const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);
  const [langForm, setLangForm] = useState({ name: '', code: '', flag: '🌐', isDefault: false });

  // Dialog & Form states for Currency
  const [isCurrDialogOpen, setIsCurrDialogOpen] = useState(false);
  const [currForm, setCurrForm] = useState({ name: '', code: '', symbol: '₹', exchangeRate: 1.0, isDefault: false });

  // Dialog & Form states for Country
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [countryForm, setCountryForm] = useState({ name: '', code: '' });

  // Language Handlers
  const handleCreateLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langForm.name || !langForm.code) return;

    const newLang = {
      id: String(languages.length + 1),
      code: langForm.code.toLowerCase(),
      name: langForm.name,
      flag: langForm.flag,
      isDefault: langForm.isDefault,
      isEnabled: true,
    };

    let updatedLangs = [...languages];
    if (newLang.isDefault) {
      updatedLangs = updatedLangs.map((l) => ({ ...l, isDefault: false }));
    }
    const finalLangs = [...updatedLangs, newLang];
    setLanguages(finalLangs);
    saveLanguages(finalLangs);
    setLangForm({ name: '', code: '', flag: '🌐', isDefault: false });
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
  const handleCreateCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currForm.name || !currForm.code) return;

    const newCurr = {
      id: String(currencies.length + 1),
      code: currForm.code.toUpperCase(),
      symbol: currForm.symbol,
      name: currForm.name,
      exchangeRate: currForm.exchangeRate,
      isDefault: currForm.isDefault,
      isEnabled: true,
    };

    let updatedCurrs = [...currencies];
    if (newCurr.isDefault) {
      updatedCurrs = updatedCurrs.map((c) => ({ ...c, isDefault: false }));
    }
    const finalCurrs = [...updatedCurrs, newCurr];
    setCurrencies(finalCurrs);
    saveCurrencies(finalCurrs);
    setCurrForm({ name: '', code: '', symbol: '₹', exchangeRate: 1.0, isDefault: false });
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
  const handleCreateCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryForm.name || !countryForm.code) return;

    const newCountry = {
      code: countryForm.code.toUpperCase().trim(),
      name: countryForm.name.trim(),
    };

    const finalCountries = [...countries, newCountry];
    setCountries(finalCountries);
    saveCountries(finalCountries);
    setCountryForm({ name: '', code: '' });
    setIsCountryDialogOpen(false);
  };

  const handleDeleteCountry = (code: string) => {
    const finalCountries = countries.filter((c) => c.code !== code);
    setCountries(finalCountries);
    saveCountries(finalCountries);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          titlePart1="Settings"
          titlePart2="Languages, Currencies & Countries"
          badgeText="Store Configuration"
          subtitle="Manage multi-lingual store configurations, global country regions, currencies, and exchange rates."
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
                  <Button className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Country
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">Add New Country</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure a new country region for customer shipping and currency mapping.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleCreateCountry} className="flex flex-col flex-1 overflow-hidden">
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
                    </div>
                    <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setIsCountryDialogOpen(false)} className="rounded-lg">
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-lg bg-primary text-white hover:bg-primary/95">
                        Save Country
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
                        <TableHead>Country Name</TableHead>
                        <TableHead>ISO Code</TableHead>
                        <TableHead>Mapped Currency (via package)</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countries.map((c) => {
                        const mappedCurrency = getCurrencyForCountry(c.code);
                        return (
                          <TableRow key={c.code} className="hover:bg-muted/10">
                            <TableCell className="font-semibold text-sm text-foreground">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-sm font-mono font-bold text-primary">{c.code}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="font-bold text-xs bg-muted/20">
                                {mappedCurrency}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCountry(c.code)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
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
                  <Button className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Currency
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">Add Currency</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure a new currency option and standard exchange rates.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleCreateCurrency} className="flex flex-col flex-1 overflow-hidden">
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
                        Save Currency
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
                          <TableCell className="text-right text-sm font-semibold">{c.exchangeRate.toFixed(4)}</TableCell>
                          <TableCell className="text-center">
                            {c.isDefault ? (
                              <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border-transparent rounded-full px-2.5 py-0.5">
                                Default
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 font-light">-</span>
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
                                <div className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center cursor-pointer">
                                  <MoreVertical className="h-4 w-4" />
                                </div>
                              } />
                              <DropdownMenuContent align="end" className="w-36 p-1 rounded-md bg-card border border-border/60 shadow-lg">
                                <DropdownMenuItem className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
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
                  <Button className="rounded-md flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10">
                    <Plus className="h-4 w-4" /> Add Language
                  </Button>
                } />
                <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
                  <SheetHeader className="p-6 border-b border-border/20">
                    <SheetTitle className="text-xl font-bold">Add Language</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      Configure a new language locale option for users.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleCreateLanguage} className="flex flex-col flex-1 overflow-hidden">
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
                        Save Language
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
                              <span className="text-xs text-muted-foreground/60 font-light">-</span>
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
                                <div className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center cursor-pointer">
                                  <MoreVertical className="h-4 w-4" />
                                </div>
                              } />
                              <DropdownMenuContent align="end" className="w-36 p-1 rounded-md bg-card border border-border/60 shadow-lg">
                                <DropdownMenuItem className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-xs font-semibold flex items-center gap-2">
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
