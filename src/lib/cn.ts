import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// The default tailwind-merge config already resolves our @theme tokens (text-gold vs text-sm,
// font-display vs font-semibold, bg-bg vs bg-surface), so no extendTailwindMerge is needed.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
