import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS class names safely.
 * Standard Shadcn/ui pattern.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
