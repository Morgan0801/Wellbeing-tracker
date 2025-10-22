import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'PPP') {
  return format(new Date(date), formatStr, { locale: fr });
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'HH:mm', { locale: fr });
}

export function getMoodEmoji(score: number): string {
  if (score <= 2) return '😢';
  if (score <= 4) return '😕';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
}

export function getMoodColor(score: number): string {
  if (score <= 2) return '#D32F2F';
  if (score <= 4) return '#F57C00';
  if (score <= 6) return '#FDD835';
  if (score <= 8) return '#9CCC65';
  return '#66BB6A';
}

export function getMoodLabel(score: number): string {
  if (score <= 2) return 'Très mal';
  if (score <= 4) return 'Pas bien';
  if (score <= 6) return 'Moyen';
  if (score <= 8) return 'Bien';
  return 'Très bien';
}
