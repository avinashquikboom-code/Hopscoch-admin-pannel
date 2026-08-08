'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (email) {
        setSuccess(true);
      } else {
        setError('Please enter your email address.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4
                    bg-slate-50 dark:bg-black selection:bg-[#14b8a6] selection:text-black">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-full bg-[#14b8a6]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-slate-500 dark:text-zinc-400 hover:text-[#14b8a6] dark:hover:text-[#14b8a6] mb-6 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <Card className="rounded-lg border-slate-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-sm font-light text-slate-500 dark:text-zinc-400">
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>

          <AnimatePresence mode="wait">
            {success ? (
              <CardContent className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-[#14b8a6]/10 flex items-center justify-center mb-4 border border-[#14b8a6]/20">
                    <CheckCircle2 className="w-8 h-8 text-[#14b8a6]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-light">
                    We've sent a reset link to{' '}
                    <strong className="text-slate-800 dark:text-white font-semibold">{email}</strong>
                  </p>
                </motion.div>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 pb-4">
                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-md
                                   bg-red-50 dark:bg-red-950/30
                                   border border-red-200 dark:border-red-900/50
                                   text-red-600 dark:text-red-300 text-sm"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 dark:text-zinc-400"
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-6 flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-md
                               bg-gradient-to-r from-[#14b8a6] via-[#2dd4bf] to-[#14b8a6]
                               hover:opacity-90 text-black font-bold tracking-wider
                               transition-all border border-[#14b8a6]/20 cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}
          </AnimatePresence>

          {/* Back to login on success */}
          {success && (
            <CardFooter className="pt-0 pb-6">
              <Link href="/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full rounded-md h-11
                             border-slate-200 dark:border-zinc-800
                             text-slate-600 dark:text-zinc-400
                             hover:bg-slate-50 dark:hover:bg-zinc-800/50
                             transition-all"
                >
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-zinc-600 mt-5 font-light">
          Protected by FCISeller Enterprise Secure Shield • v2.4.0
        </p>
      </motion.div>
    </div>
  );
}
