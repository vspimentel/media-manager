import { toast } from "#components/ui/toast"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names and resolves conflicts using Tailwind's merge strategy.
 * @param {ClassValue[]} inputs - The class names to merge.
 * @returns The merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Displays a toast notification with the specified title, message, and type.
 * @param options - The toast notification options.
 * @param {string} options.title - The title of the toast notification.
 * @param {string} options.message - An optional message to display in the toast notification.
 * @param {"success" | "error" | "info"} options.type - The type of the toast notification. Defaults to "info".
 */
export function showToast({ title, message, type = "info" }: { title: string; message?: string; type?: "success" | "error" | "info" }) {
  toast.add({
    title,
    description: message,
    type,
  });
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function getYearFromDate(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.getFullYear().toString();
}


export function getCountryName(code: string, language = "en") {
  const parser = new Intl.DisplayNames([language], { type: "region" });

  try {
    return parser.of(code.toUpperCase());
  } catch {
    return "Unknown";
  }
}