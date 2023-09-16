import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export function debounce<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
  let timeoutID: NodeJS.Timeout;
  return (...args: Parameters<F>) => {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    timeoutID = setTimeout(() => {
      func(...args)
    }, delay);
  }
}

export function trimNumber(num: number | string) {
  return Math.round(Number(num) * 100) / 100;
}

export const getBasisPointsMultiplier = (decimal: number | string) => {
  const decimalLength = decimal.toString().split('.')[1]?.length || 0

  return 10 ** decimalLength;
}

export const txt = {
  0: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-gray-100/60',
    bgAccent: 'bg-sky-500',
    textPrimary: 'text-gray-950',
    textSecondary: 'text-gray-500',
    textAccent: 'text-sky-500',
    button: 'bg-sky-500 hover:bg-sky-500/90 text-white',
    buttonSecondary: 'bg-slate-100 hover:bg-slate-100/90 text-black',
    border: 'border border-gray-500',
  },
  1: {
    bg: 'bg-slate-800',
    bgSecondary: 'bg-slate-900/60',
    bgAccent: 'bg-sky-600',
    textPrimary: 'text-slate-50',
    textSecondary: 'text-gray-600',
    textAccent: 'text-sky-600',
    button: 'bg-sky-500 hover:bg-sky-500/90 text-white',
    buttonSecondary: 'bg-slate-100 hover:bg-slate-100/90 text-black',
    border: 'border border-gray-600',
  },
  2: {
    bg: 'bg-zinc-900',
    bgSecondary: 'bg-zinc-900/60',
    bgAccent: 'bg-sky-800',
    textPrimary: 'text-zinc-200',
    textSecondary: 'text-zinc-600',
    textAccent: 'text-sky-800',
    button: 'bg-sky-500 hover:bg-sky-500/90 text-white',
    buttonSecondary: 'bg-slate-100 hover:bg-slate-100/90 text-black',
    border: 'border border-zinc-600',
  }
}

