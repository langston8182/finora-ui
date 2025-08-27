import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Category, 
  FixedExpense, 
  RecurringIncome, 
  Expense, 
  Income,
  MoneyCts,
  MonthSummary 
} from '../types';
import { 
  categoriesApi, 
  fixedExpensesApi, 
  recurringIncomesApi, 
  expensesApi, 
  incomesApi,
  summaryApi 
} from '../services/api';

interface BudgetStore {
  // State
  categories: Category[];
  fixedExpenses: FixedExpense[];
  recurringIncomes: RecurringIncome[];
  expenses: Expense[];
  incomes: Income[];
  loading: boolean;
  error: string | null;
  apiFailure: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setApiFailure: (failure: boolean) => void;
  
  // Categories
  loadCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Fixed expenses
  loadFixedExpenses: () => Promise<void>;
  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => Promise<void>;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  
  // Recurring incomes
  loadRecurringIncomes: () => Promise<void>;
  addRecurringIncome: (income: Omit<RecurringIncome, 'id'>) => Promise<void>;
  updateRecurringIncome: (id: string, updates: Partial<RecurringIncome>) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
  
  // Variable expenses
  loadExpenses: (month: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // One-time incomes
  loadIncomes: (month: string) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  
  // Computed values
  getMonthSummary: (monthISO: string) => Promise<MonthSummary>;
  getExpenseLabels: () => string[];
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: [],
      fixedExpenses: [],
      recurringIncomes: [],
      expenses: [],
      incomes: [],
      loading: false,
      error: null,
      apiFailure: false,
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setApiFailure: (failure) => set({ apiFailure: failure }),
      
      // Categories
      loadCategories: async () => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, skipping categories load');
          return;
        }
        
        try {
          set({ loading: true, error: null });
          const response = await categoriesApi.getAll();
          console.log('Categories response from API:', response);
          const categories = response.items || [];
          console.log('Categories extracted:', categories);
          set({ 
            categories: Array.isArray(categories) ? categories.map(cat => ({
              id: cat._id,
              name: cat.name,
              color: cat.color
            })) : [], 
            loading: false 
          });
        } catch (error) {
          console.error('Error in loadCategories:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des catégories',
            loading: false,
            categories: [],
            apiFailure: true
          });
        }
      },
      
      addCategory: async (name, color) => {
        try {
          set({ loading: true, error: null });
          const newCategory = await categoriesApi.create({ name, color });
          set((state) => ({
            categories: [...state.categories, newCategory],
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie',
            loading: false 
          });
          throw error;
        }
      },
      
      updateCategory: async (id, updates) => {
        try {
          set({ loading: true, error: null });
          const updatedCategory = await categoriesApi.update(id, updates);
          set((state) => ({
            categories: state.categories.map(cat => 
              cat.id === id ? { ...cat, ...updatedCategory } : cat
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification de la catégorie',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteCategory: async (id) => {
        try {
          set({ loading: true, error: null });
          await categoriesApi.delete(id);
          set((state) => ({
            categories: state.categories.filter(cat => cat.id !== id),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la catégorie',
            loading: false 
          });
          throw error;
        }
      },
      
      // Fixed expenses
      loadFixedExpenses: async () => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, skipping fixed expenses load');
          return;
        }
        
        try {
          set({ loading: true, error: null });
          const response = await fixedExpensesApi.getAll();
          const fixedExpenses = response.items || [];
          set({ 
            fixedExpenses: Array.isArray(fixedExpenses) ? fixedExpenses.map(exp => ({
              id: exp._id,
              label: exp.label,
              amountCts: exp.amountCts,
              dayOfMonth: exp.dayOfMonth,
              startDate: exp.startDate,
              endDate: exp.endDate
            })) : [], 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des charges fixes',
            loading: false,
            fixedExpenses: [],
            apiFailure: true
          });
        }
      },
      
      addFixedExpense: async (expense) => {
        try {
          set({ loading: true, error: null });
          const newExpense = await fixedExpensesApi.create(expense);
          set((state) => ({
            fixedExpenses: [...state.fixedExpenses, newExpense],
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la création de la charge fixe',
            loading: false 
          });
          throw error;
        }
      },
      
      updateFixedExpense: async (id, updates) => {
        try {
          set({ loading: true, error: null });
          const updatedExpense = await fixedExpensesApi.update(id, updates);
          set((state) => ({
            fixedExpenses: state.fixedExpenses.map(exp => 
              exp.id === id ? { ...exp, ...updatedExpense } : exp
            ),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification de la charge fixe',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteFixedExpense: async (id) => {
        try {
          set({ loading: true, error: null });
          await fixedExpensesApi.delete(id);
          set((state) => ({
            fixedExpenses: state.fixedExpenses.filter(exp => exp.id !== id),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la charge fixe',
            loading: false 
          });
          throw error;
        }
      },
      
      // Recurring incomes
      loadRecurringIncomes: async () => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, skipping recurring incomes load');
          return;
        }
        
        try {
          set({ loading: true, error: null });
          const response = await recurringIncomesApi.getAll();
          const recurringIncomes = response.items || [];
          set({ 
            recurringIncomes: Array.isArray(recurringIncomes) ? recurringIncomes.map(inc => ({
              id: inc._id,
              label: inc.label,
              amountCts: inc.amountCts,
              dayOfMonth: inc.dayOfMonth,
              startDate: inc.startDate,
              endDate: inc.endDate
            })) : [], 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des revenus récurrents',
            loading: false,
            recurringIncomes: [],
            apiFailure: true
          });
        }
      },
      
      addRecurringIncome: async (income) => {
        try {
          set({ loading: true, error: null });
          const newIncome = await recurringIncomesApi.create(income);
          set((state) => ({
            recurringIncomes: [...state.recurringIncomes, newIncome],
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la création du revenu récurrent',
            loading: false 
          });
          throw error;
        }
      },
      
      updateRecurringIncome: async (id, updates) => {
        try {
          set({ loading: true, error: null });
          const updatedIncome = await recurringIncomesApi.update(id, updates);
          console.log('Updated income response:', updatedIncome);
          set((state) => ({
            recurringIncomes: state.recurringIncomes.map(inc => 
              inc.id === id ? { 
                ...inc, 
                ...updates,
                id: inc.id // Preserve the original ID
              } : inc
            ),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          console.error('Error updating recurring income:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification du revenu récurrent',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteRecurringIncome: async (id) => {
        try {
          set({ loading: true, error: null });
          await recurringIncomesApi.delete(id);
          set((state) => ({
            recurringIncomes: state.recurringIncomes.filter(inc => inc.id !== id),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression du revenu récurrent',
            loading: false 
          });
          throw error;
        }
      },
      
      // Variable expenses
      loadExpenses: async (month) => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, skipping expenses load');
          return;
        }
        
        try {
          set({ loading: true, error: null });
          const response = await expensesApi.getByMonth(month);
          const expenses = response.items || [];
          set({ 
            expenses: Array.isArray(expenses) ? expenses.map(exp => ({
              id: exp._id,
              dateISO: exp.dateISO,
              label: exp.label,
              amountCts: exp.amountCts,
              categoryId: exp.categoryId,
              notes: exp.notes
            })) : [], 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des dépenses',
            loading: false,
            expenses: [],
            apiFailure: true
          });
        }
      },
      
      addExpense: async (expense) => {
        try {
          set({ loading: true, error: null });
          console.log('Adding expense:', expense);
          const newExpense = await expensesApi.create(expense);
          console.log('Expense created:', newExpense);
          set((state) => ({
            expenses: [...state.expenses, newExpense],
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
          return newExpense;
        } catch (error) {
          console.error('Error in addExpense store:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la création de la dépense',
            loading: false 
          });
          throw error;
        }
      },
      
      updateExpense: async (id, updates) => {
        try {
          set({ loading: true, error: null });
          const updatedExpense = await expensesApi.update(id, updates);
          set((state) => ({
            expenses: state.expenses.map(exp => 
              exp.id === id ? { ...exp, ...updatedExpense } : exp
            ),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification de la dépense',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteExpense: async (id) => {
        try {
          set({ loading: true, error: null });
          await expensesApi.delete(id);
          set((state) => ({
            expenses: state.expenses.filter(exp => exp.id !== id),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la dépense',
            loading: false 
          });
          throw error;
        }
      },
      
      // One-time incomes
      loadIncomes: async (month) => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, skipping incomes load');
          return;
        }
        
        try {
          set({ loading: true, error: null });
          const response = await incomesApi.getByMonth(month);
          const incomes = response.items || [];
          set({ 
            incomes: Array.isArray(incomes) ? incomes.map(inc => ({
              id: inc._id,
              dateISO: inc.dateISO,
              label: inc.label,
              amountCts: inc.amountCts,
              notes: inc.notes
            })) : [], 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du chargement des recettes',
            loading: false,
            incomes: [],
            apiFailure: true
          });
        }
      },
      
      addIncome: async (income) => {
        try {
          set({ loading: true, error: null });
          const newIncome = await incomesApi.create(income);
          set((state) => ({
            incomes: [...state.incomes, newIncome],
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la création de la recette',
            loading: false 
          });
          throw error;
        }
      },
      
      updateIncome: async (id, updates) => {
        try {
          set({ loading: true, error: null });
          const updatedIncome = await incomesApi.update(id, updates);
          set((state) => ({
            incomes: state.incomes.map(inc => 
              inc.id === id ? { ...inc, ...updatedIncome } : inc
            ),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification de la recette',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteIncome: async (id) => {
        try {
          set({ loading: true, error: null });
          await incomesApi.delete(id);
          set((state) => ({
            incomes: state.incomes.filter(inc => inc.id !== id),
            loading: false
          }));
          // Trigger forecast refresh
          window.dispatchEvent(new CustomEvent('budgetDataChanged'));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la recette',
            loading: false 
          });
          throw error;
        }
      },
      
      // Computed values
      getMonthSummary: async (monthISO: string) => {
        const state = get();
        if (state.apiFailure) {
          console.log('API marked as failed, returning default summary');
          return {
            monthISO,
            fixedExpensesTotalCts: 0,
            recurringIncomesTotalCts: 0,
            variableExpensesTotalCts: 0,
            otherIncomesTotalCts: 0,
            balanceCts: 0,
          };
        }
        
        try {
          set({ loading: true, error: null });
          const summary = await summaryApi.getByMonth(monthISO);
          set({ loading: false });
          return summary;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du calcul du résumé',
            loading: false,
            apiFailure: true
          });
          // Return default summary instead of throwing
          return {
            monthISO,
            fixedExpensesTotalCts: 0,
            recurringIncomesTotalCts: 0,
            variableExpensesTotalCts: 0,
            otherIncomesTotalCts: 0,
            balanceCts: 0,
          };
        }
      },
      
      getExpenseLabels: () => {
        const state = get();
        return Array.from(new Set(state.expenses.map(exp => exp.label)))
          .sort((a, b) => {
            const aCount = state.expenses.filter(exp => exp.label === a).length;
            const bCount = state.expenses.filter(exp => exp.label === b).length;
            return bCount - aCount;
          });
      }
    }),
    {
      name: 'budget-storage',
      // Ne pas persister les données qui viennent de l'API
      partialize: (state) => ({
        // On peut garder quelques préférences utilisateur si nécessaire
      })
    }
  )
);