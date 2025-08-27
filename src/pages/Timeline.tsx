import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, CreditCard, PiggyBank, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loading, LoadingCard } from '../components/ui/loading';
import { useBudgetStore } from '../store/budget';
import { useToast } from '../components/ui/use-toast';
import { formatCurrency, formatDate, getCurrentMonth } from '../lib/utils';

// Extend dayjs with required plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

type TransactionType = 'fixed-expense' | 'recurring-income' | 'variable-expense' | 'other-income';

interface TimelineItem {
  id: string;
  date: dayjs.Dayjs;
  label: string;
  amountCts: number;
  type: TransactionType;
  category?: string;
  notes?: string;
}

export function Timeline() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const { 
    fixedExpenses, 
    recurringIncomes, 
    expenses, 
    incomes, 
    categories,
    loadFixedExpenses,
    loadRecurringIncomes,
    loadExpenses,
    loadIncomes,
    loadCategories,
    error 
  } = useBudgetStore();
  const { toast } = useToast();
  
  // Load data on mount and when month changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadCategories(),
          loadFixedExpenses(),
          loadRecurringIncomes(),
          loadExpenses(selectedMonth),
          loadIncomes(selectedMonth)
        ]);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedMonth]);
  
  // Generate timeline items for the selected month
  const generateTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];
    const monthStart = dayjs(selectedMonth).startOf('month');
    const monthEnd = dayjs(selectedMonth).endOf('month');
    
    // Add fixed expenses
    fixedExpenses.forEach(expense => {
      const expenseDate = dayjs(`${selectedMonth}-${expense.dayOfMonth.toString().padStart(2, '0')}`);
      if (expenseDate.isBetween(monthStart, monthEnd, null, '[]') &&
          dayjs(expense.startDate).isSameOrBefore(expenseDate) &&
          (!expense.endDate || dayjs(expense.endDate).isSameOrAfter(expenseDate))) {
        items.push({
          id: `fixed-${expense.id}`,
          date: expenseDate,
          label: expense.label,
          amountCts: expense.amountCts,
          type: 'fixed-expense',
        });
      }
    });
    
    // Add recurring incomes
    recurringIncomes.forEach(income => {
      const incomeDate = dayjs(`${selectedMonth}-${income.dayOfMonth.toString().padStart(2, '0')}`);
      if (incomeDate.isBetween(monthStart, monthEnd, null, '[]') &&
          dayjs(income.startDate).isSameOrBefore(incomeDate) &&
          (!income.endDate || dayjs(income.endDate).isSameOrAfter(incomeDate))) {
        items.push({
          id: `recurring-${income.id}`,
          date: incomeDate,
          label: income.label,
          amountCts: income.amountCts,
          type: 'recurring-income',
        });
      }
    });
    
    // Add variable expenses
    expenses.forEach(expense => {
      if (dayjs(expense.dateISO).format('YYYY-MM') === selectedMonth) {
        const category = categories.find(cat => cat.id === expense.categoryId);
        items.push({
          id: `expense-${expense.id}`,
          date: dayjs(expense.dateISO),
          label: expense.label,
          amountCts: expense.amountCts,
          type: 'variable-expense',
          category: category?.name,
          notes: expense.notes,
        });
      }
    });
    
    // Add other incomes
    incomes.forEach(income => {
      if (dayjs(income.dateISO).format('YYYY-MM') === selectedMonth) {
        items.push({
          id: `income-${income.id}`,
          date: dayjs(income.dateISO),
          label: income.label,
          amountCts: income.amountCts,
          type: 'other-income',
          notes: income.notes,
        });
      }
    });
    
    return items.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  };
  
  const timelineItems = generateTimelineItems();
  const filteredItems = filterType === 'all' 
    ? timelineItems 
    : timelineItems.filter(item => item.type === filterType);
  
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'fixed-expense':
        return <CreditCard className="h-4 w-4" />;
      case 'recurring-income':
        return <PiggyBank className="h-4 w-4" />;
      case 'variable-expense':
        return <TrendingDown className="h-4 w-4" />;
      case 'other-income':
        return <TrendingUp className="h-4 w-4" />;
    }
  };
  
  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'fixed-expense':
        return 'text-purple-600 bg-purple-100';
      case 'recurring-income':
        return 'text-green-600 bg-green-100';
      case 'variable-expense':
        return 'text-red-600 bg-red-100';
      case 'other-income':
        return 'text-blue-600 bg-blue-100';
    }
  };
  
  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'fixed-expense':
        return 'Charge fixe';
      case 'recurring-income':
        return 'Revenu récurrent';
      case 'variable-expense':
        return 'Dépense variable';
      case 'other-income':
        return 'Autre recette';
    }
  };
  
  const getAmountColor = (type: TransactionType) => {
    return type === 'recurring-income' || type === 'other-income' 
      ? 'text-green-600' 
      : 'text-red-600';
  };
  
  // Group items by date
  const groupedItems = filteredItems.reduce((groups, item) => {
    const dateKey = item.date.format('YYYY-MM-DD');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, TimelineItem[]>);
  
  if (loading) {
    return <LoadingCard text="Chargement de la chronologie..." />;
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Erreur: {error}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chronologie</h1>
          <p className="text-gray-600 mt-1">
            Visualisez toutes vos transactions dans l'ordre chronologique
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">Tous les types</option>
            <option value="fixed-expense">Charges fixes</option>
            <option value="recurring-income">Revenus récurrents</option>
            <option value="variable-expense">Dépenses variables</option>
            <option value="other-income">Autres recettes</option>
          </select>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {dayjs(selectedMonth).format('MMMM YYYY')}
          </CardTitle>
          <CardDescription>
            {filteredItems.length} transaction{filteredItems.length > 1 ? 's' : ''} 
            {filterType !== 'all' && ` (${getTypeLabel(filterType as TransactionType)})`}
            {loading && <Loading size="sm" />}
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Timeline */}
      <div className="space-y-4">
        {Object.keys(groupedItems).length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune transaction pour cette période</p>
                <p className="text-sm mt-1">
                  {filterType !== 'all' 
                    ? `Aucune transaction de type "${getTypeLabel(filterType as TransactionType)}" trouvée`
                    : 'Commencez par ajouter des dépenses ou des revenus'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([dateKey, dayItems]) => (
            <Card key={dateKey}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dayjs(dateKey).format('dddd DD MMMM YYYY')}
                </CardTitle>
                <CardDescription>
                  {dayItems.length} transaction{dayItems.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{getTypeLabel(item.type)}</span>
                            {item.category && (
                              <>
                                <span>•</span>
                                <span>{item.category}</span>
                              </>
                            )}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-400 mt-1">{item.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className={`font-semibold ${getAmountColor(item.type)}`}>
                        {item.type === 'recurring-income' || item.type === 'other-income' ? '+' : '-'}
                        {formatCurrency(item.amountCts)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}