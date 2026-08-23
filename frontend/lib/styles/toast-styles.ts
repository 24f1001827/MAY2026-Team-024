import { toast as sonnerToast } from "sonner"

/**
 * Branded toast styles (Rastro navy/sky + semantic colors). Import `toast` from
 * here — not directly from `sonner` — so toasts get the project styling.
 */
const toastStyles = {
  success: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    border: "1px solid #16a34a",
  },
  error: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    border: "1px solid #dc2626",
  },
  warning: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#ffffff",
    border: "1px solid #d97706",
  },
  info: {
    // Rastro brand: navy → sky
    background: "linear-gradient(135deg, #0a3774 0%, #4d9fdb 100%)",
    color: "#ffffff",
    border: "1px solid #0a3774",
  },
} as const

type ToastOptions = {
  description?: string
  /** Optional button in the toast, e.g. to accept a suggested correction. */
  action?: { label: string; onClick: () => void }
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, { ...options, style: toastStyles.success }),
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, { ...options, style: toastStyles.error }),
  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, { ...options, style: toastStyles.warning }),
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, { ...options, style: toastStyles.info }),
}
