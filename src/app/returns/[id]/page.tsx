'use client';

import { getImageUrl } from '@/lib/api';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  Info
} from 'lucide-react';

const returnDetails = {
  id: 'RET-1234',
  orderId: 'ORD-1234',
  customer: {
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1 234 567 8900',
  },
  address: {
    street: '123 Fashion Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
  },
  amount: 234.50,
  status: 'pending_review',
  pickupStatus: 'not_scheduled',
  inspectionStatus: 'pending',
  refundStatus: 'pending',
  reason: 'Wrong size received',
  customerComments: 'The size M dress I received is too small. I usually wear size M but this fits like a size S.',
  items: [
    {
      id: 'SKU-001',
      name: 'Premium Silk Dress',
      size: 'M',
      color: 'Teal',
      quantity: 1,
      price: 189.00,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&h=100&fit=crop',
    },
    {
      id: 'SKU-002',
      name: 'Cashmere Cardigan',
      size: 'M',
      color: 'Beige',
      quantity: 1,
      price: 45.50,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop',
    },
  ],
  images: [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
  ],
  date: '2024-01-15',
  orderDate: '2024-01-10',
  paymentMethod: 'Credit Card',
  refundType: 'full',
  adminNotes: '',
};

const statusConfig = {
  pending_review: { label: 'Pending Review', icon: Clock, color: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
  pickup_scheduled: { label: 'Pickup Scheduled', icon: Truck, color: 'bg-info/10 text-info' },
  picked_up: { label: 'Picked Up', icon: Package, color: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-success/10 text-success' },
};

const timeline = [
  {
    status: 'return_requested',
    label: 'Return Requested',
    date: '2024-01-15',
    time: '10:30 AM',
    updatedBy: 'Sarah Johnson',
    remarks: 'Customer initiated return request',
  },
  {
    status: 'under_review',
    label: 'Under Review',
    date: '2024-01-15',
    time: '11:00 AM',
    updatedBy: 'Admin',
    remarks: 'Return request is under review',
  },
];

export default function ReturnDetailsPage({ params }: { params: any }) {
  const [id, setId] = useState<string>('');

  useEffect(() => {
    if (!params) return;
    if (typeof params.then === 'function') {
      params.then((p: any) => setId(p?.id || ''));
    } else {
      setId(params?.id || '');
    }
  }, [params]);
  const [adminNotes, setAdminNotes] = useState(returnDetails.adminNotes);
  const statusInfo = statusConfig[returnDetails.status as keyof typeof statusConfig];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Return Details</h1>
              <p className="text-muted-foreground mt-1">{returnDetails.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>
              <statusInfo.icon className="h-4 w-4 mr-1" />
              {statusInfo.label}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Return Information */}
            <Card>
              <CardHeader>
                <CardTitle>Return Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Return ID</p>
                    <p className="font-semibold font-mono">{returnDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-semibold font-mono">{returnDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Return Date</p>
                    <p className="font-semibold">{returnDetails.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">{returnDetails.orderDate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Return Reason</p>
                  <p className="font-semibold">{returnDetails.reason}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Customer Comments</p>
                  <p className="text-sm mt-1">{returnDetails.customerComments}</p>
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
                    <p className="font-semibold">{returnDetails.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{returnDetails.customer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{returnDetails.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{returnDetails.customer.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm">{returnDetails.address.street}</p>
                      <p className="text-sm">{returnDetails.address.city}, {returnDetails.address.state} {returnDetails.address.zipCode}</p>
                      <p className="text-sm">{returnDetails.address.country}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {returnDetails.items.map((item) => (
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
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Return Amount</span>
                    <span className="text-2xl font-bold text-primary">${returnDetails.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            {returnDetails.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {returnDetails.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getImageUrl(image)}
                          alt={`Return image ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Return Timeline</CardTitle>
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
            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Return Status</p>
                    <Badge className={statusInfo.color}>
                      <statusInfo.icon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Status</p>
                    <Badge variant="secondary">
                      {returnDetails.pickupStatus === 'completed' ? 'Completed' : returnDetails.pickupStatus === 'scheduled' ? 'Scheduled' : 'Not Scheduled'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inspection Status</p>
                    <Badge variant="secondary">
                      {returnDetails.inspectionStatus === 'passed' ? 'Passed' : returnDetails.inspectionStatus === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Status</p>
                    <Badge variant="secondary">
                      {returnDetails.refundStatus === 'completed' ? 'Completed' : returnDetails.refundStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold">{returnDetails.paymentMethod}</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Type</p>
                    <p className="font-semibold capitalize">{returnDetails.refundType} Refund</p>
                  </div>
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Refund Amount</span>
                    <span className="text-xl font-bold text-primary">${returnDetails.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {returnDetails.status === 'pending_review' && (
                  <>
                    <Button className="w-full" variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Return
                    </Button>
                    <Button className="w-full" variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Return
                    </Button>
                    <Button className="w-full" variant="outline">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Request More Info
                    </Button>
                  </>
                )}
                {returnDetails.status === 'approved' && (
                  <>
                    <Button className="w-full" variant="default">
                      <Truck className="mr-2 h-4 w-4" />
                      Schedule Pickup
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Package className="mr-2 h-4 w-4" />
                      Assign Courier
                    </Button>
                  </>
                )}
                {returnDetails.status === 'picked_up' && (
                  <>
                    <Button className="w-full" variant="default">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Quality Inspection
                    </Button>
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Received
                    </Button>
                  </>
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
                  placeholder="Add internal notes about this return..."
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
    </AdminLayout>
  );
}
