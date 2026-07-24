'use client';

import { API_BASE } from '@/lib/api';
import { useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function ResetDataPage() {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'DELETE ALL DATA' || !password) {
      toast.error('Please complete all confirmation steps correctly.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`${API_BASE}/api/v1/admin/settings/reset-data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ password, scope: 'all' }),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/api/admin/reset-data`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ password, scope: 'all' }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to reset store data');

      toast.success('All store data has been successfully reset.');
      setPassword('');
      setConfirmText('');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Reset operation failed');
      toast.error(err.message || 'Reset operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-4xl">
        <PageHeader
          titlePart1="Reset Store"
          titlePart2="Data"
          badgeText="Danger Zone"
          subtitle="Purge operational database records including products, orders, inventory, customers, and transactions."
        />

        <Card className="border-rose-500/30 bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Danger Zone — System Purge</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Irreversible operation. Permanently clears store database tables.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 px-3 py-1 font-bold text-xs">
                High Risk Action
              </Badge>
            </div>

            <Separator className="border-border/10" />

            <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 space-y-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <p className="font-bold text-sm text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> What will be deleted:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>All Products, Variants, Images, and Inventory movements</li>
                <li>All Orders, Invoices, Payment history, and Return requests</li>
                <li>All Customer Accounts (Admin user accounts remain preserved)</li>
                <li>All Carts, Wishlists, Reviews, Support Tickets, and Coupons</li>
                <li>All Analytics logs, Notifications, and Activity history</li>
              </ul>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetData} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="adminPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Step 1: Enter Current Admin Password *
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter your current admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 text-sm rounded-xl border-border/60 bg-background focus:border-rose-500 focus:ring-rose-500/20"
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
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                  className="h-11 text-sm font-mono font-bold rounded-xl border-border/60 bg-background focus:border-rose-500 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-border/10">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading || confirmText !== 'DELETE ALL DATA' || !password}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white h-11 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  {loading ? 'Wiping Data...' : 'Wipe All Store Data'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
