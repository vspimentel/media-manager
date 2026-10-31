import { toast } from "#components/ui/toast"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function showToast(title:string, message?: string, type: "success" | "error" | "info" = "info") {
  const id = toast.add({
    title: title,
    description: message,
    type: type,
  });
}