"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// A listener system to allow triggering toasts from outside the React component tree (e.g. API clients)
type ToastListener = (toast: Omit<Toast, "id">) => string;
type DismissListener = (id: string) => void;

let globalAddToast: ToastListener | null = null;
let globalRemoveToast: DismissListener | null = null;
const recentToasts = new Set<string>();

const toastFn = (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
  if (globalAddToast) return globalAddToast({ type: "info", message, ...options });
  console.warn("ToastProvider not mounted");
  return "";
};

export const toast = Object.assign(toastFn, {
  success: (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
    if (globalAddToast) return globalAddToast({ type: "success", message, ...options });
    console.warn("ToastProvider not mounted");
    return "";
  },
  error: (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
    if (globalAddToast) return globalAddToast({ type: "error", message, ...options });
    console.warn("ToastProvider not mounted");
    return "";
  },
  warning: (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
    if (globalAddToast) return globalAddToast({ type: "warning", message, ...options });
    console.warn("ToastProvider not mounted");
    return "";
  },
  info: (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
    if (globalAddToast) return globalAddToast({ type: "info", message, ...options });
    console.warn("ToastProvider not mounted");
    return "";
  },
  loading: (message: string, options?: Omit<Toast, "id" | "type" | "message">) => {
    if (globalAddToast) return globalAddToast({ type: "loading", message, ...options });
    console.warn("ToastProvider not mounted");
    return "";
  },
  dismiss: (id: string) => {
    if (globalRemoveToast) globalRemoveToast(id);
  },
  handleApiResponse: (method: string, url: string, status: number, reqData?: any, resData?: any) => {
    const path = url?.toLowerCase() || '';
    const m = method?.toUpperCase() || 'GET';
    const isSuccess = status >= 200 && status < 300;

    // 1. Network / Server Errors
    if (status === 0 || status === 504) {
      toast.error("Network error. API Failed");
      return;
    }
    if (status === 500) {
      toast.error("Internal Server Error");
      return;
    }
    if (status === 400) {
      const errorMsg = resData?.message || resData?.error || "Bad Request";
      toast.error(errorMsg);
      return;
    }
    if (status === 422) {
      const errorMsg = resData?.message || resData?.error || "Validation Error";
      toast.error(errorMsg);
      return;
    }
    if (status === 401) {
      if (path.includes("/auth/login") || path.includes("/admin/login")) {
        toast.error(resData?.message || "Invalid email or password.");
      } else {
        if (typeof window !== 'undefined') {
          const hasToken = !!localStorage.getItem('auth_token');
          if (hasToken) {
            toast.error("Session expired.");
          }
          localStorage.removeItem('auth_token');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        } else {
          toast.error("Session expired.");
        }
      }
      return;
    }
    if (status === 403) {
      toast.error("Forbidden.");
      return;
    }

    // If request is GET, never show a toast — pages handle their own error states
    if (m === "GET") {
      return;
    }

    // Handle mutations (POST, PUT, DELETE, PATCH)
    if (isSuccess) {
      // AUTH
      if (path.includes("/auth/login") || path.includes("/admin/login")) {
        toast.success("Login successful.");
        return;
      }
      if (path.includes("/auth/logout") || path.includes("/admin/logout")) {
        toast.success("Logout successful.");
        return;
      }
      if (path.includes("/auth/register") || path.includes("/admin/register")) {
        toast.success("Register Success");
        return;
      }
      if (path.includes("/auth/change-password") || path.includes("/profile/password") || path.includes("/password/change")) {
        toast.success("Password Changed");
        return;
      }
      if (path.includes("/auth/reset-password") || path.includes("/password/reset")) {
        toast.success("Password Reset");
        return;
      }
      if (path.includes("/auth/forgot-password") || path.includes("/password/forgot")) {
        toast.success("Forgot Password Email Sent");
        return;
      }

      // CART
      if (path.includes("/cart")) {
        if (m === "POST") {
          toast.success("Added To Cart");
        } else if (m === "DELETE") {
          toast.success("Removed From Cart");
        } else {
          toast.success("Cart Updated");
        }
        return;
      }

      // WISHLIST
      if (path.includes("/wishlist")) {
        if (m === "POST") {
          toast.success("Added To Wishlist");
        } else if (m === "DELETE") {
          toast.success("Removed From Wishlist");
        }
        return;
      }

      // PRODUCTS
      if (path.includes("/products")) {
        if (path.includes("/restore")) {
          toast.success("Product Restored Successfully");
        } else if (path.includes("/status") || path.includes("/publish") || path.includes("/unpublish")) {
          toast.success("Product Status Updated");
        } else if (path.includes("/featured")) {
          toast.success("Product Featured");
        } else if (path.includes("/image") || path.includes("/gallery") || path.includes("/upload")) {
          if (m === "DELETE") {
            toast.success("Product Image Deleted");
          } else {
            toast.success("Product Image Uploaded");
          }
        } else if (m === "POST") {
          toast.success("Product created successfully.");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Product updated successfully.");
        } else if (m === "DELETE") {
          toast.success("Product deleted successfully.");
        }
        return;
      }

      // CATEGORY
      if (path.includes("/categories") || path.includes("/category")) {
        const hasParent = resData?.data?.parentId || resData?.parentId || reqData?.parentId || path.includes("/children") || path.includes("/sub");
        const entity = hasParent ? "Sub Category" : "Category";
        
        if (path.includes("/restore")) {
          toast.success(`${entity} Restored Successfully`);
        } else if (m === "POST") {
          toast.success(`${entity} Created`);
        } else if (m === "PUT" || m === "PATCH") {
          toast.success(`${entity} Updated`);
        } else if (m === "DELETE") {
          toast.success(`${entity} Deleted`);
        }
        return;
      }

      // SUB CATEGORIES (Fallback for separate routes if any)
      if (path.includes("/sub-categories") || path.includes("/subcategory")) {
        if (m === "POST") {
          toast.success("Sub Category Created");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Sub Category Updated");
        } else if (m === "DELETE") {
          toast.success("Sub Category Deleted");
        }
        return;
      }

      // TAXES
      if (path.includes("/taxes") || path.includes("/tax")) {
        if (m === "POST") {
          toast.success("Tax Rule Created");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Tax Rule Updated");
        } else if (m === "DELETE") {
          toast.success("Tax Rule Deleted");
        }
        return;
      }

      // PINCODES
      if (path.includes("/pincodes") || path.includes("/pincode") || path.includes("/shipments/pincode")) {
        if (m === "POST") {
          toast.success("Pincode Serviceability Added");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Pincode Serviceability Updated");
        } else if (m === "DELETE") {
          toast.success("Pincode Serviceability Deleted");
        }
        return;
      }

      // PACKAGING
      if (path.includes("/packaging") || path.includes("/package") || path.includes("/shipments/packaging")) {
        if (m === "POST") {
          toast.success("Packaging Size Added");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Packaging Size Updated");
        } else if (m === "DELETE") {
          toast.success("Packaging Size Deleted");
        }
        return;
      }

      // GATEWAYS & METHODS
      if (path.includes("/gateways") || path.includes("/gateway") || path.includes("/payment-methods") || path.includes("/payment/methods")) {
        if (m === "POST") {
          toast.success("Payment Method Configured");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Payment Method Updated");
        } else if (m === "DELETE") {
          toast.success("Payment Method Deleted");
        }
        return;
      }

      // BRANDS
      if (path.includes("/brands") || path.includes("/brand")) {
        if (path.includes("/logo")) {
          toast.success("Brand Logo Uploaded");
        } else if (path.includes("/banner")) {
          toast.success("Brand Banner Uploaded");
        } else if (m === "POST") {
          toast.success("Brand Created");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Brand updated successfully.");
        } else if (m === "DELETE") {
          toast.success("Brand Deleted");
        }
        return;
      }

      // COLLECTIONS
      if (path.includes("/collections") || path.includes("/collection")) {
        if (m === "POST") {
          toast.success("Collection Created");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Collection Updated");
        } else if (m === "DELETE") {
          toast.success("Collection Deleted");
        }
        return;
      }

      // CUSTOMERS
      if (path.includes("/customers") || path.includes("/users")) {
        if (path.includes("/block") || path.includes("/activate") || path.includes("/status")) {
          const isBlocked = reqData?.blocked || resData?.blocked || path.includes("/block");
          toast.success(isBlocked ? "Customer Blocked" : "Customer Activated");
        } else if (m === "POST") {
          toast.success("Customer created successfully.");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Customer Updated");
        } else if (m === "DELETE") {
          toast.success("Customer Deleted");
        }
        return;
      }

      // ORDERS
      if (path.includes("/orders") || path.includes("/order")) {
        if (m === "POST") {
          toast.success("Order Created");
        } else if (m === "PUT" || m === "PATCH") {
          const statusVal = reqData?.status || resData?.status;
          if (statusVal === "confirmed") {
            toast.success("Order confirmed successfully.");
          } else if (statusVal === "packed") {
            toast.success("Order Packed");
          } else if (statusVal === "shipped") {
            toast.success("Order Shipped");
          } else if (statusVal === "out_for_delivery") {
            toast.success("Out For Delivery");
          } else if (statusVal === "delivered") {
            toast.success("Order Delivered");
          } else if (statusVal === "cancelled") {
            toast.success("Order Cancelled");
          } else {
            toast.success("Order Updated");
          }
        }
        return;
      }

      // RETURNS
      if (path.includes("/returns") || path.includes("/return")) {
        if (m === "POST") {
          toast.success("Return Requested");
        } else if (m === "PUT" || m === "PATCH") {
          const statusVal = reqData?.status || resData?.status;
          if (statusVal === "approved") {
            toast.success("Return Approved");
          } else if (statusVal === "rejected") {
            toast.success("Return Rejected");
          } else if (statusVal === "replacement_approved") {
            toast.success("Replacement Approved");
          } else {
            toast.success("Return Updated");
          }
        }
        return;
      }

      // REFUNDS
      if (path.includes("/refunds") || path.includes("/refund")) {
        if (m === "POST") {
          toast.success("Refund Initiated");
        } else if (m === "PUT" || m === "PATCH") {
          const statusVal = reqData?.status || resData?.status;
          if (statusVal === "approved") {
            toast.success("Refund Approved");
          } else if (statusVal === "completed") {
            toast.success("Refund Completed");
          } else if (statusVal === "failed") {
            toast.error("Refund Failed");
          } else {
            toast.success("Refund processed.");
          }
        }
        return;
      }

      // PAYMENTS
      if (path.includes("/payments") || path.includes("/payment")) {
        if (m === "POST") {
          const isSuccessStatus = resData?.status === "success" || resData?.status === "completed";
          if (isSuccessStatus) {
            toast.success("Payment completed successfully.");
          } else if (resData?.status === "pending") {
            toast.warning("Payment Pending");
          } else if (resData?.status === "failed") {
            toast.error("Payment failed.");
          } else {
            toast.success("Payment Successful");
          }
        }
        return;
      }

      // SHIPPING
      if (path.includes("/shipments") || path.includes("/shipping") || path.includes("/charges")) {
        if (m === "POST") {
          toast.success("Shipment Created");
        } else if (m === "PUT" || m === "PATCH") {
          if (path.includes("/tracking")) {
            toast.success("Tracking Updated");
          } else {
            toast.success("Shipment Updated");
          }
        }
        return;
      }

      // COUPONS
      if (path.includes("/coupons") || path.includes("/coupon")) {
        if (path.includes("/apply")) {
          if (resData?.valid === false || resData?.status === "invalid") {
            toast.error("Coupon Invalid");
          } else if (resData?.status === "expired") {
            toast.warning("Coupon Expired");
          } else {
            toast.success("Coupon Applied");
          }
        } else if (path.includes("/remove")) {
          toast.success("Coupon Removed");
        } else if (m === "POST") {
          toast.success("Coupon Created");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Coupon Updated");
        } else if (m === "DELETE") {
          toast.success("Coupon Deleted");
        }
        return;
      }

      // BANNERS
      if (path.includes("/banners") || path.includes("/banner") || path.includes("/settings/banners")) {
        if (m === "POST") {
          toast.success("Banner Uploaded");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Banner Updated");
        } else if (m === "DELETE") {
          toast.success("Banner Deleted");
        }
        return;
      }

      // UPLOADS
      if (path.includes("/upload") || path.includes("/file")) {
        if (m === "POST") {
          toast.success("Image uploaded successfully.");
        } else if (m === "DELETE") {
          toast.success("Image deleted successfully.");
        }
        return;
      }

      // REVIEWS
      if (path.includes("/reviews") || path.includes("/review")) {
        if (m === "POST") {
          toast.success("Review Added");
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Review Updated");
        } else if (m === "DELETE") {
          toast.success("Review Deleted");
        }
        return;
      }

      // NOTIFICATIONS
      if (path.includes("/notifications") || path.includes("/notification")) {
        if (m === "POST") {
          toast.success("Notification Sent");
        }
        return;
      }

      // SETTINGS
      if (path.includes("/settings")) {
        if (path.includes("/language")) {
          toast.success("Language Updated");
        } else if (path.includes("/currency")) {
          toast.success("Currency Updated");
        } else if (path.includes("/theme")) {
          toast.success("Theme Updated");
        } else {
          toast.success("Settings Saved");
        }
        return;
      }

      // PROFILE
      if (path.includes("/profile") || path.includes("/user/profile")) {
        if (path.includes("/avatar")) {
          if (m === "DELETE") {
            toast.success("Avatar Deleted");
          } else {
            toast.success("Avatar Uploaded");
          }
        } else if (m === "PUT" || m === "PATCH") {
          toast.success("Profile updated successfully.");
        }
        return;
      }

      // Generic fallback for mutation success
      toast.success("Request completed successfully.");
    } else {
      // Mutation Failure
      const fallbackMsg = resData?.message || resData?.error || "Failed to complete request.";
      if (path.includes("/auth/login") || path.includes("/admin/login")) {
        toast.error("Login failed.");
      } else if (path.includes("/products")) {
        toast.error("Failed to update product.");
      } else if (path.includes("/upload")) {
        toast.error("Upload failed.");
      } else if (path.includes("/payment")) {
        toast.error("Payment failed.");
      } else if (path.includes("/coupons")) {
        toast.error("Coupon Invalid");
      } else {
        toast.error(fallbackMsg);
      }
    }
  }
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<Toast, "id">) => {
    // Prevent duplicate alerts in quick succession using fuzzy normalization
    const cleanMsg = (toastData.message || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const toastKey = `${toastData.type}:${cleanMsg}`;
    if (recentToasts.has(toastKey)) {
      return "";
    }
    recentToasts.add(toastKey);
    setTimeout(() => recentToasts.delete(toastKey), 2000);

    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => {
      // Don't add duplicate toast if a matching type and fuzzy message is already visible
      const isAlreadyVisible = prev.some(t => {
        const existingClean = (t.message || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return t.type === toastData.type && (existingClean === cleanMsg || (cleanMsg.length > 5 && existingClean.includes(cleanMsg)) || (existingClean.length > 5 && cleanMsg.includes(existingClean)));
      });

      if (isAlreadyVisible) {
        return prev;
      }

      const newToastList = [...prev, { id, ...toastData }];
      if (newToastList.length > 3) {
        return newToastList.slice(newToastList.length - 3); // Max 3 toasts at a time
      }
      return newToastList;
    });

    return id;
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    globalRemoveToast = removeToast;
    return () => {
      globalAddToast = null;
      globalRemoveToast = null;
    };
  }, [addToast, removeToast]);

  // Global window.fetch interceptor and Online/Offline Listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Connection Event Listeners
    const handleOnline = () => {
      toast.success("✓ Internet Connected");
    };
    const handleOffline = () => {
      toast.error("✕ Network error. Internet Disconnected");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 2. Fetch Interceptor
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || '';
      const options = args[1] || {};
      const method = (options.method || "GET").toUpperCase();
      let reqData = options.body;
      if (typeof reqData === "string") {
        try {
          reqData = JSON.parse(reqData);
        } catch (_) {}
      }

      const path = url?.toLowerCase() || '';
      const isApiCall = path.includes("/api/") || path.includes("api.fciseller.com") || (process.env.NEXT_PUBLIC_API_URL && path.includes(process.env.NEXT_PUBLIC_API_URL.toLowerCase()));
      if (!isApiCall) {
        return originalFetch.apply(this, args);
      }

      // Only show loading toast for slow mutating requests, e.g. upload, save settings, order creation, image deletes
      const isSlowMutation = method !== "GET" && (
        path.includes("/upload") ||
        path.includes("/settings") ||
        path.includes("/checkout") ||
        path.includes("/process") ||
        path.includes("/import") ||
        path.includes("/export")
      );
      
      let loadingToastId = "";
      if (isSlowMutation) {
        let loadingMsg = "Processing request...";
        if (path.includes("/upload")) loadingMsg = "ℹ Product is being uploaded...";
        else if (path.includes("/export") || path.includes("/import")) loadingMsg = "ℹ Processing request... Please wait...";
        loadingToastId = toast.loading(loadingMsg);
      }

      try {
        const response = await originalFetch.apply(this, args);
        const responseClone = response.clone();
        let resData: any = null;
        try {
          resData = await responseClone.json();
        } catch (_) {}

        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }

        toast.handleApiResponse(method, url, response.status, reqData, resData);
        return response;
      } catch (error) {
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
        // Only show network error toast for mutations, not background GETs
        if (method !== 'GET') {
          toast.handleApiResponse(method, url, 0, reqData, null);
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed z-[100] pointer-events-none flex flex-col gap-3 w-full max-w-sm px-4 py-6 top-0 right-0 md:top-4 md:right-4 left-0 mx-auto md:left-auto md:mx-0 items-center md:items-end"
    >
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const defaultDurations = {
    success: 3000,
    info: 3000,
    warning: 4000,
    error: 5000,
    loading: 0
  };

  const duration = t.duration !== undefined ? t.duration : defaultDurations[t.type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(t.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss, t.id]);

  const config = {
    success: {
      bg: "bg-[#f0fdfa]/95 dark:bg-[#022c2a]/95",
      border: "border-[#14b8a6]/25 dark:border-[#14b8a6]/40",
      titleText: "text-[#0f766e] dark:text-[#2dd4bf]",
      msgText: "text-[#115e59] dark:text-[#99f6e4]/80",
      icon: <CheckCircle className="h-5 w-5 text-[#14b8a6] shrink-0" />,
      title: t.title || "Success",
      progressBg: "bg-[#14b8a6]"
    },
    error: {
      bg: "bg-rose-50/95 dark:bg-rose-950/20",
      border: "border-rose-500/20 dark:border-rose-500/40",
      titleText: "text-rose-800 dark:text-rose-200",
      msgText: "text-rose-600/90 dark:text-rose-300/80",
      icon: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
      title: t.title || "Error",
      progressBg: "bg-rose-500"
    },
    warning: {
      bg: "bg-amber-50/95 dark:bg-amber-950/20",
      border: "border-amber-500/20 dark:border-amber-500/40",
      titleText: "text-amber-800 dark:text-amber-200",
      msgText: "text-amber-600/90 dark:text-amber-300/80",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
      title: t.title || "Warning",
      progressBg: "bg-amber-500"
    },
    info: {
      bg: "bg-sky-50/95 dark:bg-sky-950/20",
      border: "border-sky-500/20 dark:border-sky-500/40",
      titleText: "text-sky-800 dark:text-sky-200",
      msgText: "text-sky-600/90 dark:text-sky-300/80",
      icon: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
      title: t.title || "Information",
      progressBg: "bg-sky-500"
    },
    loading: {
      bg: "bg-muted/95 dark:bg-muted/30",
      border: "border-border/30 dark:border-border/50",
      titleText: "text-foreground",
      msgText: "text-muted-foreground",
      icon: <Loader2 className="h-5 w-5 text-[#14b8a6] animate-spin shrink-0" />,
      title: t.title || "Please Wait...",
      progressBg: "bg-[#14b8a6]"
    }
  }[t.type];

  const titleTextToShow = t.description ? t.message : (t.title || config.title);
  const messageTextToShow = t.description ? t.description : t.message;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={`pointer-events-auto relative w-full max-w-sm rounded-2xl border ${config.border} ${config.bg} p-4 shadow-xl backdrop-blur-md overflow-hidden flex flex-col gap-2`}
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 space-y-0.5 min-w-0">
          <p className={`text-sm font-bold tracking-tight ${config.titleText}`}>{titleTextToShow}</p>
          <p className={`text-xs ${config.msgText} leading-relaxed`}>{messageTextToShow}</p>
        </div>
        <button
          onClick={() => onDismiss(t.id)}
          aria-label="Dismiss toast"
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-muted/50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {t.action && (
        <div className="flex justify-end gap-2 pl-8">
          <button
            onClick={() => {
              t.action?.onClick();
              onDismiss(t.id);
            }}
            className="text-[11px] font-bold text-[#14b8a6] hover:text-[#0f766e] transition-colors bg-[#14b8a6]/10 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            {t.action.label}
          </button>
        </div>
      )}

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-muted-foreground/10">
          <div
            className={`h-full ${config.progressBg}`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
