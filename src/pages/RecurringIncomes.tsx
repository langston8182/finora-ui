import React, { useState } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loading, LoadingCard } from '../components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { useBudgetStore } from '../store/budget';
import { formatCurrency, formatDate, parseCurrency } from '../lib/utils';
import { RecurringIncome } from '../types';

const recurringIncomeSchema = z.object({
  label: z.string().min(1, 'Le libellé est obligatoire'),
  amount: z.string().min(1, 'Le montant est obligatoire'),
  dayOfMonth: z.coerce.number().min(1, 'Le jour doit être entre 1 et 31').max(31, 'Le jour doit être entre 1 et 31'),
  startDate: z.string().min(1, 'La date de début est obligatoire'),
  endDate: z.string().optional(),
});

type RecurringIncomeForm = z.infer<typeof recurringIncomeSchema>;

export function RecurringIncomes() {
  const { 
    recurringIncomes, 
    addRecurringIncome, 
    updateRecurringIncome, 
    deleteRecurringIncome,
    loadRecurringIncomes,
    loading,
    error 
  } = useBudgetStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    loadRecurringIncomes();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RecurringIncomeForm>({
    resolver: zodResolver(recurringIncomeSchema),
  });
  
  const onSubmit = async (data: RecurringIncomeForm) => {
    const amountCts = parseCurrency(data.amount);
    
    if (data.endDate && data.endDate < data.startDate) {
      toast({
        title: 'Erreur',
        description: 'La date de fin doit être postérieure à la date de début',
        variant: 'destructive',
      });
      return;
    }
    
    const incomeData = {
      label: data.label,
      amountCts,
      dayOfMonth: data.dayOfMonth,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
    };
    
    if (editingId) {
      try {
        await updateRecurringIncome(editingId, incomeData);
        toast({
          title: 'Revenu récurrent modifié',
          description: 'Le revenu récurrent a été mis à jour avec succès',
        });
        setEditingId(null);
      } catch (error) {
        // Error is handled in the store
      }
    } else {
      try {
        await addRecurringIncome(incomeData);
        toast({
          title: 'Revenu récurrent ajouté',
          description: 'Le nouveau revenu récurrent a été créé avec succès',
        });
      } catch (error) {
        // Error is handled in the store
      }
    }
    
    reset();
    setShowForm(false);
  };
  
  const handleEdit = (income: RecurringIncome) => {
    setEditingId(income.id);
    setShowForm(true);
    setValue('label', income.label);
    setValue('amount', (income.amountCts / 100).toString());
    setValue('dayOfMonth', income.dayOfMonth);
    setValue('startDate', income.startDate);
    setValue('endDate', income.endDate || '');
  };
  
  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${label}" ?`)) {
      try {
        await deleteRecurringIncome(id);
        toast({
          title: 'Revenu récurrent supprimé',
          description: 'Le revenu récurrent a été supprimé avec succès',
        });
      } catch (error) {
        // Error is handled in the store
      }
    }
  };
  
  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    reset();
  };
  
  const sortedIncomes = [...recurringIncomes].sort((a, b) => {
    if (a.dayOfMonth !== b.dayOfMonth) {
      return a.dayOfMonth - b.dayOfMonth;
    }
    return a.label.localeCompare(b.label);
  });
  
  if (loading && recurringIncomes.length === 0) {
    return <LoadingCard text="Chargement des revenus récurrents..." />;
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
          <h1 className="text-3xl font-bold text-gray-900">Revenus récurrents</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos entrées d'argent régulières (salaire, allocations, pensions...)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un revenu
        </Button>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier' : 'Ajouter'} un revenu récurrent</CardTitle>
            {loading && <Loading size="sm" />}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé *
                </label>
                <Input
                  {...register('label')}
                  placeholder="Salaire, Allocations CAF, Pension..."
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
                  placeholder="2800.00"
                  className={errors.amount ? 'border-red-500' : ''}
                 lang="fr-FR"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jour du mois *
                </label>
                <Input
                  {...register('dayOfMonth')}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="28"
                  className={errors.dayOfMonth ? 'border-red-500' : ''}
                />
                {errors.dayOfMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dayOfMonth.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <Input
                  {...register('startDate')}
                  type="date"
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin (optionnelle)
                </label>
                <Input
                  {...register('endDate')}
                  type="date"
                />
              </div>
              
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit">
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des revenus récurrents</CardTitle>
          <CardDescription>
            {recurringIncomes.length} revenu{recurringIncomes.length > 1 ? 's' : ''} configuré{recurringIncomes.length > 1 ? 's' : ''}
          </CardDescription>
          {loading && <Loading size="sm" />}
        </CardHeader>
        <CardContent>
          {sortedIncomes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun revenu récurrent configuré</p>
              <p className="text-sm mt-1">Commencez par ajouter vos entrées d'argent régulières</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {income.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(income.amountCts)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Le {income.dayOfMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Du {formatDate(income.startDate)}
                        {income.endDate && ` au ${formatDate(income.endDate)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(income)}
                            disabled={showForm}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(income.id, income.label)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}