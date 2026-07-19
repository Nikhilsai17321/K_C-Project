export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function showToast(message: string, type: ToastType = "success") {
  const event = new CustomEvent("kisan-toast", { detail: { message, type } });
  window.dispatchEvent(event);
}
