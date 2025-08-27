import React, { useState } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loading, LoadingCard } from '../components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { useBudgetStore } from '../store/budget';
import { forecastApi } from '../services/api';
import { formatCurrency, formatMonth, parseCurrency, getCurrentMonth } from '../lib/utils';
import dayjs from 'dayjs';

const extraSchema = z.object({
  label: z.string().min(1, 'Le libellé est obligatoire'),
  amount: z.string().min(1, 'Le montant est obligatoire'),
  date: z.string().optional(),
  type: z.enum(['expense', 'income']),
});

type ExtraForm = z.infer<typeof extraSchema>;

interface PlannedExtra {
  id: string;
  label: string;
  amountCts: number;
  dateISO?: string;
  type: 'expense' | 'income';
}

export function Forecast() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [plannedExtras, setPlannedExtras] = useState<PlannedExtra[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { error } = useBudgetStore();
  const { toast } = useToast();
  
  // Load forecast data
  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const data = await forecastApi.calculate({
          month: selectedMonth,
          plannedExtras: plannedExtras.map(extra => ({
            label: extra.label,
            amountCts: extra.amountCts,
            dateISO: extra.dateISO,
            type: extra.type,
          })),
        });
        setForecastData(data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le prévisionnel',
          variant: 'destructive',
        });
        // Set fallback data in case of error
        setForecastData({
          projectedBalanceCts: 0,
          components: {
            realizedExpensesCts: 0,
            realizedIncomesCts: 0,
            fixedRemainingCts: 0,
            recurringRemainingCts: 0,
            extrasExpenseCts: 0,
            extrasIncomeCts: 0,
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadForecast();
  }, [selectedMonth, plannedExtras]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExtraForm>({
    resolver: zodResolver(extraSchema),
    defaultValues: {
      type: 'expense',
    },
  });
  
  // Calculate forecast with planned extras
  const plannedExpensesCts = plannedExtras
    .filter(extra => extra.type === 'expense')
    .reduce((sum, extra) => sum + extra.amountCts, 0);
  
  const plannedIncomesCts = plannedExtras
    .filter(extra => extra.type === 'income')
    .reduce((sum, extra) => sum + extra.amountCts, 0);
    
  // Calculate values from API components
  const components = forecastData?.components || {};
  
  // Budget de base : directement fourni par l'API
  const baseBudgetCts = components.budgetBaseCts || 0;
  
  // Recettes prévues : ce qui est encore attendu ce mois-ci (récurrentes + extras income)
  const expectedIncomesCts = (components.recurringRemainingCts || 0) + (components.extrasIncomeCts || 0) + plannedIncomesCts;
  
  // Dépenses prévues : charges fixes pas encore tombées + extras expense
  const expectedExpensesCts = (components.fixedRemainingCts || 0) + (components.extrasExpenseCts || 0) + plannedExpensesCts;
  
  // Solde prévisionnel : solde final estimé à la fin du mois
  const projectedBalanceCts = (forecastData?.projectedBalanceCts || 0) + plannedIncomesCts - plannedExpensesCts;
  
  const onSubmit = (data: ExtraForm) => {
    const amountCts = parseCurrency(data.amount);
    
    const newExtra: PlannedExtra = {
      id: Date.now().toString(),
      label: data.label,
      amountCts,
      dateISO: data.date || undefined,
      type: data.type,
    };
    
    setPlannedExtras(prev => [...prev, newExtra]);
    reset();
    setShowForm(false);
    
    toast({
      title: 'Élément ajouté',
      description: `${data.label} - ${formatCurrency(amountCts)}`,
    });
  };
  
  const removeExtra = (id: string) => {
    setPlannedExtras(prev => prev.filter(extra => extra.id !== id));
  };
  
  const getBalanceColor = (balanceCts: number) => {
    if (balanceCts < 0) return 'text-red-600';
    if (balanceCts < 20000) return 'text-orange-600';
    return 'text-green-600';
  };
  
  if (loading && !forecastData) {
    return <LoadingCard text="Chargement du prévisionnel..." />;
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
          <h1 className="text-3xl font-bold text-gray-900">Prévisionnel</h1>
          <p className="text-gray-600 mt-1">
            Simulez votre budget avec des dépenses et recettes exceptionnelles
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Budget de base
                  </dt>
                  <dd className={`text-lg font-medium ${getBalanceColor(baseBudgetCts)}`}>
                    {formatCurrency(baseBudgetCts)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recettes prévues
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    +{formatCurrency(expectedIncomesCts)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Dépenses prévues
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    -{formatCurrency(expectedExpensesCts)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Solde prévisionnel
                  </dt>
                  <dd className={`text-lg font-medium ${getBalanceColor(projectedBalanceCts)}`}>
                    {formatCurrency(projectedBalanceCts)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Realized Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Recettes réalisées
            </CardTitle>
            <CardDescription>
              Ce qui a déjà été encaissé ce mois-ci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(components.realizedIncomesCts || 0)}
            </div>
            {(components.realizedIncomesCts || 0) === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Aucune recette enregistrée pour le moment
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
              Dépenses réalisées
            </CardTitle>
            <CardDescription>
              Ce qui a déjà été dépensé ce mois-ci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(components.realizedExpensesCts || 0)}
            </div>
            {(components.realizedExpensesCts || 0) === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Aucune dépense enregistrée pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Extra Form */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Éléments exceptionnels</CardTitle>
              <CardDescription>
                Ajoutez des recettes ou dépenses ponctuelles pour {formatMonth(selectedMonth)}
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Recette</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé *
                </label>
                <Input
                  {...register('label')}
                  placeholder="Vacances, Prime..."
                  className={errors.label ? 'border-red-500' : ''}
                />
                {errors.label && (
                  <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (€) *
                </label>
                <Input
                  {...register('amount')}
                  type="text"
                  placeholder="500.00"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
              
              <div className="flex items-end space-x-2">
                <Button type="submit" size="sm">
                  Ajouter
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
          
          {loading && <Loading size="sm" />}
          
          {/* List of planned extras */}
          {plannedExtras.length > 0 ? (
            <div className="space-y-2">
              {plannedExtras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${extra.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-medium">{extra.label}</div>
                      {extra.dateISO && (
                        <div className="text-sm text-gray-500">
                          {dayjs(extra.dateISO).format('DD/MM/YYYY')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium ${extra.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {extra.type === 'income' ? '+' : '-'}{formatCurrency(extra.amountCts)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeExtra(extra.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun élément exceptionnel ajouté</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter" pour simuler des recettes ou dépenses ponctuelles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}