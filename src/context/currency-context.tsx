'use client';
import { API_BASE } from '@/lib/api';
import countryToCurrency from 'country-to-currency';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  AED: 'AED ',
  SAR: 'SAR ',
  BHD: 'BD ',
  MYR: 'RM ',
  MUR: '₨',
  FJD: 'FJ$',
  GYD: 'G$',
  SRD: 'Sr$',
  TTD: 'TT$',
};

const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CAD: 'en-CA',
  AUD: 'en-AU',
  SGD: 'en-SG',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  BHD: 'ar-BH',
  MYR: 'ms-MY',
  MUR: 'en-MU',
  FJD: 'en-FJ',
  GYD: 'en-GY',
  SRD: 'nl-SR',
  TTD: 'en-TT',
};

export function getCurrencyForCountry(countryIsoCode: string): string {
  if (!countryIsoCode) return 'INR';
  const cleanCode = countryIsoCode.trim().toUpperCase();
  const map = (countryToCurrency as any) || {};
  return map[cleanCode] || (cleanCode === 'IN' ? 'INR' : 'INR');
}

interface CurrencyContextValue {
  currencyCode: string;
  currencySymbol: string;
  fmt: (value: number) => string;
  setCurrencyCode: (code: string) => void;
  getCurrencyFromCountry: (countryCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currencyCode: 'INR',
  currencySymbol: '₹',
  fmt: (v) => `₹${(v || 0).toFixed(2)}`,
  setCurrencyCode: () => {},
  getCurrencyFromCountry: (c) => getCurrencyForCountry(c),
});

const LS_KEY = 'admin_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_KEY) || 'INR';
    }
    return 'INR';
  });

  // Fetch currency from settings API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/settings`, { headers });
        if (res.ok) {
          const json = await res.json();
          const code: string = json?.data?.currency || json?.currency;
          if (code) {
            setCurrencyCodeState(code);
            localStorage.setItem(LS_KEY, code);
          }
        }
      } catch {}
    };
    load();
  }, []);

  const setCurrencyCode = useCallback((code: string) => {
    setCurrencyCodeState(code);
    if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, code);
  }, []);

  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? (currencyCode === 'INR' ? '₹' : currencyCode + ' ');

  const fmt = useCallback(
    (value: number): string => {
      const locale = CURRENCY_LOCALES[currencyCode] ?? 'en-IN';
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode || 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value || 0);
      } catch {
        return `${currencySymbol}${(value || 0).toFixed(2)}`;
      }
    },
    [currencyCode, currencySymbol],
  );

  return (
    <CurrencyContext.Provider value={{ currencyCode, currencySymbol, fmt, setCurrencyCode, getCurrencyFromCountry: getCurrencyForCountry }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
