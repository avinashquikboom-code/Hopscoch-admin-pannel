'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/lib/api';
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Coins,
  User,
  IndianRupee,
  Wallet,
  Sparkles,
  Clock,
  TrendingUp,
  Send,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function CashbackAdminPage() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
          },
        });
        const json = await res.json();
        const raw = json.data ?? json.users ?? (Array.isArray(json) ? json : []);
        if (Array.isArray(raw)) {
          setCustomers(raw);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const selectedCustomer = customers.find((c) => String(c.id) === String(userId));
  const selectedName = selectedCustomer
    ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || selectedCustomer.email
    : null;

  const handleIssueCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please select a customer and enter a valid cashback amount' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/loyalty/admin/wallet/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({
          userId: Number(userId),
          amount: Number(amount),
          type: 'ADMIN_CREDIT',
          description: description || 'Promotional Cashback Credit',
        }),
      });
      const json = await res.json();
      if (json.success) {
        const newEntry = {
          id: Date.now(),
          name: selectedName || `User #${userId}`,
          amount: Number(amount),
          description: description || 'Promotional Cashback Credit',
          time: new Date().toLocaleTimeString(),
        };
        setRecentActivity((prev) => [newEntry, ...prev.slice(0, 4)]);
        setMessage({
          type: 'success',
          text: `₹${Number(amount).toFixed(2)} cashback credited to ${selectedName || `User #${userId}`}'s digital wallet!`,
        });
        setUserId('');
        setAmount('');
        setDescription('');
      } else {
        const rawErr = json.message || 'Cashback credit failed';
        const cleanMsg = rawErr.includes('Invocation') || rawErr.includes('Prisma') || rawErr.includes('create()')
          ? 'Invalid parameters provided for cashback transaction. Please verify customer and amount inputs.'
          : rawErr;
        setMessage({ type: 'error', text: cleanMsg });
      }
    } catch (err: any) {
      const rawErr = err.message || 'Server error';
      const cleanMsg = rawErr.includes('Invocation') || rawErr.includes('Prisma') || rawErr.includes('create()')
        ? 'Database transaction error occurred. Please try again.'
        : rawErr;
      setMessage({ type: 'error', text: cleanMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 max-w-[1400px] mx-auto">
        <PageHeader
          titlePart1="Promotional Cashback"
          titlePart2="Subsystem"
          badgeText="INSTANT WALLET SETTLEMENT"
          subtitle="Issue promotional order cashback rewards directly credited into customer digital wallet balances."
          icon={<RefreshCw className="h-8 w-8 text-emerald-500" />}
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Issued Today',
              value: `₹${recentActivity.reduce((s, a) => s + a.amount, 0).toLocaleString('en-IN')}`,
              icon: <IndianRupee className="h-5 w-5" />,
              color: 'emerald',
              sub: `${recentActivity.length} transactions this session`,
            },
            {
              label: 'Registered Customers',
              value: customers.length.toLocaleString(),
              icon: <User className="h-5 w-5" />,
              color: 'blue',
              sub: 'Eligible for cashback',
            },
            {
              label: 'Avg Credit Amount',
              value: recentActivity.length
                ? `₹${(recentActivity.reduce((s, a) => s + a.amount, 0) / recentActivity.length).toFixed(0)}`
                : '₹0',
              icon: <TrendingUp className="h-5 w-5" />,
              color: 'purple',
              sub: 'Per transaction average',
            },
            {
              label: 'Wallet Settlement',
              value: 'Instant',
              icon: <Wallet className="h-5 w-5" />,
              color: 'amber',
              sub: 'Real-time wallet credit',
            },
          ].map((stat, i) => (
            <Card key={i} className={`border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl font-extrabold mt-1 text-${stat.color}-600 dark:text-${stat.color}-400 truncate`}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.sub}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 shrink-0 ml-3`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content — Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Issue Cashback Form (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Alert Message */}
            {message && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm border ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                }`}
              >
                {message.type === 'success'
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                  : <AlertCircle className="h-5 w-5 shrink-0" />}
                {message.text}
              </div>
            )}

            {/* Form Card */}
            <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              {/* Header with gradient */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-600/15 p-6 border-b border-border/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />
                <div className="relative flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground tracking-tight">Issue Promotional Cashback</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Credits money directly to the customer's digital wallet balance
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                <form id="cashback-form" onSubmit={handleIssueCashback} className="space-y-5">

                  {/* Customer Selection Section */}
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                      <User className="h-4 w-4 text-emerald-500" /> Recipient Customer
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Select Customer Account</Label>
                      <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border/80 bg-card/80 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer transition-colors"
                      >
                        <option value="">-- Select Customer Name --</option>
                        {customers.map((c: any) => {
                          const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || c.email || `User #${c.id}`;
                          return (
                            <option key={c.id} value={c.id}>
                              {name} (ID: #{c.id}{c.email ? ` — ${c.email}` : ''})
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-muted-foreground">Cashback will be credited to this customer's wallet</p>
                    </div>

                    {/* Customer Preview Pill */}
                    {selectedCustomer && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 font-extrabold text-xs shrink-0">
                          {(selectedCustomer.firstName?.[0] || selectedCustomer.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-foreground truncate">{selectedName}</p>
                          <p className="text-[10px] text-muted-foreground">{selectedCustomer.email} · ID #{selectedCustomer.id}</p>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 text-[10px] font-bold shrink-0">
                          Selected
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Cashback Amount & Description */}
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                      <IndianRupee className="h-4 w-4 text-amber-500" /> Cashback Details
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Cashback Amount (₹ INR)</Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-600">₹</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-8 bg-card/80 border-border/80 font-extrabold text-base h-12 rounded-xl focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Amount instantly credited to customer digital wallet</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Campaign Description / Reason</Label>
                      <Input
                        placeholder="e.g. Special festive cashback reward"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-card/80 border-border/80 font-semibold h-10 rounded-xl focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-muted-foreground">This reason appears in customer wallet statement</p>
                    </div>
                  </div>

                  {/* Preview Card if both selected */}
                  {selectedCustomer && amount && Number(amount) > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-bold text-foreground">Transaction Preview</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-bold">ADMIN CREDIT</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Recipient</p>
                          <p className="text-sm font-extrabold text-foreground">{selectedName}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-semibold">Wallet Credit</p>
                          <p className="text-xl font-extrabold text-emerald-600">₹{Number(amount).toFixed(2)}</p>
                        </div>
                      </div>
                      {description && (
                        <p className="mt-2 text-[11px] text-muted-foreground font-semibold border-t border-border/40 pt-2">
                          📝 {description}
                        </p>
                      )}
                    </div>
                  )}
                </form>
              </CardContent>

              {/* Sticky Submit Footer */}
              <div className="p-4 border-t border-border/40 bg-card/90 backdrop-blur-sm flex items-center justify-between gap-4">
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Funds are settled instantly to customer digital wallet
                </p>
                <Button
                  form="cashback-form"
                  type="submit"
                  disabled={loading || !userId || !amount || Number(amount) <= 0}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold h-11 px-7 rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Processing...' : 'Issue Cashback Credit'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Recent Activity Feed (1/3 width) */}
          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4 bg-gradient-to-r from-muted/30 to-transparent">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Session Activity
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Cashback transactions issued this session
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">No activity yet</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Issued cashbacks will appear here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {recentActivity.map((entry, i) => (
                      <div key={entry.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
                        <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-extrabold text-xs shrink-0">
                          {entry.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-foreground truncate">{entry.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{entry.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{entry.time}</p>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 font-extrabold text-[10px] shrink-0">
                          +₹{entry.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-border/60 shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-extrabold text-foreground">How Cashback Works</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: 'Select the recipient customer account' },
                    { step: '2', text: 'Enter cashback amount in Indian Rupees' },
                    { step: '3', text: 'Add optional campaign description' },
                    { step: '4', text: 'Funds settle instantly in digital wallet' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {item.step}
                      </span>
                      <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
