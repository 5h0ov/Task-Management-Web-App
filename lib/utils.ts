// this file is used to merge tailwind classes with clsx for accesibility of tailwind classes in the project/radix-ui primitive components

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString();
}