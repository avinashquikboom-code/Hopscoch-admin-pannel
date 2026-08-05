'use client';
import { API_BASE } from '@/lib/api';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  FileText,
  Download,
  Calendar,
  Printer,
  Ship,
  Box,
  ExternalLink,
  Loader2
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-600' },
  processing: { label: 'Processing', icon: Package, color: 'bg-blue-500/10 text-blue-600' },
  packed: { label: 'Packed', icon: Box, color: 'bg-teal-500/10 text-teal-600' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-teal-600/15 text-teal-700 font-bold' },
  out_for_delivery: { label: 'Out For Delivery', icon: Ship, color: 'bg-indigo-500/10 text-indigo-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-600/15 text-emerald-600 font-bold' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-rose-500/10 text-rose-600' },
};

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('admin_token') || localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function OrderDetailsPage({ params }: { params: any }) {
  const [id, setId] = useState<string>('');

  useEffect(() => {
    if (!params) return;
    if (typeof params.then === 'function') {
      params.then((p: any) => setId(p?.id || ''));
    } else {
      setId(params?.id || '');
    }
  }, [params]);

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Manual Shipping Modal State
  const [showShipModal, setShowShipModal] = useState(false);
  const [courierSelect, setCourierSelect] = useState('Delhivery');
  const [customCourier, setCustomCourier] = useState('');
  const [awbInput, setAwbInput] = useState('');
  const [submittingShipment, setSubmittingShipment] = useState(false);

  const fetchOrderData = () => {
    if (!id) return;
    const numericId = id.replace(/\D/g, '') || id;
    setLoadingOrder(true);
    setOrderError(null);

    Promise.all([
      fetch(`${API_BASE}/api/v1/admin/orders/${numericId}`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/v1/admin/orders/${numericId}/timeline`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({})),
    ]).then(([orderJson, timelineJson]) => {
      const rawOrder = orderJson?.data ?? orderJson;
      if (!rawOrder || typeof rawOrder !== 'object' || (!rawOrder.id && !rawOrder.orderNumber)) {
        setOrderError('Order details could not be loaded or were not found');
        setLoadingOrder(false);
        return;
      }
      const addr = rawOrder.address || rawOrder.shippingAddress || {};
      const user = rawOrder.user || {};
      const payment = rawOrder.payment || {};
      
      setOrderDetails({
        numericId: rawOrder.id,
        id: rawOrder.orderNumber || `#${rawOrder.id}`,
        invoiceNumber: `INV-${rawOrder.id}`,
        sellerName: rawOrder.sellerNameSnapshot || 'FCI Seller Retail Pvt. Ltd.',
        sellerContact: rawOrder.sellerContactSnapshot || '+91 9876543210',
        sellerAddress: rawOrder.sellerAddressSnapshot || '',
        customer: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          email: user.email || '',
          phone: addr.phone || addr.phoneNumber || user.phone || '',
        },
        deliveryAddress: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          street: addr.line1 || addr.addressLine1 || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.pincode || addr.zipCode || '',
          country: addr.country || 'India',
        },
        status: (rawOrder.status || 'pending').toLowerCase(),
        paymentStatus: payment.status?.toLowerCase() || 'pending',
        paymentMethod: payment.method || 'N/A',
        items: (rawOrder.items || []).map((item: any) => ({
          id: item.variant?.sku || String(item.id),
          name: item.product?.name || item.productNameSnapshot || 'Product',
          size: item.variant?.size || item.variantSnapshot?.size || '—',
          color: item.variant?.color || item.variantSnapshot?.color || '—',
          quantity: item.quantity,
          price: Number(item.priceSnapshot || 0),
          discount: 0,
          image: item.product?.images?.[0]?.url || item.product?.images?.[0] || '',
        })),
        subtotal: Number(rawOrder.subtotal || 0),
        discount: Number(rawOrder.discountAmount || 0),
        coupon: '',
        shippingCharges: Number(rawOrder.shippingAmount || 0),
        tax: Number(rawOrder.taxAmount || 0),
        total: Number(rawOrder.totalAmount || 0),
        orderDate: rawOrder.createdAt
          ? new Date(rawOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'
          : '',
        expectedDelivery: rawOrder.shippedAt ? 'Delivering in 3-5 days' : '',
        courierPartner: rawOrder.courierName || rawOrder.shipment?.courier || '',
        awbNumber: rawOrder.awbNumber || rawOrder.shipment?.awb || '',
      });

      const rawTimeline: any[] = Array.isArray(timelineJson.data ?? timelineJson) ? (timelineJson.data ?? timelineJson) : [];
      setTimeline(rawTimeline.map((t: any) => ({
        status: t.status?.toLowerCase(),
        label: (t.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '',
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
        updatedBy: t.updatedBy || 'System',
        remarks: t.note || '',
      })));
    }).catch((err) => {
      setOrderError(err.message || 'Failed to load order');
    }).finally(() => {
      setLoadingOrder(false);
    });
  };

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string, courierName?: string, awbNumber?: string) => {
    try {
      const numericId = orderDetails?.numericId || id.replace(/\D/g, '');
      const res = await fetch(`${API_BASE}/api/v1/admin/orders/${numericId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus.toUpperCase(),
          ...(courierName ? { courierName } : {}),
          ...(awbNumber ? { awbNumber } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
        setShowShipModal(false);
        fetchOrderData();
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awbInput.trim()) {
      toast.error('AWB / Tracking Number is required');
      return;
    }
    const finalCourier = courierSelect === 'Other' ? customCourier.trim() : courierSelect;
    if (!finalCourier) {
      toast.error('Courier name is required');
      return;
    }

    setSubmittingShipment(true);
    await handleUpdateStatus('SHIPPED', finalCourier, awbInput.trim());
    setSubmittingShipment(false);
  };

  const statusInfo = orderDetails ? statusConfig[orderDetails.status as keyof typeof statusConfig] || statusConfig['pending'] : statusConfig['pending'];

  return (
    <AdminLayout>
      {loadingOrder && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      {orderError && !loadingOrder && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive font-semibold">{orderError}</p>
          <Button variant="outline" onClick={fetchOrderData}>Retry</Button>
        </div>
      )}
      {!loadingOrder && !orderError && orderDetails && (
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
              <p className="text-muted-foreground mt-1">{orderDetails.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>
              <statusInfo.icon className="h-4 w-4 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader><CardTitle>Order Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-semibold font-mono">{orderDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-semibold font-mono">{orderDetails.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">{orderDetails.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant="default" className="bg-emerald-600">
                      {orderDetails.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold">{orderDetails.paymentMethod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Address */}
            <Card>
              <CardHeader><CardTitle>Customer & Delivery Address</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="font-semibold">{orderDetails.customer.name}</p>
                <p className="text-sm text-muted-foreground">{orderDetails.customer.email} • {orderDetails.customer.phone}</p>
                <div className="pt-2 border-t text-sm">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Delivery Address</p>
                  <p className="mt-1">{orderDetails.deliveryAddress.street}, {orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} - {orderDetails.deliveryAddress.zipCode}</p>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader><CardTitle>Ordered Items</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0 text-sm">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} | Size: {item.size}</p>
                    </div>
                    <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{orderDetails.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₹{orderDetails.shippingCharges.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST / Tax</span><span>₹{orderDetails.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t"><span>Total Amount</span><span className="text-teal-600">₹{orderDetails.total.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader><CardTitle>Order Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {timeline.map((t: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5" />
                    <div>
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.date} {t.time} • {t.remarks || 'Status updated'}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Manual Shipping Actions */}
            <Card className="border-teal-500/30 bg-card">
              <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Truck className="h-4 w-4 text-teal-600" /> Shipping & Fulfillment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {orderDetails.status !== 'shipped' && orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled' && (
                  <Button onClick={() => setShowShipModal(true)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer">
                    <Ship className="mr-2 h-4 w-4" />
                    Mark as Shipped (Enter AWB)
                  </Button>
                )}

                {orderDetails.status === 'shipped' && (
                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-md space-y-2 text-xs">
                    <p className="font-bold text-teal-700 dark:text-teal-400">Order Shipped</p>
                    <p><strong>Courier:</strong> {orderDetails.courierPartner || 'N/A'}</p>
                    <p><strong>AWB Number:</strong> <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold">{orderDetails.awbNumber || 'N/A'}</code></p>
                    <Button onClick={() => setShowShipModal(true)} variant="outline" size="sm" className="w-full mt-2 text-xs cursor-pointer">
                      Edit Courier / AWB Info
                    </Button>
                    <Button onClick={() => handleUpdateStatus('DELIVERED')} variant="default" size="sm" className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Mark as Delivered
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Manual Ship Modal Dialog */}
        {showShipModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-5 w-5 text-teal-600" />
                  Mark Order as Shipped
                </h3>
                <button onClick={() => setShowShipModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-lg cursor-pointer">×</button>
              </div>

              <form onSubmit={handleShipSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Courier Partner</label>
                  <select
                    value={courierSelect}
                    onChange={e => setCourierSelect(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-border bg-background font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Delhivery">Delhivery</option>
                    <option value="Bluedart">Bluedart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="India Post">India Post (Speed Post)</option>
                    <option value="Ecom Express">Ecom Express</option>
                    <option value="Other">Other Courier</option>
                  </select>
                </div>

                {courierSelect === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Enter Courier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Professional Couriers"
                      value={customCourier}
                      onChange={e => setCustomCourier(e.target.value)}
                      className="w-full p-2.5 rounded-md border border-border bg-background focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">AWB / Tracking Number *</label>
                  <input
                    type="text"
                    placeholder="Enter AWB or Consignment Number"
                    value={awbInput}
                    onChange={e => setAwbInput(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-border bg-background font-mono focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowShipModal(false)} className="flex-1 cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingShipment} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer">
                    {submittingShipment ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Confirm Shipping
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      )}
    </AdminLayout>
  );
}
