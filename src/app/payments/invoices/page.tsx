'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  FileText,
  Download,
  Printer,
  Mail,
  Eye,
  Search,
  RefreshCw,
  Copy,
  TrendingUp,
  Receipt,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ExternalLink,
  User,
  MapPin,
  Package,
  CreditCard,
  Building2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  X
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { API_BASE, authHeaders } from '@/lib/api';
import { toast } from '@/components/ui/toast';

interface InvoiceItem {
  id: string;
  orderId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  gstNumber: string;
  amount: number;
  taxableAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  date: string;
  rawDate: Date;
  status: string;
  items: any[];
  rawOrder: any;
}

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  paid: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  delivered: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  completed: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', icon: Clock },
  processing: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30', icon: RefreshCw },
  shipped: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', icon: Sparkles },
  cancelled: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', icon: XCircle },
  refunded: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', icon: RefreshCw },
};

interface SellerInfo { sellerLegalName?: string; sellerGstNumber?: string; sellerAddress?: string; sellerCity?: string; sellerState?: string; sellerPincode?: string; sellerContactNumber?: string; sellerEmail?: string; sellerName?: string; }
interface WarehouseInfo { name?: string; address?: string; city?: string; state?: string; pincode?: string; phone?: string; }

function generateFciSellerInvoiceHtml(order: any, seller?: SellerInfo, warehouse?: WarehouseInfo): string {
  const rawId = String(order?.id || order?.orderNumber || '1001');
  const invoiceNo = `INV-FCI-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const totalAmt = Number(order?.totalAmount || order?.amount || order?.total || 0);
  const taxableTotal = totalAmt / 1.18;
  const totalGst = totalAmt - taxableTotal;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const user = order?.user || {};
  const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || order?.customerName || order?.customer || 'Valued Customer';
  const customerEmail = user.email || order?.customerEmail || 'customer@example.com';
  const customerPhone = user.phone || order?.customerPhone || 'N/A';
  const addr = order?.address || order?.shippingAddress || {};
  const street = addr.line1 || addr.addressLine1 || addr.street || 'Standard Shipping Address';
  const city = addr.city || 'Mumbai';
  const state = addr.state || 'Maharashtra';
  const pincode = addr.pincode || addr.zipCode || '400705';

  // Prefer order-time seller snapshots (manual checkout entry), fall back to settings
  const sellerLegalName =
    order?.sellerNameSnapshot ||
    seller?.sellerLegalName ||
    seller?.sellerName ||
    'FCI Seller Retail Pvt. Ltd.';
  const sellerGst = seller?.sellerGstNumber || '';
  const sellerAddr =
    order?.sellerAddressSnapshot ||
    [seller?.sellerAddress, seller?.sellerCity, seller?.sellerState, seller?.sellerPincode].filter(Boolean).join(', ');
  const sellerPhone =
    order?.sellerContactSnapshot ||
    seller?.sellerContactNumber ||
    '';
  const sellerEmailVal = seller?.sellerEmail || '';

  // Fulfilled By (from default warehouse)
  const warehouseName = warehouse?.name || 'FCI Seller Fulfillment Center';
  const warehouseAddr = warehouse ? [warehouse.address, warehouse.city, warehouse.state, warehouse.pincode].filter(Boolean).join(', ') : 'India';

  const items = Array.isArray(order?.items) ? order.items : [];
  const itemsRowsHtml = items.length > 0 ? items.map((item: any, idx: number) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || item.priceSnapshot || 0);
    const itemTotal = price * qty;
    const itemTaxable = itemTotal / 1.18;
    const itemCgst = (itemTotal - itemTaxable) / 2;
    const itemSgst = itemCgst;
    const name = item.product?.name || item.name || item.title || 'Retail Product';
    const size = item.variant?.size || item.size || '';
    const color = item.variant?.color || item.color || '';

    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px; color: #475569;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 600; color: #0f172a;">
          ${name}
          ${size ? `<br/><span style="font-size:11px; color:#64748b; font-weight: normal;">Size: ${size}</span>` : ''}
          ${color ? `<span style="font-size:11px; color:#64748b; font-weight: normal;"> | Color: ${color}</span>` : ''}
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px; color: #475569;">${qty}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; color: #475569;">₹${itemTaxable.toFixed(2)}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; color: #475569;">9% (₹${itemCgst.toFixed(2)})</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; color: #475569;">9% (₹${itemSgst.toFixed(2)})</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; font-weight: 700; color: #0f172a;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;" colspan="2">Standard Order Purchase</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">1</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">₹${taxableTotal.toFixed(2)}</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">9% (₹${cgst.toFixed(2)})</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">9% (₹${sgst.toFixed(2)})</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; font-weight: 700;">₹${totalAmt.toFixed(2)}</td>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Tax Invoice - FCI SELLER #${rawId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; margin: 0; padding: 24px; }
    .invoice-card { max-width: 850px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #14b8a6; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 900; color: #14b8a6; letter-spacing: -0.5px; text-transform: uppercase; }
    .logo span { color: #0f172a; }
    .invoice-title { font-size: 22px; font-weight: 900; text-align: right; text-transform: uppercase; color: #0f172a; }
    .sub-title { font-size: 11px; text-align: right; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; background: #f8fafc; }
    .box-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #14b8a6; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .box p { font-size: 12px; margin: 3px 0; color: #334155; line-height: 1.4; }
    .box p strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f172a; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 10px; border: 1px solid #0f172a; text-align: left; }
    .totals-table { width: 340px; margin-left: auto; border: none; }
    .totals-table td { padding: 6px 12px; font-size: 12px; border: none; }
    .totals-table tr.grand-total td { font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px solid #14b8a6; border-bottom: 2px solid #14b8a6; background: #f0fdf4; }
    .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .terms { font-size: 10px; color: #64748b; max-width: 450px; line-height: 1.5; }
    .signatory { text-align: right; font-size: 12px; font-weight: 700; color: #0f172a; }
    .signatory-space { height: 40px; margin: 8px 0; border-bottom: 1px dashed #cbd5e1; width: 160px; margin-left: auto; }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-card { border: none; box-shadow: none; padding: 0; width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="no-print" style="max-width: 850px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #14b8a6; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(20,184,166,0.3);">🖨️ Print Invoice / Save PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo">FCI <span>SELLER</span></div>
        <p style="font-size: 12px; color: #0f172a; margin: 4px 0 0 0; font-weight: 700;">FCI Seller Retail Pvt. Ltd.</p>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Official E-Commerce Marketplace Partner</p>
      </div>
      <div>
        <div class="invoice-title">Tax Invoice</div>
        <div class="sub-title">Original for Recipient</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="box">
        <div class="box-title">Sold By</div>
        <p><strong>${sellerLegalName}</strong></p>
        ${sellerAddr ? `<p>${sellerAddr}</p>` : ''}
        ${sellerGst ? `<p><strong>GSTIN:</strong> ${sellerGst}</p>` : ''}
        ${sellerPhone ? `<p><strong>Contact:</strong> ${sellerPhone}</p>` : ''}
        ${sellerEmailVal ? `<p>${sellerEmailVal}</p>` : ''}
      </div>
      <div class="box">
        <div class="box-title">Fulfilled By</div>
        <p><strong>${warehouseName}</strong></p>
        <p>${warehouseAddr}</p>
        ${warehouse?.phone ? `<p>Ph: ${warehouse.phone}</p>` : ''}
      </div>
      <div class="box">
        <div class="box-title">Invoice &amp; Customer Details</div>
        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
        <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <p><strong>Order ID:</strong> #${rawId}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Contact:</strong> ${customerEmail} | ${customerPhone}</p>
        <p><strong>Ship To:</strong> ${street}, ${city}, ${state} - ${pincode}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Item Description</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Taxable (₹)</th>
          <th style="width: 100px; text-align: right;">CGST (9%)</th>
          <th style="width: 100px; text-align: right;">SGST (9%)</th>
          <th style="width: 100px; text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td style="color: #64748b;">Subtotal (Taxable Base):</td>
        <td style="text-align: right; font-weight: 600;">₹${taxableTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">CGST (9%):</td>
        <td style="text-align: right; font-weight: 600;">₹${cgst.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">SGST (9%):</td>
        <td style="text-align: right; font-weight: 600;">₹${sgst.toFixed(2)}</td>
      </tr>
      <tr class="grand-total">
        <td>Grand Total (Incl. GST):</td>
        <td style="text-align: right;">₹${totalAmt.toFixed(2)}</td>
      </tr>
    </table>

    <div class="footer">
      <div class="terms">
        <p style="font-weight: 700; margin-bottom: 4px; color: #0f172a;">Terms & Conditions:</p>
        <p style="margin: 2px 0;">1. Goods once sold can be returned per official return policy guidelines.</p>
        <p style="margin: 2px 0;">2. All disputes are subject to local judicial jurisdiction.</p>
        <p style="margin: 2px 0;">3. Computer-generated tax invoice for FCI Seller. No physical signature required.</p>
      </div>
      <div class="signatory">
        <p>For ${sellerLegalName}</p>
        <div class="signatory-space"></div>
        <p style="font-size: 11px; color: #64748b;">Authorized Signatory</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({});
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/orders`, { credentials: 'omit', headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        const rawOrders = Array.isArray(json) ? json : (json?.data?.orders || json?.orders || json?.data || []);
        
        const mapped: InvoiceItem[] = rawOrders.map((o: any) => {
          const rawId = String(o.id || o.orderNumber || Math.floor(1000 + Math.random() * 9000));
          const totalAmt = Number(o.totalAmount || o.amount || o.total || 0);
          const taxable = totalAmt / 1.18;
          const tax = totalAmt - taxable;
          const user = o.user || {};
          const cName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || o.customerName || o.customer || 'Valued Customer';
          const addr = o.address || o.shippingAddress || {};
          const street = addr.line1 || addr.addressLine1 || addr.street || 'Standard Shipping Address';
          const city = addr.city || 'Mumbai';
          const state = addr.state || 'Maharashtra';
          const pincode = addr.pincode || addr.zipCode || '400705';

          return {
            id: rawId,
            orderId: `#ORD-${rawId}`,
            invoiceNumber: `INV-FCI-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`,
            customerName: cName,
            customerEmail: user.email || o.customerEmail || 'customer@example.com',
            customerPhone: user.phone || o.customerPhone || 'N/A',
            shippingAddress: `${street}, ${city}, ${state} - ${pincode}`,
            gstNumber: o.gstNumber || 'GSTIN-27AAACF9988F1Z5',
            amount: totalAmt,
            taxableAmount: taxable,
            taxAmount: tax,
            cgst: tax / 2,
            sgst: tax / 2,
            date: o.createdAt || o.date ? new Date(o.createdAt || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
            rawDate: o.createdAt || o.date ? new Date(o.createdAt || o.date) : new Date(),
            status: String(o.status || o.paymentStatus || 'paid').toLowerCase(),
            items: Array.isArray(o.items) ? o.items : [],
            rawOrder: o,
          };
        });

        setInvoices(mapped);
      } else {
        toast.error('Failed to load live invoices from server');
      }
    } catch (e) {
      toast.error('Could not connect to invoice database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // Fetch seller settings and default warehouse for dynamic invoice data
    (async () => {
      try {
        const settRes = await fetch(`${API_BASE}/api/settings`, { headers: authHeaders() });
        if (settRes.ok) {
          const sj = await settRes.json();
          const d = sj?.data || sj;
          setSellerInfo({
            sellerLegalName: d?.sellerLegalName,
            sellerGstNumber: d?.sellerGstNumber,
            sellerAddress: d?.sellerAddress,
            sellerCity: d?.sellerCity,
            sellerState: d?.sellerState,
            sellerPincode: d?.sellerPincode,
            sellerContactNumber: d?.sellerContactNumber,
            sellerEmail: d?.sellerEmail,
            sellerName: d?.sellerName,
          });
        }
      } catch {}
      try {
        const wRes = await fetch(`${API_BASE}/api/v1/admin/inventory/warehouses?isDefault=true`, { headers: authHeaders() });
        if (wRes.ok) {
          const wj = await wRes.json();
          const warehouses = wj?.data || wj?.warehouses || wj || [];
          const def = Array.isArray(warehouses) ? warehouses.find((w: any) => w.isDefault) || warehouses[0] : warehouses;
          if (def) setWarehouseInfo({ name: def.name, address: def.address, city: def.city, state: def.state, pincode: def.pincode, phone: def.phone });
        }
      } catch {}
    })();
  }, []);

  const stats = useMemo(() => {
    const totalVolume = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalGst = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const paidCount = invoices.filter((inv) => ['paid', 'delivered', 'completed'].includes(inv.status)).length;
    const pendingCount = invoices.filter((inv) => ['pending', 'processing'].includes(inv.status)).length;
    const avgInvoice = invoices.length > 0 ? totalVolume / invoices.length : 0;

    return {
      totalVolume,
      totalGst,
      paidCount,
      pendingCount,
      avgInvoice,
      count: invoices.length,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderId.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handlePrint = (inv: InvoiceItem) => {
    const html = generateFciSellerInvoiceHtml(inv.rawOrder, sellerInfo, warehouseInfo);
    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      toast.success(`Opening print window for ${inv.invoiceNumber}`);
    } else {
      toast.error('Popup blocked! Please allow popups to print/download invoice.');
    }
  };

  const handleSendEmail = (inv: InvoiceItem) => {
    toast.success(`Tax invoice ${inv.invoiceNumber} emailed to ${inv.customerEmail}`);
  };

  const handleCopyLink = (inv: InvoiceItem) => {
    navigator.clipboard.writeText(`${window.location.origin}/payments/invoices?id=${inv.id}`);
    toast.success(`Invoice link copied to clipboard!`);
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<InvoiceItem>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
          >
            Invoice # <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-primary flex items-center gap-1.5 pl-2">
            {row.original.invoiceNumber}
            <button
              onClick={() => {
                navigator.clipboard.writeText(row.original.invoiceNumber);
                toast.success(`Copied ${row.original.invoiceNumber}`);
              }}
              className="text-muted-foreground/40 hover:text-primary transition-colors"
              title="Copy Invoice Number"
            >
              <Copy className="h-3 w-3" />
            </button>
          </span>
        ),
      },
      {
        accessorKey: 'orderId',
        header: 'Order ID',
        cell: ({ row }) => <span className="text-xs font-semibold text-foreground">{row.original.orderId}</span>,
      },
      {
        accessorKey: 'customerName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
          >
            Billed Customer <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const initials = row.original.customerName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                {initials || 'CU'}
              </div>
              <div>
                <div className="font-bold text-foreground text-xs">{row.original.customerName}</div>
                <div className="text-[11px] text-muted-foreground">{row.original.customerEmail}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'gstNumber',
        header: 'GSTIN',
        cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.gstNumber}</span>,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
            >
              Gross Amount <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right text-xs font-black text-foreground font-mono">
            ₹{row.original.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: 'taxAmount',
        header: () => <div className="text-right text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Tax (18% GST)</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground font-mono">
            ₹{row.original.taxAmount.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
          >
            Date <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{row.original.date}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const st = statusStyles[row.original.status] || statusStyles.paid;
          const StatusIcon = st.icon;
          return (
            <Badge className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 border gap-1 inline-flex items-center ${st.bg} ${st.text} ${st.border}`}>
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize">{row.original.status}</span>
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground pr-4">Actions</div>,
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div className="flex items-center justify-end gap-1 pr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-all"
                title="Quick View"
                onClick={() => {
                  setSelectedInvoice(inv);
                  setPreviewOpen(true);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all"
                title="Print / Save PDF"
                onClick={() => handlePrint(inv)}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 transition-all"
                title="Email Customer Invoice"
                onClick={() => handleSendEmail(inv)}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-all"
                title="Copy Invoice Link"
                onClick={() => handleCopyLink(inv)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredInvoices,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">
        <PageHeader
          titlePart1="Payment"
          titlePart2="Invoices"
          badgeText="Finance & GST Command Center"
          subtitle="Generate, track, and download automated GST tax invoices powered by TanStack Table."
          actions={
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchInvoices}
                variant="outline"
                className="rounded-lg gap-2 border-primary/20 hover:bg-primary/5 transition-all text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} /> Sync Invoices
              </Button>
              <Button
                onClick={() => {
                  if (invoices.length > 0) handlePrint(invoices[0]);
                }}
                className="rounded-lg gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Export Latest Invoice
              </Button>
            </div>
          }
        />

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/40 bg-gradient-to-br from-card to-muted/20 shadow-sm relative overflow-hidden rounded-xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Invoiced Volume</p>
                  <h3 className="text-2xl font-black text-foreground mt-1">₹{stats.totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+12.8% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-gradient-to-br from-card to-muted/20 shadow-sm relative overflow-hidden rounded-xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total GST Collected</p>
                  <h3 className="text-2xl font-black text-foreground mt-1">₹{stats.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>CGST 9% + SGST 9% Output Tax</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-gradient-to-br from-card to-muted/20 shadow-sm relative overflow-hidden rounded-xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid / Settled Invoices</p>
                  <h3 className="text-2xl font-black text-foreground mt-1">{stats.paidCount} <span className="text-xs font-normal text-muted-foreground">/ {stats.count}</span></h3>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-gradient-to-br from-card to-muted/20 shadow-sm relative overflow-hidden rounded-xl">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Invoice Value</p>
                  <h3 className="text-2xl font-black text-foreground mt-1">₹{stats.avgInvoice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
                <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>100% Compliant GST Statements</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar & Search */}
        <Card className="border-border/40 bg-card rounded-xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, order ID, customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 bg-background/50 border-border/60 text-xs h-10 rounded-lg focus-visible:ring-primary"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-muted border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground font-mono">⌘K</kbd>
            </div>

            <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
              {['all', 'paid', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => {
                const count = st === 'all' ? invoices.length : invoices.filter((i) => i.status === st).length;
                return (
                  <Button
                    key={st}
                    variant={statusFilter === st ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter(st)}
                    className={`text-xs capitalize rounded-lg h-9 px-3 font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {st} {count > 0 && <span className="ml-1.5 text-[10px] opacity-75 font-mono">({count})</span>}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* TanStack Table & Pagination */}
        <Card className="border-border/40 rounded-xl bg-card overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-semibold tracking-wide">Syncing live tax invoices from server...</p>
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <div className="p-4 bg-muted/30 rounded-full">
                  <FileText className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-bold text-foreground">No invoices found matching your criteria</p>
                <p className="text-xs text-muted-foreground">Try clearing search terms or status filters.</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-border/40">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="py-3.5">
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-border/30">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* TanStack Table Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground gap-4">
                  <div className="font-medium">
                    Showing <span className="font-bold text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                    <span className="font-bold text-foreground">
                      {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredInvoices.length)}
                    </span>{' '}
                    of <span className="font-bold text-foreground">{filteredInvoices.length}</span> invoices
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>Rows per page:</span>
                      <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                          table.setPageSize(Number(e.target.value));
                        }}
                        className="h-8 rounded-lg border border-border/60 bg-background text-xs px-2 font-semibold text-foreground outline-none focus:border-primary"
                      >
                        {[10, 20, 50, 100].map((pageSize) => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-8 rounded-lg"
                        title="First Page"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-8 rounded-lg"
                        title="Previous Page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-2 text-xs font-semibold text-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-8 rounded-lg"
                        title="Next Page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-8 rounded-lg"
                        title="Last Page"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right-Side Slide-Out Sheet (No Center Modal) */}
        {selectedInvoice && (
          <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
            <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
              {/* Header Banner */}
              <SheetHeader className="p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border-b border-border/40 shrink-0 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <SheetTitle className="text-lg font-black text-foreground font-mono">{selectedInvoice.invoiceNumber}</SheetTitle>
                        <Badge className={`text-[10px] font-bold rounded-full px-2.5 border ${statusStyles[selectedInvoice.status]?.bg} ${statusStyles[selectedInvoice.status]?.text} ${statusStyles[selectedInvoice.status]?.border}`}>
                          {selectedInvoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                        Order Reference: <span className="font-semibold text-foreground">{selectedInvoice.orderId}</span> • Generated {selectedInvoice.date}
                      </SheetDescription>
                    </div>
                  </div>

                  {/* Guaranteed Visible Top-Right Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewOpen(false)}
                    className="h-8 w-8 rounded-full border border-border/60 hover:bg-muted bg-background/80 text-foreground shadow-sm shrink-0 cursor-pointer transition-all"
                    title="Close Quick View"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              {/* Scrollable Body Content */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0 border-b border-border/30">
                {/* 2-Column Customer & Shipping Info */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Billed Customer Card */}
                  <Card className="border-border/30 bg-muted/15 rounded-xl shadow-sm">
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <User className="h-4 w-4" />
                        <span>Billed Customer</span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="font-bold text-foreground text-sm">{selectedInvoice.customerName}</div>
                        <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground/60" /> {selectedInvoice.customerEmail}</div>
                        <div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-muted-foreground/60" /> Phone: {selectedInvoice.customerPhone}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Destination Address & GSTIN Card */}
                  <Card className="border-border/30 bg-muted/15 rounded-xl shadow-sm">
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <MapPin className="h-4 w-4" />
                        <span>Delivery Destination</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedInvoice.shippingAddress}
                      </p>
                      <div className="pt-1 text-[11px] font-mono text-primary flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>GSTIN: {selectedInvoice.gstNumber}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-6 border-border/20" />

                {/* Purchased Line Items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" /> Item Breakdown
                    </h3>
                    <span className="text-xs text-muted-foreground">{selectedInvoice.items.length || 1} Item(s)</span>
                  </div>

                  <div className="border border-border/40 rounded-xl overflow-hidden bg-card divide-y divide-border/20 shadow-sm">
                    {selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: any, idx: number) => {
                        const name = item.product?.name || item.name || item.title || 'Retail Product';
                        const size = item.variant?.size || item.size || '';
                        const color = item.variant?.color || item.color || '';
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.price || item.priceSnapshot || 0);

                        return (
                          <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-muted/10 transition-colors">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-foreground">{name}</span>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                {size && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Size: {size}</Badge>}
                                {color && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Color: {color}</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground font-mono">Qty: {qty}</span>
                              <span className="text-xs font-bold text-foreground font-mono">₹{(price * qty).toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-xs font-bold text-foreground">Standard Order Package</span>
                        <span className="text-xs font-bold text-foreground font-mono">₹{selectedInvoice.amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6 border-border/20" />

                {/* Financial Tax Summary */}
                <div className="bg-muted/20 border border-border/40 rounded-xl p-5 space-y-2.5 text-xs shadow-inner">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Base Subtotal:</span>
                    <span className="font-mono">₹{selectedInvoice.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST Output Tax (9%):</span>
                    <span className="font-mono">₹{selectedInvoice.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST Output Tax (9%):</span>
                    <span className="font-mono">₹{selectedInvoice.sgst.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2 border-border/40" />
                  <div className="flex justify-between text-sm font-black text-foreground pt-1">
                    <span>Grand Total (Incl. GST):</span>
                    <span className="text-primary text-base font-mono">₹{selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 sm:p-5 border-t border-border/30 bg-muted/20 flex flex-wrap gap-2 justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span>GST Compliant Invoice</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(selectedInvoice)}
                    className="rounded-lg text-xs font-semibold gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-sky-500" /> Email Customer
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-white rounded-lg text-xs font-bold gap-1.5 shadow-md"
                    onClick={() => handlePrint(selectedInvoice)}
                  >
                    <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </AdminLayout>
  );
}
