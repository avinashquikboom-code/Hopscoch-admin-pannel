'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Image as ImageIcon, 
  Settings, 
  Languages, 
  DollarSign, 
  BarChart3, 
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  CreditCard,
  Truck,
  LogOut,
  MapPin,
  Zap,
  FileText,
  RefreshCcw,
  Receipt,
  BarChart2,
  Box,
  Radio,
  SlidersHorizontal,
  Home,
  Palette,
  Ruler,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Menu item interface
interface SubItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubItem[];
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Catalog: true,
    Sales: false,
    Marketing: false,
    Analytics: false,
    Settings: true,
  });
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const getInitials = () => {
    if (!user) return 'AD';
    const f = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const l = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'AD';
  };

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const groups: MenuGroup[] = [
    {
      name: 'Catalog',
      icon: Package,
      items: [
        { name: 'Products', href: '/products' },
        { name: 'Varient', href: '/colors-sizes' },
        { name: 'Categories', href: '/categories' },
        { name: 'Sub Categories', href: '/sub-categories' },
        { name: 'Brands', href: '/brands' },
        { name: 'Collections', href: '/collections' },
        { name: 'Inventory', href: '/inventory' },
      ],
    },
    {
      name: 'Sales',
      icon: ShoppingBag,
      items: [
        { name: 'Orders', href: '/orders' },
        { name: 'Returns', href: '/returns' },
        { name: 'Customers', href: '/customers' },
        { name: 'Reviews', href: '/reviews' },
        { name: 'Coupons', href: '/coupons' },
      ],
    },
    {
      name: 'Marketing',
      icon: ImageIcon,
      items: [
        { name: 'Banners', href: '/banners' },
        { name: 'Notifications', href: '/notifications' },
      ],
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      items: [
        { name: 'Dashboard Analytics', href: '/dashboard' },
        { name: 'Reports', href: '/reports' },
      ],
    },
    {
      name: 'Shipping',
      icon: Truck,
      items: [
        { name: 'Dashboard', href: '/shipping' },
        { name: 'Partners', href: '/shipping/partners' },
        { name: 'Charges', href: '/shipping/charges' },
        { name: 'Zones', href: '/shipping/zones' },
        { name: 'Delivery Methods', href: '/shipping/delivery-methods' },
        { name: 'Pincode', href: '/shipping/pincode', icon: MapPin },
        { name: 'Free Shipping', href: '/shipping/free-shipping', icon: Zap },
        { name: 'COD Settings', href: '/shipping/cod' },
        { name: 'Packaging', href: '/shipping/packaging', icon: Box },
        { name: 'Tracking', href: '/shipping/tracking', icon: Radio },
        { name: 'Reports', href: '/shipping/reports', icon: BarChart2 },
        { name: 'Settings', href: '/shipping/settings', icon: SlidersHorizontal },
      ],
    },
    {
      name: 'Payments',
      icon: CreditCard,
      items: [
        { name: 'Dashboard', href: '/payments' },
        { name: 'Transactions', href: '/payments/transactions' },
        { name: 'Payment Methods', href: '/payments/methods' },
        { name: 'Gateway', href: '/payments/gateway' },
        { name: 'Refunds', href: '/payments/refunds', icon: RefreshCcw },
        { name: 'Invoices', href: '/payments/invoices', icon: FileText },
        { name: 'Taxes', href: '/payments/taxes', icon: Receipt },
        { name: 'Reports', href: '/payments/reports', icon: BarChart2 },
        { name: 'Analytics', href: '/payments/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/payments/settings', icon: SlidersHorizontal },
      ],
    },
    {
      name: 'Settings',
      icon: Settings,
      items: [
        { name: 'General Settings', href: '/settings', icon: Settings },
        { name: 'Languages & Currency', href: '/settings/languages', icon: Languages },
        { name: 'Integrations', href: '/settings/integrations', icon: SlidersHorizontal },
        { name: 'Reset Store Data', href: '/settings/reset', icon: Trash2 },
      ],
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 70 : 250 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 z-40 h-screen bg-background border-r border-border flex flex-col select-none"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border p-1">
                <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-xs font-bold text-foreground tracking-tight">
                FCI Seller
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mx-auto"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border p-1">
                <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <ScrollArea className="flex-1 px-3 py-4 space-y-1">
        {/* Direct Link - Dashboard */}
        <div className="space-y-1 mb-4">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              pathname === '/dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Collapsible Groups */}
        <div className="space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups[group.name];
            const isGroupActive = group.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'));
            const GroupIcon = group.icon;

            return (
              <div key={group.name} className="space-y-0.5">
                {/* Group Header Trigger */}
                <button
                  onClick={() => !collapsed && toggleGroup(group.name)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-left',
                    isGroupActive
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'cursor-default justify-center'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{group.name}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
                  )}
                </button>

                {/* Sub Items Accordion */}
                <AnimatePresence initial={false}>
                  {((isOpen && !collapsed) || (collapsed && isGroupActive)) && (
                    <motion.div
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className={cn("space-y-0.5 pl-2 mt-0.5", !collapsed ? "ml-4" : "ml-2")}>
                        {group.items.map((item) => {
                          const isActive = pathname === item.href;
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                                isActive
                                  ? 'text-primary bg-primary/5'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              )}
                            >
                              {ItemIcon && <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                              {!collapsed && <span>{item.name}</span>}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Admin Profile & Logout direct sections */}
        <div className="space-y-1 pt-4 mt-4 border-t border-border">
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              pathname === '/profile'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Admin Profile</span>}
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </ScrollArea>

      {/* Collapse Trigger when Collapsed */}
      {collapsed && (
        <div className="flex justify-center p-3 border-t border-border">
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User Info Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-black font-bold text-xs flex-shrink-0">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user ? `${user.firstName} ${user.lastName}`.trim() || 'Admin User' : 'Admin User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'admin@fciseller.com'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600', className)}>
      {children}
    </div>
  );
}
