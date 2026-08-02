'use client';
import { API_BASE } from '@/lib/api';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  MoreVertical,
  Send,
  Trash2,
  Bell,
  Tag,
  ShoppingBag,
  Users,
  Calendar,
  CheckCircle2,
  Upload,
  Clock,
  Radio,
  Target,
  Sparkles,
  Info,
  Smartphone,
  Eye,
  AlertTriangle,
  Globe,
  EyeOff,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function normalizeNotification(raw: any) {
  return {
    id: raw.id || raw._id || String(Math.random()),
    title: raw.title || 'System Notification',
    message: raw.message || raw.body || '',
    type: raw.type || 'general',
    sendToAll: raw.sendToAll ?? true,
    targetUsers: Array.isArray(raw.targetUsers) ? raw.targetUsers : [],
    isSent: raw.isSent !== undefined ? raw.isSent : (raw.status === 'sent'),
    sentAt: raw.sentAt ? new Date(raw.sentAt).toLocaleString() : raw.createdAt ? new Date(raw.createdAt).toLocaleString() : '',
  };
}

const notificationTypes = {
  offer: { label: 'Offer', icon: Tag, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  coupon: { label: 'Coupon', icon: Tag, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  order: { label: 'Order Update', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  general: { label: 'General', icon: Bell, color: 'bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20' },
};

export default function NotificationsPage() {
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  const [formData, setFormData] = useState({ title: '', type: 'general', message: '', link: '', targetUsers: '' });
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load notifications');
      const raw = json.data ?? json.notifications ?? json ?? [];
      setNotificationsList(Array.isArray(raw) ? raw.map(normalizeNotification) : []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      title: formData.title,
      type: formData.type,
      message: formData.message,
      sendToAll: sendToAll,
      targetUsers: sendToAll ? [] : formData.targetUsers.split(',').map(u => u.trim()).filter(Boolean),
      isSent: false,
    };
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      if (res.ok) { await fetchNotifications(); }
      else { setNotificationsList(prev => [normalizeNotification({ ...body, id: String(Date.now()) }), ...prev]); }
    } catch { setNotificationsList(prev => [normalizeNotification({ ...body, id: String(Date.now()) }), ...prev]); }
    setFormData({ title: '', type: 'general', message: '', link: '', targetUsers: '' });
    setSendToAll(true);
    setIsAddOpen(false);
  };

  const handleSendNotification = async (id: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleString();
    setNotificationsList(prev =>
      prev.map(n => n.id === id ? { ...n, isSent: true, sentAt: formattedDate } : n)
    );
    setSelectedNotification((prev: any) => prev && prev.id === id ? { ...prev, isSent: true, sentAt: formattedDate } : prev);
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/send`, { method: 'POST', headers: authHeaders() });
    } catch {}
  };

  const handleDeleteNotification = async (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
    setSelectedNotification(null);
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {}
  };


  const filteredNotifications = useMemo(() => {
    return notificationsList.filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notificationsList, searchQuery]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const notificationColumns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'message', header: 'Message' },
    { accessorKey: 'isSent', header: 'Status' },
    { accessorKey: 'sentAt', header: 'Sent At' },
  ], []);

  const notificationTable = useReactTable({
    data: filteredNotifications,
    columns: notificationColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const stats = useMemo(() => {
    const totalCount = notificationsList.length;
    const sentCount = notificationsList.filter((n) => n.isSent).length;
    const pendingCount = totalCount - sentCount;
    const broadcastCount = notificationsList.filter((n) => n.sendToAll).length;
    return {
      totalCount,
      sentCount,
      pendingCount,
      broadcastCount
    };
  }, [notificationsList]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          titlePart1="Notification"
          titlePart2="Broadcasting"
          badgeText="Notifications Command Center"
          subtitle="Send push announcements, trigger user-segment alerts, and track system broadcasts."
          actions={
            <Button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-primary hover:bg-primary/95 text-white flex items-center gap-2 cursor-pointer h-10 shadow-sm">
              <Plus className="h-4 w-4" /> Send Notification
            </Button>
          }
        />

        {/* Premium KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-[#14b8a6]/5 to-[#0d9488]/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Broadcasts</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalCount} Drafts</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">{stats.sentCount} sent alerts successfully</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sent Alerts</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight text-emerald-500">{stats.sentCount} Completed</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Dispatched to target endpoints</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Dispatch</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight text-amber-500">{stats.pendingCount} Drafts</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Awaiting click send trigger</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/5 to-indigo-500/5 blur-xl opacity-50 group-hover:scale-150 transition-all" />
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Broadcasts</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Radio className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.broadcastCount} Broadcasts</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">Alerts mapping all active users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Table Panel */}
        <Card className="border-border/30 rounded-xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-bold text-foreground">Dispatched Alerts Ledger</span>
              <div className="relative max-w-sm flex-1 group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search alerts by title or body..."
                  className="pl-11 bg-muted/20 border-border/40 hover:border-border/60 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]/20 h-10 rounded-lg transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-border/30 rounded-xl overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/20">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Alert Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">
                      <Button variant="ghost" onClick={() => notificationTable.getColumn('title')?.toggleSorting(notificationTable.getColumn('title')?.getIsSorted() === 'asc')} className="p-0 font-bold hover:bg-transparent text-xs uppercase tracking-wider">
                        Title <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Message Snippet</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Target Coverage</TableHead>
                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Sent Timestamp</TableHead>
                    <TableHead className="w-16 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground font-semibold">Loading notifications...</TableCell></TableRow>
                  ) : notificationTable.getRowModel().rows.length ? (
                    notificationTable.getRowModel().rows.map((row) => {
                    const notification = row.original;
                    const typeConfig = notificationTypes[notification.type as keyof typeof notificationTypes] || { label: 'General', icon: Bell, color: 'bg-muted text-foreground' };
                    const Icon = typeConfig.icon;
                    return (
                      <TableRow 
                        key={row.id}
                        onClick={() => setSelectedNotification(notification)}
                        className="hover:bg-muted/20 border-b border-border/20 transition-colors cursor-pointer group/row"
                      >
                        {/* Type */}
                        <TableCell className="py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                            <span>{typeConfig.label}</span>
                          </div>
                        </TableCell>

                        {/* Title */}
                        <TableCell className="py-4 font-semibold text-sm text-foreground">
                          {notification.title}
                        </TableCell>

                        {/* Message snippet */}
                        <TableCell className="py-4 text-xs text-muted-foreground font-normal max-w-[240px] truncate">
                          {notification.message}
                        </TableCell>

                        {/* Coverage target */}
                        <TableCell className="py-4 text-center">
                          {notification.sendToAll ? (
                            <Badge className="bg-primary/15 text-primary border-transparent rounded-full text-xs gap-1 py-0.5">
                              <Users className="h-3 w-3" /> All Customers
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-transparent rounded-full text-xs py-0.5">
                              {notification.targetUsers.length} Segmented
                            </Badge>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 text-center">
                          {notification.isSent ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-500/20 rounded-md px-2.5 py-0.5 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-500 dark:bg-amber-500/5 dark:text-amber-400 border-amber-500/20 rounded-md px-2.5 py-0.5 text-xs gap-1">
                              <Clock className="h-3 w-3" /> Pending Draft
                            </Badge>
                          )}
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className="py-4 text-sm text-muted-foreground font-normal">
                          {notification.sentAt ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span>{notification.sentAt}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 italic text-xs">Not sent</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <div className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors border-none bg-transparent">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                            } />
                            <DropdownMenuContent align="end" className="p-2 rounded-lg bg-card border border-border/40 w-36">
                              <DropdownMenuItem onClick={() => setSelectedNotification(notification)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                <Eye className="mr-2 h-4 w-4 text-[#14b8a6]" /> Preview UI
                              </DropdownMenuItem>
                              {!notification.isSent && (
                                <DropdownMenuItem onClick={() => handleSendNotification(notification.id)} className="p-2 rounded-md hover:bg-muted cursor-pointer text-sm font-medium">
                                  <Send className="mr-2 h-4 w-4 text-emerald-500" /> Broadcast Now
                                </DropdownMenuItem>
                              )}
                              <Separator className="my-1 border-border/10" />
                              <DropdownMenuItem onClick={() => handleDeleteNotification(notification.id)} className="p-2 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer text-sm font-medium">
                                <Trash2 className="mr-2 h-4 w-4 text-rose-500" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
                          <p className="text-sm font-semibold text-muted-foreground">No matching alerts found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredNotifications.length > 0 && (
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-muted/10 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {notificationTable.getFilteredRowModel().rows.length} of {filteredNotifications.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => notificationTable.previousPage()} disabled={!notificationTable.getCanPreviousPage()}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      {notificationTable.getState().pagination.pageIndex + 1} / {notificationTable.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => notificationTable.nextPage()} disabled={!notificationTable.getCanNextPage()}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Notification Drawer */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/30 backdrop-blur-xl">
            <SheetHeader className="p-6 border-b border-border/20">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Compose Notification
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Set promotion message alerts and configure targeted user segments.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateNotification} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Title</Label>
                  <Input 
                    id="title" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Summer discounts are here!" 
                    className="h-11 rounded-lg border-border/50 focus:border-primary transition-all" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="link" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Routing Link (Optional)</Label>
                    <Input 
                      id="link" 
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/shop/summer" 
                      className="h-11 rounded-lg border-border/50 focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="general">General Alert</option>
                      <option value="offer">Special Offer</option>
                      <option value="coupon">Coupon Discount</option>
                      <option value="order">Order Update</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Broadcast Message</Label>
                  <textarea
                    id="message"
                    required
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Compose notification text alert body..."
                    className="w-full p-3 rounded-lg border border-border/50 bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                {/* Segment Selection checkbox */}
                <div className="p-4 bg-muted/20 border border-border/30 rounded-xl space-y-3">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      id="sendToAll" 
                      checked={sendToAll} 
                      onChange={(e) => setSendToAll(e.target.checked)}
                      className="rounded border-border/60 text-primary accent-primary h-4.5 w-4.5 cursor-pointer"
                    />
                    <Label htmlFor="sendToAll" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                      Broadcast to all registered users
                    </Label>
                  </div>
                  {!sendToAll && (
                    <div className="space-y-1.5 pt-2 border-t border-border/20">
                      <Label htmlFor="targetUsers" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Segment Email Handles</Label>
                      <Input 
                        id="targetUsers"
                        value={formData.targetUsers}
                        onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                        placeholder="Enter email addresses separated by commas"
                        className="h-10 rounded-lg"
                      />
                      <p className="text-[10px] text-muted-foreground">Comma-separated email handles targeting specific customers</p>
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter className="p-6 bg-muted/15 border-t border-border/20 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-lg h-11 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg h-11 px-6 bg-primary text-white hover:bg-primary/95 flex items-center gap-1.5">
                  <Send className="h-4 w-4" /> Save Draft
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Quick View Details & Mock Smartphone Preview Drawer */}
        <Sheet open={selectedNotification !== null} onOpenChange={(open) => { if (!open) setSelectedNotification(null); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col h-full bg-card border-l border-l-border/30 backdrop-blur-xl">
            {selectedNotification && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xs bg-muted/60 border border-border/40 px-3 py-1 rounded-lg">
                        ID: {selectedNotification.id}
                      </span>
                      <Badge className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        selectedNotification.isSent
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {selectedNotification.isSent ? 'Sent' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {!selectedNotification.isSent && (
                        <Button 
                          variant="outline" 
                          className="h-9 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1" 
                          onClick={() => handleSendNotification(selectedNotification.id)}
                        >
                          <Send className="h-3.5 w-3.5" /> Send Alert
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        onClick={() => handleDeleteNotification(selectedNotification.id)}
                        title="Delete Alert"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedNotification.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">
                      {selectedNotification.isSent ? `Broadcast complete at ${selectedNotification.sentAt}` : 'Draft Campaign pending dispatch'}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-6 space-y-6 h-full overflow-y-auto">
                  {/* Mock Smartphone Push Notification render box */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 justify-center">
                      <Smartphone className="h-4 w-4" /> Live Mobile Display Simulation
                    </span>
                    {/* Mock phone container */}
                    <div className="w-full max-w-[340px] mx-auto rounded-3xl border-4 border-slate-700 bg-slate-900 p-3 shadow-xl relative aspect-[9/16] flex flex-col justify-start pt-12 overflow-hidden select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                      {/* Phone notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-20 flex items-center justify-between px-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <span className="w-12 h-1 bg-slate-800 rounded-full" />
                      </div>
                      
                      {/* Notification Lockscreen Alert Block */}
                      <div className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-lg text-white space-y-1.5 transition-colors cursor-pointer select-none">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
                              <Bell className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">FCI Seller</span>
                          </div>
                          <span className="text-[9px] text-white/50">now</span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold leading-tight">{selectedNotification.title}</p>
                          <p className="text-[10px] text-white/70 leading-normal line-clamp-2 font-light">{selectedNotification.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 border-border/10" />

                  {/* Targeted Segment information */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recipient Targeting</h3>
                    <Card className="border-border/30 bg-muted/10 rounded-lg">
                      <CardContent className="p-4 space-y-2 text-sm font-semibold">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-normal">Target Type</span>
                          <span>{selectedNotification.sendToAll ? 'All Registered Users' : 'Segmented Groups'}</span>
                        </div>
                        {!selectedNotification.sendToAll && (
                          <div className="pt-2 border-t border-border/10 space-y-1.5">
                            <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Recipients List</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedNotification.targetUsers.map((email: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="font-mono text-xs">{email}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
