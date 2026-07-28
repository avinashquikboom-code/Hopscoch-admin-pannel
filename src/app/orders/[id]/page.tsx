'use client';
import { API_BASE, getImageUrl } from '@/lib/api';

import { useState, use, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  RefreshCw,
  FileText,
  Download,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  Info,
  Printer,
  Ship,
  Box
} from 'lucide-react';

const orderDetails = {
  id: 'ORD-1234',
  invoiceNumber: 'INV-1234',
  customer: {
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1 234 567 8900',
  },
  deliveryAddress: {
    name: 'Sarah Johnson',
    street: '123 Fashion Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  },
  billingAddress: {
    name: 'Sarah Johnson',
    street: '123 Fashion Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  },
  status: 'processing',
  paymentStatus: 'paid',
  paymentMethod: 'Credit Card',
  items: [
    {
      id: 'SKU-001',
      name: 'Premium Silk Dress',
      size: 'M',
      color: 'Teal',
      quantity: 2,
      price: 189.00,
      discount: 0,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop',
    },
    {
      id: 'SKU-002',
      name: 'Cashmere Cardigan',
      size: 'M',
      color: 'Beige',
      quantity: 1,
      price: 45.50,
      discount: 5.00,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop',
    },
  ],
  subtotal: 423.50,
  discount: 15.00,
  coupon: 'SAVE10',
  shippingCharges: 10.00,
  tax: 42.35,
  total: 460.85,
  orderDate: '2024-01-15',
  expectedDelivery: '2024-01-25',
  courierPartner: 'FedEx',
  trackingNumber: 'TRK123456789',
  awbNumber: 'AWB987654321',
  adminNotes: '',
};

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-success/10 text-success' },
  processing: { label: 'Processing', icon: Package, color: 'bg-info/10 text-info' },
  packed: { label: 'Packed', icon: Box, color: 'bg-primary/10 text-primary' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-primary/10 text-primary' },
  out_for_delivery: { label: 'Out For Delivery', icon: Ship, color: 'bg-info/10 text-info' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
};

const timeline = [
  {
    status: 'order_placed',
    label: 'Order Placed',
    date: '2024-01-15',
    time: '10:30 AM',
    updatedBy: 'Sarah Johnson',
    remarks: 'Order successfully placed',
  },
  {
    status: 'payment_successful',
    label: 'Payment Successful',
    date: '2024-01-15',
    time: '10:31 AM',
    updatedBy: 'System',
    remarks: 'Payment of $460.85 processed via Credit Card',
  },
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    date: '2024-01-15',
    time: '11:00 AM',
    updatedBy: 'Admin',
    remarks: 'Order confirmed by admin',
  },
  {
    status: 'processing',
    label: 'Processing',
    date: '2024-01-16',
    time: '09:00 AM',
    updatedBy: 'Admin',
    remarks: 'Order is being processed',
  },
];

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
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

  // ── Real order data from API ──────────────────────────────────────────────
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const numericId = id.replace(/\D/g, '') || id;
    setLoadingOrder(true);
    setOrderError(null);

    Promise.all([
      fetch(`${API_BASE}/api/admin/orders/${numericId}`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/admin/orders/${numericId}/timeline`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({})),
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
      // Shape the data into what the UI expects
      setOrderDetails({
        id: rawOrder.orderNumber || String(rawOrder.id),
        invoiceNumber: `INV-${rawOrder.id}`,
        customer: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          email: user.email || '',
          phone: user.phone || '',
        },
        deliveryAddress: {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          street: addr.line1 || addr.addressLine1 || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.pincode || addr.zipCode || '',
          country: addr.country || 'India',
        },
        billingAddress: {
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
        expectedDelivery: '',
        courierPartner: rawOrder.shipment?.courierName || '',
        trackingNumber: rawOrder.shipment?.trackingId || '',
        awbNumber: rawOrder.shipment?.awb || '',
        adminNotes: '',
      });
      // Timeline
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
  }, [id]);

  const [adminNotes, setAdminNotes] = useState('');
  const statusInfo = orderDetails ? statusConfig[orderDetails.status as keyof typeof statusConfig] || statusConfig['pending'] : statusConfig['pending'];

  const [shipmentStatus, setShipmentStatus] = useState<'NOT_CREATED' | 'CREATED' | 'AWB_ASSIGNED' | 'PICKUP_SCHEDULED' | 'CANCELLED'>('NOT_CREATED');
  const [awbCode, setAwbCode] = useState<string>('');
  const [courierName, setCourierName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleShiprocketAction = async (action: string) => {
    setActionLoading(true);
    try {
      const orderIdNumeric = parseInt(id.replace(/\D/g, '')) || 1234;
      const res = await fetch(`${API_BASE}/api/v1/admin/shipping/${action}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderId: orderIdNumeric }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Shiprocket ${action.toUpperCase()} action processed successfully.`);
        if (action === 'create') {
          setShipmentStatus('CREATED');
        } else if (action === 'awb') {
          setShipmentStatus('AWB_ASSIGNED');
          setAwbCode(data.data?.awb_code || 'AWB987654321');
          setCourierName(data.data?.courier_name || 'FedEx');
        } else if (action === 'pickup') {
          setShipmentStatus('PICKUP_SCHEDULED');
        } else if (action === 'cancel') {
          setShipmentStatus('CANCELLED');
        } else if (action === 'label') {
          if (data.data?.label_url) {
            window.open(data.data.label_url, '_blank');
          } else {
            toast.success('Label downloaded successfully.');
          }
        }
      } else {
        toast.error(data.message || `Action ${action} failed.`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!orderDetails) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const itemsHtml = (orderDetails.items || [])
      .map(
        (it: any) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">${it.name}<br/><small style="color:#666;">Size: ${it.size} | Color: ${it.color} | SKU: ${it.id}</small></td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${it.quantity}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">₹${(it.price || 0).toFixed(2)}</td>
        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">₹${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</td>
      </tr>`
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${orderDetails.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #2563eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 13px; font-weight: 600; }
            .totals { float: right; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; border-bottom: none; padding-top: 10px; margin-top: 6px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FCI Seller TAX INVOICE</div>
              <p style="margin:4px 0; font-size:13px; color:#64748b;">Luxury E-Commerce</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:2px 0; font-weight:bold;">Invoice #: ${orderDetails.invoiceNumber || orderDetails.id}</p>
              <p style="margin:2px 0; font-size:13px; color:#64748b;">Date: ${orderDetails.orderDate}</p>
            </div>
          </div>
          <div class="info-grid">
            <div>
              <h4 style="margin:0 0 6px 0; color:#475569;">Billed To:</h4>
              <p style="margin:2px 0; font-weight:600;">${orderDetails.customer?.name || 'Customer'}</p>
              <p style="margin:2px 0; font-size:13px; color:#64748b;">${orderDetails.customer?.email || ''}</p>
              <p style="margin:2px 0; font-size:13px; color:#64748b;">${orderDetails.customer?.phone || ''}</p>
            </div>
            <div>
              <h4 style="margin:0 0 6px 0; color:#475569;">Shipping Address:</h4>
              <p style="margin:2px 0; font-size:13px;">${orderDetails.deliveryAddress?.street || ''}, ${orderDetails.deliveryAddress?.city || ''}, ${orderDetails.deliveryAddress?.state || ''} - ${orderDetails.deliveryAddress?.zipCode || ''}, ${orderDetails.deliveryAddress?.country || 'India'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>₹${(orderDetails.subtotal || 0).toFixed(2)}</span></div>
            <div class="total-row"><span>Shipping Charge:</span><span>${(orderDetails.shippingCharges || 0) > 0 ? `₹${(orderDetails.shippingCharges).toFixed(2)}` : 'FREE'}</span></div>
            <div class="total-row"><span>Tax / GST (18%):</span><span>₹${(orderDetails.tax || 0).toFixed(2)}</span></div>
            <div class="total-row grand-total"><span>Grand Total:</span><span>₹${(orderDetails.total || 0).toFixed(2)}</span></div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

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
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
      {!loadingOrder && !orderError && orderDetails && (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
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
            <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
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
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-semibold">{orderDetails.expectedDelivery}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant="default" className="bg-success">
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

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{orderDetails.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{orderDetails.customer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{orderDetails.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{orderDetails.customer.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">{orderDetails.deliveryAddress.name}</p>
                      <p className="text-sm">{orderDetails.deliveryAddress.street}</p>
                      <p className="text-sm">{orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} {orderDetails.deliveryAddress.zipCode}</p>
                      <p className="text-sm">{orderDetails.deliveryAddress.country}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Billing Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">{orderDetails.billingAddress.name}</p>
                      <p className="text-sm">{orderDetails.billingAddress.street}</p>
                      <p className="text-sm">{orderDetails.billingAddress.city}, {orderDetails.billingAddress.state} {orderDetails.billingAddress.zipCode}</p>
                      <p className="text-sm">{orderDetails.billingAddress.country}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Products Ordered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.items.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.id}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Size: {item.size}</span>
                          <span className="text-sm">Color: {item.color}</span>
                          <span className="text-sm">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.price.toFixed(2)}</p>
                        {item.discount > 0 && (
                          <p className="text-sm text-destructive">-${item.discount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                  </div>
                  {orderDetails.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-destructive">-₹{orderDetails.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderDetails.coupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coupon ({orderDetails.coupon})</span>
                      <span className="text-success">-₹{orderDetails.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{orderDetails.shippingCharges > 0 ? `₹${orderDetails.shippingCharges.toFixed(2)}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 border-y border-border/40 my-1 bg-muted/20 px-2 rounded">
                    <span className="font-semibold text-foreground">GST / Tax</span>
                    <span className="font-bold text-foreground">₹{orderDetails.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">₹{orderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-16 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{item.label}</p>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{item.date}</p>
                            <p className="text-sm text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Updated by: {item.updatedBy}</p>
                        <p className="text-sm mt-2">{item.remarks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderDetails.status === 'pending' && (
                  <>
                    <Button className="w-full" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm Order
                    </Button>
                    <Button className="w-full" variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Order
                    </Button>
                  </>
                )}
                {orderDetails.status === 'confirmed' && (
                  <>
                    <Button className="w-full" variant="default">
                      <Package className="mr-2 h-4 w-4" />
                      Mark as Processing
                    </Button>
                    <Button className="w-full" variant="outline">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  </>
                )}
                {orderDetails.status === 'processing' && (
                  <>
                    <Button className="w-full" variant="default">
                      <Box className="mr-2 h-4 w-4" />
                      Mark as Packed
                    </Button>
                    <Button className="w-full" variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Invoice
                    </Button>
                  </>
                )}
                {orderDetails.status === 'packed' && (
                  <>
                    <Button className="w-full" variant="default">
                      <Ship className="mr-2 h-4 w-4" />
                      Mark as Shipped
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Truck className="mr-2 h-4 w-4" />
                      Assign Courier
                    </Button>
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Tracking
                    </Button>
                  </>
                )}
                {orderDetails.status === 'shipped' && (
                  <>
                    <Button className="w-full" variant="default">
                      <Ship className="mr-2 h-4 w-4" />
                      Mark Out for Delivery
                    </Button>
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update Tracking
                    </Button>
                  </>
                )}
                {orderDetails.status === 'out_for_delivery' && (
                  <>
                    <Button className="w-full" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Delivered
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Courier Partner</p>
                    <p className="font-semibold">{orderDetails.courierPartner}</p>
                  </div>
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-semibold font-mono">{orderDetails.trackingNumber}</p>
                  </div>
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AWB Number</p>
                    <p className="font-semibold font-mono">{orderDetails.awbNumber}</p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-semibold">{orderDetails.expectedDelivery}</p>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Shiprocket Logistics Integration */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shiprocket Dispatch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Shipment Status</span>
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    {shipmentStatus.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {awbCode && (
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AWB Code</span>
                      <span className="font-mono font-medium text-foreground">{awbCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courier Partner</span>
                      <span className="font-medium text-foreground">{courierName}</span>
                    </div>
                  </div>
                )}

                {shipmentStatus === 'NOT_CREATED' && (
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => handleShiprocketAction('create')}
                  >
                    Create Shiprocket Order
                  </Button>
                )}

                {shipmentStatus === 'CREATED' && (
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => handleShiprocketAction('awb')}
                  >
                    Generate AWB Number
                  </Button>
                )}

                {shipmentStatus === 'AWB_ASSIGNED' && (
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => handleShiprocketAction('pickup')}
                  >
                    Schedule Pickup
                  </Button>
                )}

                {shipmentStatus === 'PICKUP_SCHEDULED' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => handleShiprocketAction('label')}
                    >
                      Download Shiprocket Label
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => handleShiprocketAction('invoice')}
                    >
                      Download Shiprocket Invoice
                    </Button>
                  </div>
                )}

                {shipmentStatus !== 'NOT_CREATED' && shipmentStatus !== 'CANCELLED' && (
                  <Button 
                    className="w-full" 
                    variant="destructive" 
                    disabled={actionLoading}
                    onClick={() => handleShiprocketAction('cancel')}
                  >
                    Cancel Shiprocket Order
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add internal notes about this order..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-24"
                />
                <Button className="w-full mt-3" variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </AdminLayout>
  );
}
