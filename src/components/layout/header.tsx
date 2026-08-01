'use client';

import { API_BASE, getImageUrl } from '@/lib/api';
import { Search, Bell, User, Settings, LogOut, Menu, Sun, Moon, Globe, DollarSign, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useCurrency, getCurrencyForCountry, getLanguageForCountry } from '@/context/currency-context';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { currencyCode, currencySymbol, setCurrencyCode } = useCurrency();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatarUrl?: string } | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Region / localization state
  const [currentCountry, setCurrentCountry] = useState('IN');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [currenciesList, setCurrenciesList] = useState<any[]>([]);
  const [languagesList, setLanguagesList] = useState<any[]>([]);
  const [isUpdatingRegion, setIsUpdatingRegion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let prevIds = new Set<string>();

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/notifications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (json.success && Array.isArray(json.data) && isMounted) {
          const items = json.data;
          setNotifications(items);
          const unread = items.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);

          // Check if new notification arrived
          items.forEach((item: any) => {
            const idStr = String(item.id);
            if (prevIds.size > 0 && !prevIds.has(idStr)) {
              toast.success(`🛍️ ${item.title}: ${item.body}`);
            }
            prevIds.add(idStr);
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch store region coordinates on mount
  useEffect(() => {
    const fetchRegionData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const resSettings = await fetch(`${API_BASE}/api/settings`, { headers });
        if (resSettings.ok) {
          const json = await resSettings.json();
          const s = json?.data || json;
          if (s.country) setCurrentCountry(s.country);
          if (s.language) setCurrentLanguage(s.language);
          const hasLocalCurrency = typeof window !== 'undefined' && localStorage.getItem('admin_currency');
          if (s.currency && !hasLocalCurrency) setCurrencyCode(s.currency);
        }

        const resCountries = await fetch(`${API_BASE}/api/settings/countries`, { headers });
        if (resCountries.ok) {
          const cJson = await resCountries.json();
          if (cJson?.data) setCountriesList(cJson.data);
        }

        const resCurrencies = await fetch(`${API_BASE}/api/settings/currencies`, { headers });
        if (resCurrencies.ok) {
          const curJson = await resCurrencies.json();
          if (curJson?.data) setCurrenciesList(curJson.data);
        }

        const resLangs = await fetch(`${API_BASE}/api/settings/languages`, { headers });
        if (resLangs.ok) {
          const lJson = await resLangs.json();
          if (lJson?.data) setLanguagesList(lJson.data);
        }
      } catch (e) {
        console.error('Failed to load header region settings:', e);
      }
    };

    fetchRegionData();
  }, [setCurrencyCode]);

  const handleQuickCountryChange = async (countryCode: string) => {
    setIsUpdatingRegion(true);
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

    setCurrentCountry(countryCode);
    setCurrentLanguage(autoLanguage);
    setCurrencyCode(autoCurrency);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          country: countryCode,
          currency: autoCurrency,
          language: autoLanguage,
        }),
      });
      toast.success(`Region updated to ${countryCode}. Currency: ${autoCurrency}, Language: ${autoLanguage.toUpperCase()}`);
    } catch {
      toast.error('Failed to persist region settings');
    } finally {
      setIsUpdatingRegion(false);
    }
  };

  const handleQuickCurrencyChange = async (newCurrency: string) => {
    setCurrencyCode(newCurrency);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currency: newCurrency }),
      });
      toast.success(`Active currency updated to ${newCurrency}`);
    } catch {}
  };

  const handleQuickLanguageChange = async (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ language: newLanguage }),
      });
      toast.success(`System language updated to ${newLanguage.toUpperCase()}`);
    } catch {}
  };

  const getInitials = () => {
    if (!user) return 'AD';
    const f = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const l = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'AD';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/20 bg-background/60 backdrop-blur-lg px-6 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-muted/60"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        {/* Global Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#14b8a6] transition-colors" />
            <Input
              type="search"
              placeholder="Search products, orders, customers..."
              className="pl-11 bg-muted/30 border-border/30 hover:border-border/55 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/30 h-10 rounded-md transition-all"
            />
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Region, Currency & Language Action Button */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <div suppressHydrationWarning className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-[#14b8a6]/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-xs">
              <Globe className="h-3.5 w-3.5 text-[#14b8a6]" />
              <span suppressHydrationWarning className="font-mono font-bold text-primary">{currentCountry}</span>
              <span className="text-muted-foreground/40">•</span>
              <span suppressHydrationWarning>{currencySymbol} {currencyCode}</span>
              <span className="text-muted-foreground/40">•</span>
              <span suppressHydrationWarning className="uppercase text-[10px] font-bold bg-[#14b8a6]/10 text-[#14b8a6] px-1.5 py-0.5 rounded">
                {currentLanguage}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
            </div>
          } />
          <DropdownMenuContent align="end" className="w-72 p-3.5 rounded-xl bg-card/95 border border-border/40 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-[#14b8a6]" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Quick Localization</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20 font-mono font-bold">
                Active
              </Badge>
            </div>
            <DropdownMenuSeparator className="bg-border/20" />

            {/* Country Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> Store Country Region
              </label>
              <select
                value={currentCountry}
                disabled={isUpdatingRegion}
                onChange={(e) => handleQuickCountryChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-bold text-primary outline-none focus:border-[#14b8a6] cursor-pointer"
              >
                {countriesList.length > 0 ? (
                  countriesList.map((c: any) => (
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
                  </>
                )}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-500" /> Active Currency
              </label>
              <select
                value={currencyCode}
                onChange={(e) => handleQuickCurrencyChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-semibold outline-none focus:border-[#14b8a6] cursor-pointer"
              >
                {currenciesList.length > 0 ? (
                  currenciesList.map((c: any) => (
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

            {/* Language Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Globe className="h-3 w-3 text-blue-500" /> System Language
              </label>
              <select
                value={currentLanguage}
                onChange={(e) => handleQuickLanguageChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-semibold outline-none focus:border-[#14b8a6] cursor-pointer"
              >
                {languagesList.length > 0 ? (
                  languagesList.map((l: any) => (
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          aria-label="Toggle theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-500 fill-amber-400" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <div className="relative rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer border-none bg-transparent">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#14b8a6] text-black text-[10px] font-black leading-none px-1 border-2 border-background">
                  {unreadCount}
                </span>
              )}
            </div>
          } />
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-lg bg-card/95 border border-border/30 backdrop-blur-lg">
            <DropdownMenuLabel className="font-bold text-sm text-foreground px-2 py-1.5 flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="text-[10px] bg-[#14b8a6]/20 text-[#14b8a6] px-1.5 py-0.5 rounded font-bold">{unreadCount} New</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-border/20" />
            <div className="max-h-80 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No recent notifications</div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => {
                      if (n.data?.orderId) router.push(`/orders/${n.data.orderId}`);
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className={`inline-flex h-2 w-2 rounded-full ${n.isRead ? 'bg-muted-foreground/30' : 'bg-[#14b8a6]'} flex-shrink-0`} />
                      <span className="font-semibold text-sm text-foreground">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4 line-clamp-2">{n.body || n.message}</p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="my-1 border-border/20" />
            <DropdownMenuItem 
              onClick={() => router.push('/notifications')}
              className="text-center text-xs font-semibold text-[#14b8a6] hover:text-[#2dd4bf] cursor-pointer py-2 justify-center rounded-md"
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <div className="relative h-10 w-10 rounded-full hover:bg-muted/65 p-0 border border-[#14b8a6]/30 cursor-pointer bg-transparent flex items-center justify-center">
              <Avatar className="h-9 w-9 rounded-full">
                {user?.avatarUrl && <AvatarImage src={getImageUrl(user.avatarUrl)} alt="Admin" />}
                <AvatarFallback className="bg-gradient-to-tr from-[#14b8a6] via-[#2dd4bf] to-[#0f766e] text-black font-bold text-xs rounded-full">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          } />
          <DropdownMenuContent align="end" className="w-60 p-2 rounded-lg bg-card/95 border border-border/30 backdrop-blur-lg">
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full border border-[#14b8a6]/20 flex-shrink-0">
                  {user?.avatarUrl && <AvatarImage src={getImageUrl(user.avatarUrl)} alt="Admin" />}
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-black text-xs font-black">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {user ? `${user.firstName} ${user.lastName}`.trim() || 'Admin User' : 'Admin User'}
                  </p>
                  <p className="text-xs text-muted-foreground font-light truncate">
                    {user?.email || 'admin@fciseller.com'}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-border/20" />
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="p-2.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm font-medium"
            >
              <User className="mr-2.5 h-4 w-4 text-[#14b8a6]" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="p-2.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm font-medium"
            >
              <Settings className="mr-2.5 h-4 w-4 text-[#14b8a6]" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 border-border/20" />
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="p-2.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer text-sm font-medium"
            >
              <LogOut className="mr-2.5 h-4 w-4 text-rose-500" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
