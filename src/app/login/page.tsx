'use client';
import { API_BASE } from '@/lib/api';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Users,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = `${API_BASE}/api/auth/login`;

      const response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            deviceType: 'admin',
          }),
        }
      );

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to sign in. Please verify your credentials.');
      }

      if (resData.success && resData.data) {
        const { accessToken, user } = resData.data;
        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        throw new Error(resData.message || 'Login was not successful.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = [
    { icon: TrendingUp, label: 'Sales Growth', value: '+28.4%' },
    { icon: Users, label: 'Active Admins', value: '1.2k' },
    { icon: ShoppingBag, label: 'Daily Orders', value: '8.4k' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-12 overflow-hidden font-sans selection:bg-[#14b8a6] selection:text-black bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100">

      {/* ── Left panel: Brand Showcase (desktop only) ─────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        {/* Background hero image */}
        <div
          className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center transition-transform duration-[8000ms] ease-out hover:scale-105"
          style={{ transformOrigin: 'center' }}
        />
        {/* Gradient overlays — dark in dark mode, softer in light */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50 dark:from-black dark:via-black/40 dark:to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Teal glow accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#14b8a6]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#14b8a6]/5 blur-[90px] pointer-events-none" />

        {/* Brand Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white p-1">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xl font-black tracking-[0.2em] text-white">
            FCI SELLER
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-4"
          >
            <span className="inline-block px-3.5 py-1 text-[10px] font-bold tracking-[0.15em] text-[#14b8a6] uppercase bg-black/60 border border-[#14b8a6]/30 rounded-full">
              Enterprise Control Panel
            </span>
            <h2 className="text-5xl font-black tracking-tight leading-none text-white">
              Fashion management,{' '}
              <span className="bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] bg-clip-text text-transparent">
                reimagined.
              </span>
            </h2>
            <p className="text-base text-white/70 font-light leading-relaxed">
              Seamlessly orchestrate your catalogs, monitor global orders, and engage
              custom visual searches powered by enterprise-grade insights.
            </p>
          </motion.div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/10"
                >
                  <div className="p-2 w-fit rounded-lg bg-[#14b8a6]/20 text-[#14b8a6] mb-2.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    {m.label}
                  </div>
                  <div className="text-lg font-black text-white mt-0.5">{m.value}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-white/40 flex items-center justify-between">
          <span>© 2026 FCI SELLER. All rights reserved.</span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#14b8a6]" />
            V2.4.0 Secure Connection
          </span>
        </div>
      </div>

      {/* ── Right panel: Login Form ─────────────────────────────────────── */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 relative
                      bg-slate-50 dark:bg-[#040405]">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-full bg-[#14b8a6]/5 blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-tr from-[#14b8a6] to-[#2dd4bf]">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black tracking-[0.25em] text-slate-800 dark:text-zinc-100">
              FCI SELLER
            </h1>
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/60 rounded-lg p-8 backdrop-blur-sm">
            {/* Heading */}
            <div className="space-y-1.5 mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-light">
                Sign in to your admin console.
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2.5 mb-6 p-3.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-400 uppercase"
                >
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-[#14b8a6] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-11 h-11 rounded-md
                               bg-slate-50 dark:bg-zinc-950
                               border-slate-200 dark:border-zinc-800
                               text-slate-900 dark:text-zinc-100
                               placeholder:text-slate-400 dark:placeholder:text-zinc-600
                               focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40
                               transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-zinc-400 uppercase"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#14b8a6] hover:text-[#2dd4bf] transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-[#14b8a6] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-11 pr-11 h-11 rounded-md
                               bg-slate-50 dark:bg-zinc-950
                               border-slate-200 dark:border-zinc-800
                               text-slate-900 dark:text-zinc-100
                               placeholder:text-slate-400 dark:placeholder:text-zinc-600
                               focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/40
                               transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                  className="rounded border-slate-300 dark:border-zinc-700
                             data-[state=checked]:bg-[#14b8a6] data-[state=checked]:border-[#14b8a6]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-slate-500 dark:text-zinc-400 font-light select-none cursor-pointer"
                >
                  Keep me signed in
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 mt-2 rounded-md
                           bg-gradient-to-r from-[#14b8a6] via-[#2dd4bf] to-[#14b8a6]
                           hover:opacity-90 text-black font-bold tracking-wider
                           transition-all flex items-center justify-center gap-2
                           cursor-pointer border border-[#14b8a6]/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 dark:text-zinc-600 mt-5 font-light">
            Protected by FCISeller Enterprise Secure Shield • v2.4.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
