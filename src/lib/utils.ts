import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import { MoneyCts } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountCts: MoneyCts): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCts / 100);
}

export function formatDate(dateISO: string): string {
  return dayjs(dateISO).format('DD/MM/YYYY');
}

export function formatMonth(monthISO: string): string {
  return dayjs(monthISO).format('MMMM YYYY');
}

export function getCurrentMonth(): string {
  return dayjs().format('YYYY-MM');
}

export function getCurrentDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function parseCurrency(value: string): MoneyCts {
  // Gère les formats français (virgule) et anglais (point)
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  // Si on a une virgule, on la remplace par un point pour parseFloat
  const normalizedValue = cleanValue.replace(',', '.');
  const floatValue = parseFloat(normalizedValue);
  return isNaN(floatValue) ? 0 : Math.round(floatValue * 100);
}

export function getBalanceColor(balanceCts: MoneyCts): string {
  if (balanceCts < 0) return 'text-red-600';
  if (balanceCts < 20000) return 'text-orange-600'; // < 200€
  return 'text-green-600';
}