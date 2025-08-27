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
import { FixedExpense } from '../types';

const fixedExpenseSchema = z.object({
  label: z.string().min(1, 'Le libellé est obligatoire'),
  amount: z.string().min(1, 'Le montant est obligatoire'),
  dayOfMonth: z.coerce.number().min(1, 'Le jour doit être entre 1 et 31').max(31, 'Le jour doit être entre 1 et 31'),
  startDate: z.string().min(1, 'La date de début est obligatoire'),
  endDate: z.string().optional(),
});

type FixedExpenseForm = z.infer<typeof fixedExpenseSchema>;

export function FixedExpenses() {
  const { 
    fixedExpenses, 
    addFixedExpense, 
    updateFixedExpense, 
    deleteFixedExpense,
    loadFixedExpenses,
    loading,
    error 
  } = useBudgetStore();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Load data on mount
  useEffect(() => {
    loadFixedExpenses();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FixedExpenseForm>({
    resolver: zodResolver(fixedExpenseSchema),
  });
  
  const onSubmit = async (data: FixedExpenseForm) => {
    const amountCts = parseCurrency(data.amount);
    
    if (data.endDate && data.endDate < data.startDate) {
      toast({
        title: 'Erreur',
        description: 'La date de fin doit être postérieure à la date de début',
        variant: 'destructive',
      });
      return;
    }
    
    const expenseData = {
      label: data.label,
      amountCts,
      dayOfMonth: data.dayOfMonth,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
    };
    
    if (editingId) {
      try {
        await updateFixedExpense(editingId, expenseData);
        toast({
          title: 'Charge fixe modifiée',
          description: 'La charge fixe a été mise à jour avec succès',
        });
        setEditingId(null);
      } catch (error) {
        // Error is handled in the store
      }
    } else {
      try {
        await addFixedExpense(expenseData);
        toast({
          title: 'Charge fixe ajoutée',
          description: 'La nouvelle charge fixe a été créée avec succès',
        });
      } catch (error) {
        // Error is handled in the store
      }
    }
    
    reset();
    setShowForm(false);
  };
  
  const handleEdit = (expense: FixedExpense) => {
    setEditingId(expense.id);
    setShowForm(true);
    setValue('label', expense.label);
    setValue('amount', (expense.amountCts / 100).toFixed(2));
    setValue('dayOfMonth', expense.dayOfMonth);
    setValue('startDate', expense.startDate);
    setValue('endDate', expense.endDate || '');
  };
  
  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${label}" ?`)) {
      try {
        await deleteFixedExpense(id);
        toast({
          title: 'Charge fixe supprimée',
          description: 'La charge fixe a été supprimée avec succès',
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
  
  const sortedExpenses = [...fixedExpenses].sort((a, b) => {
    if (a.dayOfMonth !== b.dayOfMonth) {
      return a.dayOfMonth - b.dayOfMonth;
    }
    return a.label.localeCompare(b.label);
  });
  
  if (loading && fixedExpenses.length === 0) {
    return <LoadingCard text="Chargement des charges fixes..." />;
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
          <h1 className="text-3xl font-bold text-gray-900">Charges fixes</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos dépenses récurrentes (loyer, assurances, abonnements...)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une charge
        </Button>
      </div>
      
      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier' : 'Ajouter'} une charge fixe</CardTitle>
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
                  placeholder="Loyer, Électricité, Assurance..."
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
                  placeholder="1200.00"
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
                  placeholder="1"
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
          <CardTitle>Liste des charges fixes</CardTitle>
          <CardDescription>
            {fixedExpenses.length} charge{fixedExpenses.length > 1 ? 's' : ''} configurée{fixedExpenses.length > 1 ? 's' : ''}
          </CardDescription>
          {loading && <Loading size="sm" />}
        </CardHeader>
        <CardContent>
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune charge fixe configurée</p>
              <p className="text-sm mt-1">Commencez par ajouter vos dépenses récurrentes</p>
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
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(expense.amountCts)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Le {expense.dayOfMonth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Du {formatDate(expense.startDate)}
                        {expense.endDate && ` au ${formatDate(expense.endDate)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(expense)}
                            disabled={showForm}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(expense.id, expense.label)}
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