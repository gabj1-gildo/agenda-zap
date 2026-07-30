import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  
  if (v.length === 0) return "";
  
  if (v === "5" || v === "55") {
    // allow user to type 55 manually
  } else if (!v.startsWith("55")) {
    v = "55" + v;
  }

  if (v.length <= 2) return `+${v}`;
  if (v.length <= 4) return `+${v.slice(0, 2)} (${v.slice(2)}`;
  if (v.length <= 5) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4)}`;
  
  // Landline (12 digits total with 55)
  if (v.length === 12) {
    return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 8)}-${v.slice(8, 12)}`;
  }
  
  if (v.length <= 9) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 5)} ${v.slice(5)}`;
  if (v.length <= 13) return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 5)} ${v.slice(5, 9)}-${v.slice(9)}`;
  
  return `+${v.slice(0, 2)} (${v.slice(2, 4)}) ${v.slice(4, 5)} ${v.slice(5, 9)}-${v.slice(9, 13)}`;
}

export function formatCPF(value: string | null | undefined): string {
  if (!value) return "";
  const v = value.replace(/\D/g, "");
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`;
}
