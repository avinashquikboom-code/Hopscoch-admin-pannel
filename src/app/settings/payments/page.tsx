'use client';
import { API_BASE } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Truck, ShieldCheck, Check, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

interface GatewayToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CustomSwitch({ checked, onChange }: GatewayToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 cursor-pointer ${
        checked ? 'bg-[#14b8a6]' : 'bg-zinc-300 dark:bg-zinc-800'
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform shadow-md ${
          checked ? 'translate-x-6' : 'translate-x-1.5'
        }`}
      />
    </button>
  );
}


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function SettingsPaymentsPage() {
  const [gateways, setGateways] = useState({
    stripe: { enabled: true, publishableKey: 'pk_live_51M3...', secretKey: 'sk_live_51M3...' },
    cod: { enabled: true, extraFee: 2.0 },
    applePay: { enabled: true, merchantId: 'merchant.com.fciseller' },
  });

  const [isSaved, setIsSaved] = useState(false);

  const fetchGateways = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/payments`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        setGateways(prev => ({ ...prev, ...json.data }));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchGateways(); }, [fetchGateways]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/settings/payments`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(gateways),
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 max-w-4xl">
        <PageHeader
          titlePart1="Settings"
          titlePart2="Payment Gateways"
          badgeText="Store Configuration"
          subtitle="Manage checkout payment processing systems and API credentials."

          actions={
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-[#14b8a6] bg-teal-500/10 border border-teal-500/15 px-3.5 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              PCI-DSS Compliant Connection
            </div>
          }
        />

        <AnimatePresence>
          {isSaved && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="p-4 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-[#14b8a6] text-sm flex items-center gap-2 font-medium"
            >
              <Check className="h-4.5 w-4.5" />
              Payment gateway settings and API keys updated successfully.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stripe Card */}
          <Card className="border-border/20 rounded-lg bg-card/40 backdrop-blur-md hover:border-[#14b8a6]/20 transition-all duration-300 luxury-glow">
            <CardHeader className="border-b border-border/20 pb-4.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold flex items-center">
                    Stripe Checkout
                    <Badge className={`ml-2.5 rounded-full font-bold border-transparent px-2.5 py-0.5 text-xxs ${
                      gateways.stripe.enabled 
                        ? 'bg-teal-500/10 text-teal-600 dark:text-[#14b8a6]' 
                        : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {gateways.stripe.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                </div>
              </div>
              <CustomSwitch
                checked={gateways.stripe.enabled}
                onChange={(checked) => setGateways({ ...gateways, stripe: { ...gateways.stripe, enabled: checked } })}
              />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripePub" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Publishable Key</Label>
                <Input
                  id="stripePub"
                  value={gateways.stripe.publishableKey}
                  onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, publishableKey: e.target.value } })}
                  placeholder="pk_live_..."
                  className="rounded-md border-border/40 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40 h-11 font-mono text-sm"
                  disabled={!gateways.stripe.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeSec" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secret Key</Label>
                <Input
                  id="stripeSec"
                  type="password"
                  value={gateways.stripe.secretKey}
                  onChange={(e) => setGateways({ ...gateways, stripe: { ...gateways.stripe, secretKey: e.target.value } })}
                  placeholder="sk_live_..."
                  className="rounded-md border-border/40 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40 h-11 font-mono text-sm"
                  disabled={!gateways.stripe.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Apple Pay Card */}
          <Card className="border-border/20 rounded-lg bg-card/40 backdrop-blur-md hover:border-[#14b8a6]/20 transition-all duration-300 luxury-glow">
            <CardHeader className="border-b border-border/20 pb-4.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold flex items-center">
                    Apple Pay
                    <Badge className={`ml-2.5 rounded-full font-bold border-transparent px-2.5 py-0.5 text-xxs ${
                      gateways.applePay.enabled 
                        ? 'bg-teal-500/10 text-teal-600 dark:text-[#14b8a6]' 
                        : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {gateways.applePay.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                </div>
              </div>
              <CustomSwitch
                checked={gateways.applePay.enabled}
                onChange={(checked) => setGateways({ ...gateways, applePay: { ...gateways.applePay, enabled: checked } })}
              />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchantId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Merchant Identifier</Label>
                <Input
                  id="merchantId"
                  value={gateways.applePay.merchantId}
                  onChange={(e) => setGateways({ ...gateways, applePay: { ...gateways.applePay, merchantId: e.target.value } })}
                  placeholder="merchant.com.yourdomain"
                  className="rounded-md border-border/40 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40 h-11"
                  disabled={!gateways.applePay.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* COD Card */}
          <Card className="border-border/20 rounded-lg bg-card/40 backdrop-blur-md hover:border-[#14b8a6]/20 transition-all duration-300 luxury-glow">
            <CardHeader className="border-b border-border/20 pb-4.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6]">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold flex items-center">
                    Cash on Delivery (COD)
                    <Badge className={`ml-2.5 rounded-full font-bold border-transparent px-2.5 py-0.5 text-xxs ${
                      gateways.cod.enabled 
                        ? 'bg-teal-500/10 text-teal-600 dark:text-[#14b8a6]' 
                        : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {gateways.cod.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                </div>
              </div>
              <CustomSwitch
                checked={gateways.cod.enabled}
                onChange={(checked) => setGateways({ ...gateways, cod: { ...gateways.cod, enabled: checked } })}
              />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codFee" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Additional COD Collection Charge ($)</Label>
                <Input
                  id="codFee"
                  type="number"
                  step="0.01"
                  value={gateways.cod.extraFee}
                  onChange={(e) => setGateways({ ...gateways, cod: { ...gateways.cod, extraFee: Number(e.target.value) } })}
                  className="rounded-md border-border/40 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40 h-11"
                  disabled={!gateways.cod.enabled}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              className="rounded-md teal-gradient-bg text-black font-bold hover:opacity-95 shadow-md shadow-[#14b8a6]/15 h-11 px-6 cursor-pointer flex items-center gap-2 border border-[#14b8a6]/20 transition-all active:scale-[0.99]"
            >
              <Save className="h-4.5 w-4.5" />
              Save Payment Gateways
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
