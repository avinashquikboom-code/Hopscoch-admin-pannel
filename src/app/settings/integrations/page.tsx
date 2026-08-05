'use client';
import { API_BASE } from '@/lib/api';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  Zap,
  Check,
  Eye,
  EyeOff,
  Copy,
  Database,
  Key,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  BrainCircuit,
  MapPin,
  Cloud,
  MessageSquare,
  Flame,
  Bell
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function IntegrationsSettingsPage() {
  const [razorpay, setRazorpay] = useState({ key_id: '', key_secret: '', webhook_secret: '', webhook_url: '' });
  const [google, setGoogle] = useState({ gemini_api_key: '', maps_api_key: '' });
  const [aws, setAws] = useState({ access_key_id: '', secret_access_key: '', region: 'ap-south-1', bucket_name: '' });
  const [msg91, setMsg91] = useState({ auth_key: '', sender_id: 'FCISEL', dlt_te_id: '', flow_id: '' });
  const [firebase, setFirebase] = useState({ api_key: '', project_id: '', messaging_sender_id: '', app_id: '', fcm_server_key: '' });

  // Show/Hide password states
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [showRzpWebhookSecret, setShowRzpWebhookSecret] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [showMsg91Auth, setShowMsg91Auth] = useState(false);
  const [showFirebaseKey, setShowFirebaseKey] = useState(false);
  const [showFcmServerKey, setShowFcmServerKey] = useState(false);

  // Test Connection States
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [razorpayTestResult, setRazorpayTestResult] = useState<'success' | 'fail' | null>(null);

  const [testingGoogle, setTestingGoogle] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<'success' | 'fail' | null>(null);

  const [testingAws, setTestingAws] = useState(false);
  const [awsTestResult, setAwsTestResult] = useState<'success' | 'fail' | null>(null);

  const [testingMsg91, setTestingMsg91] = useState(false);
  const [msg91TestResult, setMsg91TestResult] = useState<'success' | 'fail' | null>(null);

  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<'success' | 'fail' | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/settings/integrations`, { headers: authHeaders() });
      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.razorpay) setRazorpay((prev) => ({ ...prev, ...json.data.razorpay }));
        if (json.data.google) setGoogle(json.data.google);
        if (json.data.aws) setAws(json.data.aws);
        if (json.data.msg91) setMsg91(json.data.msg91);
        if (json.data.firebase) setFirebase(json.data.firebase);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (provider: 'razorpay' | 'google' | 'aws' | 'msg91' | 'firebase') => {
    try {
      const payload = {
        provider,
        settings: provider === 'razorpay' ? razorpay : provider === 'google' ? google : provider === 'aws' ? aws : provider === 'msg91' ? msg91 : firebase,
      };

      const res = await fetch(`${API_BASE}/api/v1/admin/settings/integrations`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const label = provider === 'razorpay' ? 'Razorpay' : provider === 'google' ? 'Google' : provider === 'aws' ? 'AWS S3' : provider === 'msg91' ? 'MSG91' : 'Firebase';
        toast.success(`${label} credentials saved successfully.`);
        loadSettings();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleDisconnect = async (provider: 'razorpay' | 'google' | 'aws' | 'msg91' | 'firebase', keyName?: string) => {
    const label = keyName === 'gemini_api_key' ? 'Google Gemini Vision' : keyName === 'maps_api_key' ? 'Google Places API' : provider === 'razorpay' ? 'Razorpay' : provider === 'aws' ? 'AWS S3 Bucket' : provider === 'msg91' ? 'MSG91 Gateway' : 'Firebase App';
    if (!confirm(`Are you sure you want to disconnect ${label}? This will clear its saved credentials.`)) {
      return;
    }
    try {
      const emptySettings = provider === 'razorpay'
        ? { key_id: '', key_secret: '', webhook_secret: '' }
        : provider === 'google'
        ? {
            gemini_api_key: keyName === 'gemini_api_key' ? '' : google.gemini_api_key,
            maps_api_key: keyName === 'maps_api_key' ? '' : google.maps_api_key
          }
        : provider === 'aws'
        ? { access_key_id: '', secret_access_key: '', region: '', bucket_name: '' }
        : provider === 'msg91'
        ? { auth_key: '', sender_id: '', dlt_te_id: '', flow_id: '' }
        : { api_key: '', project_id: '', messaging_sender_id: '', app_id: '', fcm_server_key: '' };

      const res = await fetch(`${API_BASE}/api/v1/admin/settings/integrations`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ provider, settings: emptySettings }),
      });

      if (res.ok) {
        toast.success(`${label} disconnected successfully.`);
        if (provider === 'razorpay') {
          setRazorpay({ key_id: '', key_secret: '', webhook_secret: '', webhook_url: '' });
          setRazorpayTestResult(null);
        } else if (provider === 'google') {
          if (keyName === 'gemini_api_key') {
            setGoogle(prev => ({ ...prev, gemini_api_key: '' }));
          } else if (keyName === 'maps_api_key') {
            setGoogle(prev => ({ ...prev, maps_api_key: '' }));
          } else {
            setGoogle({ gemini_api_key: '', maps_api_key: '' });
          }
          setGoogleTestResult(null);
        } else if (provider === 'aws') {
          setAws({ access_key_id: '', secret_access_key: '', region: 'ap-south-1', bucket_name: '' });
          setAwsTestResult(null);
        } else if (provider === 'msg91') {
          setMsg91({ auth_key: '', sender_id: 'HOPSCH', dlt_te_id: '', flow_id: '' });
          setMsg91TestResult(null);
        } else {
          setFirebase({ api_key: '', project_id: '', messaging_sender_id: '', app_id: '', fcm_server_key: '' });
          setFirebaseTestResult(null);
        }
      } else {
        toast.error(`Failed to disconnect ${label}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to disconnect ${label}.`);
    }
  };

  const testConnection = async (provider: 'razorpay' | 'google' | 'aws' | 'msg91' | 'firebase') => {
    if (provider === 'razorpay') {
      setTestingRazorpay(true);
      setRazorpayTestResult(null);
    } else if (provider === 'google') {
      setTestingGoogle(true);
      setGoogleTestResult(null);
    } else if (provider === 'aws') {
      setTestingAws(true);
      setAwsTestResult(null);
    } else if (provider === 'msg91') {
      setTestingMsg91(true);
      setMsg91TestResult(null);
    } else {
      setTestingFirebase(true);
      setFirebaseTestResult(null);
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/settings/integrations/test`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          provider,
          settings: provider === 'razorpay' ? razorpay : provider === 'google' ? google : provider === 'aws' ? aws : provider === 'msg91' ? msg91 : firebase,
        }),
      });

      if (res.ok) {
        if (provider === 'razorpay') setRazorpayTestResult('success');
        else if (provider === 'google') setGoogleTestResult('success');
        else if (provider === 'aws') setAwsTestResult('success');
        else if (provider === 'msg91') setMsg91TestResult('success');
        else setFirebaseTestResult('success');
      } else {
        if (provider === 'razorpay') setRazorpayTestResult('fail');
        else if (provider === 'google') setGoogleTestResult('fail');
        else if (provider === 'aws') setAwsTestResult('fail');
        else if (provider === 'msg91') setMsg91TestResult('fail');
        else setFirebaseTestResult('fail');
      }
    } catch (err) {
      if (provider === 'razorpay') setRazorpayTestResult('fail');
      else if (provider === 'google') setGoogleTestResult('fail');
      else if (provider === 'aws') setAwsTestResult('fail');
      else if (provider === 'msg91') setMsg91TestResult('fail');
      else setFirebaseTestResult('fail');
    } finally {
      if (provider === 'razorpay') setTestingRazorpay(false);
      else if (provider === 'google') setTestingGoogle(false);
      else if (provider === 'aws') setTestingAws(false);
      else if (provider === 'msg91') setTestingMsg91(false);
      else setTestingFirebase(false);
    }
  };

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied ${label} to clipboard.`);
  };

  const isRzpConfigured = Boolean(razorpay.key_id && razorpay.key_secret);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 max-w-6xl">
        <PageHeader
          titlePart1="Third-party"
          titlePart2="Integrations"
          badgeText="API Connections"
          subtitle="Manage credentials, API configurations and webhooks for Razorpay payments, MSG91 SMS, Firebase Push Notifications, Gemini Vision, and AWS S3."
          actions={
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/15 px-3.5 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Encrypted Storage
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Razorpay Integration Card */}
          <Card className="border-border/40 rounded-lg bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <CardContent className="p-6 space-y-5 flex-1">

              {/* Header block */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                    <Zap className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Razorpay</h3>
                  </div>
                </div>
                <StatusBadge configured={isRzpConfigured} />
              </div>

              {/* Setup Box */}
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 space-y-2 text-xs text-blue-700 dark:text-blue-300/90">
                <p className="font-bold text-blue-800 dark:text-blue-300">Setup steps</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Log in at <strong>dashboard.razorpay.com</strong></li>
                  <li>Go to <strong>Settings → API Keys</strong> and copy your Key ID & Key Secret</li>
                  <li>Go to <strong>Settings → Webhooks</strong> → Click <strong>Add New Webhook</strong></li>
                  <li>Enter Webhook URL: <code className="bg-blue-500/10 px-1 py-0.5 rounded font-mono text-[11px]">/api/webhooks/razorpay</code></li>
                  <li>Subscribe to events: <code className="text-[11px]">payment.captured</code>, <code className="text-[11px]">payment.failed</code>, <code className="text-[11px]">refund.processed</code></li>
                  <li>Copy your Webhook Secret and paste it below along with Key ID & Secret</li>
                </ol>
              </div>

              {/* Active display (if configured) */}
              {isRzpConfigured && (
                <ActiveKeyRow value={razorpay.key_id} onCopy={() => copyToClipboard(razorpay.key_id, 'Key ID')} />
              )}

              {/* Inputs block */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="rzpKeyId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Razorpay Key ID</Label>
                  <Input
                    id="rzpKeyId"
                    value={razorpay.key_id}
                    onChange={(e) => setRazorpay({ ...razorpay, key_id: e.target.value })}
                    placeholder="rzp_live_xxxxxxxxxxxxxx"
                    className="rounded-lg border-border/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 h-11 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Test key: rzp_test_... · Live key: rzp_live_...</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rzpKeySecret" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Razorpay Key Secret</Label>
                  <PasswordInput
                    id="rzpKeySecret"
                    value={razorpay.key_secret}
                    onChange={(v) => setRazorpay({ ...razorpay, key_secret: v })}
                    placeholder="Enter Key Secret"
                    visible={showRzpSecret}
                    onToggleVisible={() => setShowRzpSecret(!showRzpSecret)}
                    focusColor="blue"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rzpWebhookSecret" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Razorpay Webhook Secret</Label>
                  <PasswordInput
                    id="rzpWebhookSecret"
                    value={razorpay.webhook_secret}
                    onChange={(v) => setRazorpay({ ...razorpay, webhook_secret: v })}
                    placeholder="Enter Webhook Secret (e.g. rzp_wh_secret_...)"
                    visible={showRzpWebhookSecret}
                    onToggleVisible={() => setShowRzpWebhookSecret(!showRzpWebhookSecret)}
                    focusColor="blue"
                  />
                  <p className="text-[10px] text-muted-foreground">Webhook Secret used to verify signature from Razorpay Dashboard</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rzpWebhookUrl" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Razorpay Webhook URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rzpWebhookUrl"
                      value={razorpay.webhook_url || (typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/razorpay` : '')}
                      onChange={(e) => setRazorpay({ ...razorpay, webhook_url: e.target.value })}
                      placeholder="https://yourdomain.com/api/webhooks/razorpay"
                      className="rounded-lg border-border/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 h-11 text-sm font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyToClipboard(razorpay.webhook_url || `${window.location.origin}/api/webhooks/razorpay`, 'Webhook URL')}
                      className="rounded-lg border-border/60 h-11 px-4 text-xs font-semibold shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy URL
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Add this exact Webhook Endpoint URL in Razorpay Dashboard → Settings → Webhooks</p>
                </div>
              </div>

              <TestResultBanner result={razorpayTestResult} failMessage="Connection check failed. Verify Key ID and Secret." />
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-muted/20 flex items-center gap-3">
              <Button
                onClick={() => handleSave('razorpay')}
                className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs"
              >
                <Key className="h-4 w-4" />
                {isRzpConfigured ? 'Update Key' : 'Save Key'}
              </Button>

              <Button
                type="button"
                onClick={() => testConnection('razorpay')}
                disabled={testingRazorpay}
                variant="outline"
                className="rounded-lg border-border/60 h-11 px-4 flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`h-4 w-4 ${testingRazorpay ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              {isRzpConfigured && (
                <Button
                  onClick={() => handleDisconnect('razorpay')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* Google Gemini Vision Card */}
          <Card className="border-border/40 rounded-lg bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <CardContent className="p-6 space-y-5 flex-1">

              {/* Header block */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 dark:text-violet-400">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Google Gemini Vision</h3>
                  </div>
                </div>
                <StatusBadge configured={Boolean(google.gemini_api_key)} />
              </div>

              {/* Setup Box */}
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-4 space-y-1.5 text-xs text-violet-700 dark:text-violet-300/90">
                <p className="font-bold text-violet-800 dark:text-violet-300">Setup steps</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Log in at aistudio.google.com</li>
                  <li>Select Get API Key → Create API Key</li>
                  <li>Paste the key below and save</li>
                </ol>
              </div>

              {/* Active display (if configured) */}
              {google.gemini_api_key && (
                <ActiveKeyRow value={google.gemini_api_key} onCopy={() => copyToClipboard(google.gemini_api_key, 'Gemini API Key')} />
              )}

              {/* Inputs block */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="geminiApiKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gemini API Key</Label>
                  <PasswordInput
                    id="geminiApiKey"
                    value={google.gemini_api_key}
                    onChange={(v) => setGoogle({ ...google, gemini_api_key: v })}
                    placeholder="AQ.Ab8RN6K37x..."
                    visible={showGemini}
                    onToggleVisible={() => setShowGemini(!showGemini)}
                    focusColor="violet"
                  />
                </div>
              </div>

              <TestResultBanner result={googleTestResult} failMessage="Connection check failed. Verify API credentials." />
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-muted/20 flex items-center gap-3">
              <Button
                onClick={() => handleSave('google')}
                className="rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs"
              >
                <Key className="h-4 w-4" />
                {google.gemini_api_key ? 'Update Key' : 'Save Key'}
              </Button>

              <Button
                type="button"
                onClick={() => testConnection('google')}
                disabled={testingGoogle}
                variant="outline"
                className="rounded-lg border-border/60 h-11 px-4 flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`h-4 w-4 ${testingGoogle ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              {google.gemini_api_key && (
                <Button
                  onClick={() => handleDisconnect('google', 'gemini_api_key')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* Google Places API Card */}
          <Card className="border-border/40 rounded-lg bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <CardContent className="p-6 space-y-5 flex-1">

              {/* Header block */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Google Places API</h3>
                  </div>
                </div>
                <StatusBadge configured={Boolean(google.maps_api_key)} />
              </div>

              {/* Setup Box */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-4 space-y-1.5 text-xs text-emerald-700 dark:text-emerald-300/90">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Setup steps</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open console.cloud.google.com</li>
                  <li>Go to APIs → Credentials → Create API Key</li>
                  <li>Enable Places API (New) and copy the key</li>
                </ol>
              </div>

              {/* Active display (if configured) */}
              {google.maps_api_key && (
                <ActiveKeyRow value={google.maps_api_key} onCopy={() => copyToClipboard(google.maps_api_key, 'Google Places API Key')} />
              )}

              {/* Inputs block */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="googleMapsApiKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Places API Key</Label>
                  <PasswordInput
                    id="googleMapsApiKey"
                    value={google.maps_api_key}
                    onChange={(v) => setGoogle({ ...google, maps_api_key: v })}
                    placeholder="AIzaSyBzIu9g5..."
                    visible={showMaps}
                    onToggleVisible={() => setShowMaps(!showMaps)}
                    focusColor="emerald"
                  />
                  <p className="text-[10px] text-muted-foreground">Generated from Google Cloud Console. Billing must be enabled.</p>
                </div>
              </div>
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-muted/20 flex items-center gap-3">
              <Button
                onClick={() => handleSave('google')}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs"
              >
                <Key className="h-4 w-4" />
                {google.maps_api_key ? 'Update Key' : 'Save Key'}
              </Button>

              {google.maps_api_key && (
                <Button
                  onClick={() => handleDisconnect('google', 'maps_api_key')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* AWS S3 Storage Integration Card */}
          <Card className="border-border/40 rounded-lg bg-card shadow-sm overflow-hidden flex flex-col justify-between">
            <CardContent className="p-6 space-y-5 flex-1">

              {/* Header block */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">AWS S3 Storage</h3>
                  </div>
                </div>
                <StatusBadge configured={Boolean(aws.access_key_id && aws.secret_access_key && aws.bucket_name)} />
              </div>

              {/* Setup Box */}
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4 space-y-1.5 text-xs text-amber-700 dark:text-amber-300/90">
                <p className="font-bold text-amber-800 dark:text-amber-300">Setup steps</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Log in to AWS Console → IAM → Create Access Key</li>
                  <li>Copy Access Key ID and Secret Access Key</li>
                  <li>Enter S3 Bucket Name and AWS Region (e.g. ap-south-1)</li>
                </ol>
              </div>

              {/* Active display (if configured) */}
              {Boolean(aws.access_key_id && aws.bucket_name) && (
                <ActiveKeyRow value={`${aws.bucket_name} (${aws.region || 'ap-south-1'})`} onCopy={() => copyToClipboard(aws.bucket_name, 'S3 Bucket Name')} />
              )}

              {/* Inputs block */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="awsAccessKeyId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AWS Access Key ID</Label>
                  <Input
                    id="awsAccessKeyId"
                    value={aws.access_key_id}
                    onChange={(e) => setAws({ ...aws, access_key_id: e.target.value })}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="awsSecretAccessKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AWS Secret Access Key</Label>
                  <PasswordInput
                    id="awsSecretAccessKey"
                    value={aws.secret_access_key}
                    onChange={(v) => setAws({ ...aws, secret_access_key: v })}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    visible={showAwsSecret}
                    onToggleVisible={() => setShowAwsSecret(!showAwsSecret)}
                    focusColor="blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="awsRegion" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AWS Region</Label>
                    <Input
                      id="awsRegion"
                      value={aws.region}
                      onChange={(e) => setAws({ ...aws, region: e.target.value })}
                      placeholder="ap-south-1"
                      className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="awsBucketName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bucket Name</Label>
                    <Input
                      id="awsBucketName"
                      value={aws.bucket_name}
                      onChange={(e) => setAws({ ...aws, bucket_name: e.target.value })}
                      placeholder="my-app-uploads"
                      className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm"
                    />
                  </div>
                </div>
              </div>

              <TestResultBanner result={awsTestResult} failMessage="Connection check failed. Verify AWS credentials & bucket permissions." />
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-muted/20 flex items-center gap-3">
              <Button
                onClick={() => handleSave('aws')}
                className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs"
              >
                <Key className="h-4 w-4" />
                {Boolean(aws.access_key_id && aws.bucket_name) ? 'Update Credentials' : 'Save Credentials'}
              </Button>

              <Button
                type="button"
                onClick={() => testConnection('aws')}
                disabled={testingAws}
                variant="outline"
                className="rounded-lg border-border/60 h-11 px-4 flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`h-4 w-4 ${testingAws ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              {Boolean(aws.access_key_id || aws.bucket_name) && (
                <Button
                  onClick={() => handleDisconnect('aws')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* MSG91 Gateway Card — Redesigned High-Fidelity */}
          <Card className="border border-purple-500/20 dark:border-purple-500/30 rounded-2xl bg-gradient-to-br from-card via-card to-purple-950/10 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden relative group">
            {/* Top Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-500" />

            {/* Header */}
            <div className="p-6 border-b border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-500/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                      MSG91 SMS & OTP Gateway
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                      TRAI DLT Ready
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-light">
                    Enterprise Transactional SMS, DLT Header Mapping & WhatsApp OTP Dispatch
                  </p>
                </div>
              </div>
              <StatusBadge configured={Boolean(msg91.auth_key)} />
            </div>

            <CardContent className="p-6 space-y-6">
              {/* MSG91 Capability Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-foreground">High Delivery Speed</span>
                  <span className="text-[10px] text-muted-foreground font-mono">&lt; 3s</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                  <span className="font-semibold text-foreground">DLT Header Guard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold text-foreground">Flow & OTP API v5</span>
                </div>
              </div>

              {/* Masked Active Key Summary */}
              {msg91.auth_key && (
                <ActiveKeyRow
                  value={msg91.auth_key}
                  onCopy={() => {
                    navigator.clipboard.writeText(msg91.auth_key);
                    toast.success('MSG91 Auth Key copied to clipboard');
                  }}
                />
              )}

              {/* Form Input Section */}
              <div className="space-y-5">
                {/* Auth Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="msg91AuthKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      MSG91 Authentication Key *
                    </Label>
                    <span className="text-[10px] text-purple-500 font-medium">MSG91 Control Panel &gt; API Keys</span>
                  </div>
                  <PasswordInput
                    id="msg91AuthKey"
                    value={msg91.auth_key}
                    onChange={(v) => setMsg91({ ...msg91, auth_key: v })}
                    placeholder="e.g. 381920As78129a02910a1"
                    visible={showMsg91Auth}
                    onToggleVisible={() => setShowMsg91Auth(!showMsg91Auth)}
                    focusColor="violet"
                  />
                </div>

                {/* Grid for Headers & Template IDs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="msg91SenderId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sender ID / Header
                    </Label>
                    <Input
                      id="msg91SenderId"
                      value={msg91.sender_id}
                      onChange={(e) => setMsg91({ ...msg91, sender_id: e.target.value.toUpperCase() })}
                      placeholder="e.g. FCISEL"
                      maxLength={6}
                      className="rounded-lg border-border/60 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 h-11 text-sm font-mono uppercase tracking-wider"
                    />
                    <p className="text-[10px] text-muted-foreground font-light">6-char TRAI approved Header</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="msg91DltTeId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      DLT Template Entity ID
                    </Label>
                    <Input
                      id="msg91DltTeId"
                      value={msg91.dlt_te_id}
                      onChange={(e) => setMsg91({ ...msg91, dlt_te_id: e.target.value })}
                      placeholder="e.g. 1707161234567890123"
                      className="rounded-lg border-border/60 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 h-11 text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground font-light">DLT Principal Entity ID</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="msg91FlowId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Flow ID / OTP Template
                    </Label>
                    <Input
                      id="msg91FlowId"
                      value={msg91.flow_id}
                      onChange={(e) => setMsg91({ ...msg91, flow_id: e.target.value })}
                      placeholder="e.g. 61d8a1b2c3d4e5f6789"
                      className="rounded-lg border-border/60 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 h-11 text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground font-light">MSG91 Campaign Flow ID</p>
                  </div>
                </div>
              </div>

              {/* Test Result Feedback */}
              <TestResultBanner result={msg91TestResult} failMessage="Connection check failed. Please verify your MSG91 Auth Key." />
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-purple-500/[0.02] flex items-center gap-3">
              <Button
                onClick={() => handleSave('msg91')}
                className="rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs shadow-md shadow-purple-600/20 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <Key className="h-4 w-4" />
                {Boolean(msg91.auth_key) ? 'Update Credentials' : 'Save Credentials'}
              </Button>

              <Button
                type="button"
                onClick={() => testConnection('msg91')}
                disabled={testingMsg91}
                variant="outline"
                className="rounded-lg border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold h-11 px-4 flex items-center gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${testingMsg91 ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              {Boolean(msg91.auth_key) && (
                <Button
                  onClick={() => handleDisconnect('msg91')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto cursor-pointer"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

          {/* Firebase Push Notification Card (FCM) */}
          <Card className="border border-amber-500/20 dark:border-amber-500/30 rounded-2xl bg-gradient-to-br from-card via-card to-amber-950/10 shadow-lg hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden relative group">
            {/* Top Gradient Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

            {/* Card Header */}
            <div className="p-6 border-b border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                  <Bell className="h-6 w-6 text-yellow-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                      Firebase Push Notifications (FCM)
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                      FCM Push Service
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-light">
                    Firebase Cloud Messaging credentials for Android, iOS &amp; Web Push Notifications
                  </p>
                </div>
              </div>
              <StatusBadge configured={Boolean(firebase.fcm_server_key || (firebase.api_key && firebase.project_id))} />
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Capability Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/30 text-xs">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold text-foreground">Mobile &amp; Web Push</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  <span className="font-semibold text-foreground">FCM V1 / Server Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="font-semibold text-foreground">Instant Push Dispatch</span>
                </div>
              </div>

              {/* Active Key Row */}
              {(firebase.fcm_server_key || firebase.api_key) && (
                <ActiveKeyRow
                  value={firebase.fcm_server_key || firebase.api_key}
                  onCopy={() => {
                    navigator.clipboard.writeText(firebase.fcm_server_key || firebase.api_key);
                    toast.success('Firebase FCM Key copied to clipboard');
                  }}
                />
              )}

              {/* Form Input Section */}
              <div className="space-y-5">
                {/* Primary FCM Server Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fcmServerKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      FCM Server Key / Private Key * (for Backend Push Dispatch)
                    </Label>
                    <span className="text-[10px] text-amber-500 font-medium">Firebase Console &gt; Project Settings &gt; Cloud Messaging</span>
                  </div>
                  <PasswordInput
                    id="fcmServerKey"
                    value={firebase.fcm_server_key}
                    onChange={(v) => setFirebase({ ...firebase, fcm_server_key: v })}
                    placeholder="e.g. AAAA1234567:APA91bG...ServerKey"
                    visible={showFcmServerKey}
                    onToggleVisible={() => setShowFcmServerKey(!showFcmServerKey)}
                    focusColor="blue"
                  />
                  <p className="text-[10px] text-muted-foreground font-light">Server key used by backend to trigger push notifications to app users</p>
                </div>

                {/* Grid for Project ID, App ID & Messaging Sender ID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firebaseProjectId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Firebase Project ID *
                    </Label>
                    <Input
                      id="firebaseProjectId"
                      value={firebase.project_id}
                      onChange={(e) => setFirebase({ ...firebase, project_id: e.target.value })}
                      placeholder="e.g. fciseller-prod"
                      className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="firebaseSenderId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Messaging Sender ID
                    </Label>
                    <Input
                      id="firebaseSenderId"
                      value={firebase.messaging_sender_id}
                      onChange={(e) => setFirebase({ ...firebase, messaging_sender_id: e.target.value })}
                      placeholder="e.g. 109283746501"
                      className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="firebaseAppId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Firebase App ID
                    </Label>
                    <Input
                      id="firebaseAppId"
                      value={firebase.app_id}
                      onChange={(e) => setFirebase({ ...firebase, app_id: e.target.value })}
                      placeholder="e.g. 1:109283746501:web:abc123"
                      className="rounded-lg border-border/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 h-11 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Firebase Web API Key */}
                <div className="space-y-1.5">
                  <Label htmlFor="firebaseApiKey" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Firebase Web API Key (Web FCM Client SDK)
                  </Label>
                  <PasswordInput
                    id="firebaseApiKey"
                    value={firebase.api_key}
                    onChange={(v) => setFirebase({ ...firebase, api_key: v })}
                    placeholder="e.g. AIzaSyA1234567890ExampleKey"
                    visible={showFirebaseKey}
                    onToggleVisible={() => setShowFirebaseKey(!showFirebaseKey)}
                    focusColor="blue"
                  />
                  <p className="text-[10px] text-muted-foreground font-light">Web API Key used for web push token registration in browser</p>
                </div>
              </div>

              {/* Test Result Feedback */}
              <TestResultBanner result={firebaseTestResult} failMessage="Connection check failed. Please verify your FCM Server Key & Project ID." />
            </CardContent>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border/20 bg-amber-500/[0.02] flex items-center gap-3">
              <Button
                onClick={() => handleSave('firebase')}
                className="rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-11 px-6 flex items-center gap-2 text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <Key className="h-4 w-4" />
                {Boolean(firebase.fcm_server_key || firebase.api_key) ? 'Update FCM Credentials' : 'Save FCM Credentials'}
              </Button>

              <Button
                type="button"
                onClick={() => testConnection('firebase')}
                disabled={testingFirebase}
                variant="outline"
                className="rounded-lg border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold h-11 px-4 flex items-center gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${testingFirebase ? 'animate-spin' : ''}`} />
                Test FCM Connection
              </Button>

              {Boolean(firebase.fcm_server_key || firebase.api_key || firebase.project_id) && (
                <Button
                  onClick={() => handleDisconnect('firebase')}
                  variant="ghost"
                  className="rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-11 px-4 text-xs ml-auto cursor-pointer"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Connected
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold bg-muted text-muted-foreground border border-border/40 px-2.5 py-1 rounded-full">
      Not configured
    </span>
  );
}

function ActiveKeyRow({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="bg-muted/40 border border-border/40 rounded-lg p-3.5 flex justify-between items-center text-xs font-mono text-muted-foreground">
      <span className="truncate">Active: {value}</span>
      <button
        onClick={onCopy}
        type="button"
        className="hover:text-foreground p-1 shrink-0"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

function TestResultBanner({ result, failMessage }: { result: 'success' | 'fail' | null; failMessage: string }) {
  if (!result) return null;
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-medium ${
      result === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
    }`}>
      {result === 'success' ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          <span>Connection check successful</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span>{failMessage}</span>
        </>
      )}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisible,
  focusColor,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  focusColor: 'blue' | 'emerald' | 'violet';
}) {
  const focusClass = {
    blue: 'focus:border-blue-500 focus:ring-blue-500/30',
    emerald: 'focus:border-emerald-500 focus:ring-emerald-500/30',
    violet: 'focus:border-violet-500 focus:ring-violet-500/30',
  }[focusColor];

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-lg border-border/60 focus:ring-1 h-11 text-sm pr-10 ${focusClass}`}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 z-10"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
