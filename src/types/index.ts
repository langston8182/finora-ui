export type MoneyCts = number; // en centimes pour éviter les flottants

export interface User {
  id: string;
  email: string;
  fullName?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface FixedExpense {
  id: string;
  label: string;
  amountCts: MoneyCts;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export interface RecurringIncome {
  id: string;
  label: string;
  amountCts: MoneyCts;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export interface Expense {
  id: string;
  dateISO: string;
  label: string;
  amountCts: MoneyCts;
  categoryId: string;
  notes?: string;
}

export interface Income {
  id: string;
  dateISO: string;
  label: string;
  amountCts: MoneyCts;
  notes?: string;
}

export interface ForecastInput {
  monthISO: string;
  plannedExtras: Array<{
    label: string;
    amountCts: MoneyCts;
    dateISO?: string;
    type: 'expense' | 'income';
  }>;
}

export interface MonthSummary {
  monthISO: string;
  fixedExpensesTotalCts: MoneyCts;
  recurringIncomesTotalCts: MoneyCts;
  variableExpensesTotalCts: MoneyCts;
  otherIncomesTotalCts: MoneyCts;
  balanceCts: MoneyCts;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}