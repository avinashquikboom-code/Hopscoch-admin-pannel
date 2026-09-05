'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { API_BASE } from '@/lib/api';
import { FileText, Save, Loader2, Shield, RefreshCw } from 'lucide-react';

interface PolicyData {
  key: string;
  title: string;
  content: string;
  updatedAt?: string;
}

const DEFAULT_POLICIES: Record<string, PolicyData> = {
  'privacy-policy': {
    key: 'privacy-policy',
    title: 'Privacy Policy',
    content: `Fashion City India ("FCI", "we", "us") values your trust. This Privacy Policy describes how we collect, protect, and use your personal information across our website, mobile apps, and services.\n\n1. Information We Collect: We collect information you provide directly, such as name, email address, phone number, shipping address, and payment references.\n\n2. Use of Information: Your data is used strictly for order fulfillment, fraud prevention, service improvements, and customer support.\n\n3. Data Security: We maintain strict administrative and technical safeguards to keep your personal data secure.`,
  },
  'terms-and-conditions': {
    key: 'terms-and-conditions',
    title: 'Terms and Conditions',
    content: `Welcome to FCI Seller. By accessing or using our website or mobile application, you agree to comply with and be bound by these Terms and Conditions.\n\n1. User Eligibility: You must be at least 18 years old or access under parental guidance.\n\n2. Product Pricing & Availability: All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise.\n\n3. Order Acceptance: We reserve the right to cancel or refuse any order for reasons including pricing inaccuracies, stock deficits, or fraud flags.`,
  },
  'return-refund-policy': {
    key: 'return-refund-policy',
    title: 'Return and Refund Policy',
    content: `We want you to love what you wear. If you are not satisfied, our return and refund process is straightforward.\n\n1. Return Window: Eligible products can be returned within 7 days of delivery.\n\n2. Condition: Items must be unused, unwashed, and in original packaging with intact tags.\n\n3. Refund Method: Refunds are credited back to the original payment source or wallet within 5-7 business days of warehouse inspection.`,
  },
  'shipping-policy': {
    key: 'shipping-policy',
    title: 'Shipping Policy',
    content: `Orders are shipped via authorized courier partners (Delhivery, Bluedart, DTDC, India Post).\n\n1. Dispatch Time: Orders are processed and dispatched within 24 to 48 business hours.\n\n2. Delivery Time: Typical transit duration is 3 to 7 business days depending on delivery pincode.\n\n3. Tracking: An SMS and in-app tracking update with active AWB link is generated upon dispatch.`,
  },
};

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token')
    : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function LegalPoliciesPage() {
  const [activeTab, setActiveTab] = useState<string>('privacy-policy');
  const [policies, setPolicies] = useState<Record<string, PolicyData>>(DEFAULT_POLICIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/content/policies`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const serverPolicies: any[] = json.data || [];
        if (Array.isArray(serverPolicies) && serverPolicies.length > 0) {
          const updated = { ...DEFAULT_POLICIES };
          for (const p of serverPolicies) {
            if (p.key) {
              updated[p.key] = {
                key: p.key,
                title: p.title || updated[p.key]?.title || p.key,
                content: p.content || '',
                updatedAt: p.updatedAt,
              };
            }
          }
          setPolicies(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load policies from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSavePolicy = async (key: string) => {
    const policy = policies[key];
    if (!policy) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/content/policies/${key}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          title: policy.title,
          content: policy.content,
          isActive: true,
        }),
      });

      if (res.ok) {
        toast.success(`${policy.title} updated and published successfully!`);
        fetchPolicies();
      } else {
        const errorJson = await res.json().catch(() => ({}));
        toast.error(errorJson.message || `Failed to update ${policy.title}`);
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateCurrentPolicyField = (key: string, field: 'title' | 'content', value: string) => {
    setPolicies(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-600" />
              Legal Policies & Compliance
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure and publish official customer policies for your store.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPolicies}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Policy Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60">
            <TabsTrigger value="privacy-policy" className="text-xs font-semibold py-2.5">
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger value="terms-and-conditions" className="text-xs font-semibold py-2.5">
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="return-refund-policy" className="text-xs font-semibold py-2.5">
              Return & Refund
            </TabsTrigger>
            <TabsTrigger value="shipping-policy" className="text-xs font-semibold py-2.5">
              Shipping Policy
            </TabsTrigger>
          </TabsList>

          {Object.entries(policies).map(([key, policy]) => (
            <TabsContent key={key} value={key}>
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                        {policy.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {policy.updatedAt
                          ? `Last updated: ${new Date(policy.updatedAt).toLocaleString('en-IN')}`
                          : 'Standard system policy'}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleSavePolicy(key)}
                      disabled={saving}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5" /> Save & Publish
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${key}`} className="text-xs font-bold text-muted-foreground uppercase">
                      Policy Title
                    </Label>
                    <Input
                      id={`title-${key}`}
                      value={policy.title}
                      onChange={(e) => updateCurrentPolicyField(key, 'title', e.target.value)}
                      className="mt-1.5"
                      placeholder="e.g. Privacy Policy"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`content-${key}`} className="text-xs font-bold text-muted-foreground uppercase">
                      Policy Content (Markdown or Plain Text)
                    </Label>
                    <Textarea
                      id={`content-${key}`}
                      value={policy.content}
                      onChange={(e) => updateCurrentPolicyField(key, 'content', e.target.value)}
                      className="mt-1.5 min-h-[350px] font-mono text-sm leading-relaxed"
                      placeholder="Enter legal terms and policy conditions..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
