import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short, URL-safe id without external deps. */
export function makeId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? "_" : ""}${time}${rand}`;
}

/** Mask an account/policy number, keeping the last 4 chars. */
export function maskIdentifier(value?: string): string {
  if (!value) return "";
  const v = value.replace(/\s+/g, "");
  if (v.length <= 4) return v;
  return `${"X".repeat(Math.max(2, v.length - 4))}${v.slice(-4)}`;
}

/** Format an Indian Rupee amount compactly (₹6,00,000). */
export function formatINR(amount?: number): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Days remaining until a date (negative = overdue). null if no date. */
export function daysUntil(date?: string | number | Date | null): number | null {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
