import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loading, LoadingCard } from '../components/ui/loading';
import { useBudgetStore } from '../store/budget';
import { useToast } from '../components/ui/use-toast';
import { formatCurrency, getCurrentMonth, getBalanceColor } from '../lib/utils';
import dayjs from 'dayjs';
import { TrendingUp, TrendingDown, Euro, CreditCard, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock data
const mockCategories = [
  { id: '1', name: 'Alimentation', color: '#10B981' },
  { id: '2', name: 'Transport', color: '#3B82F6' },
  { id: '3', name: 'Loisirs', color: '#8B5CF6' },
  { id: '4', name: 'Santé', color: '#EF4444' },
  { id: '5', name: 'Shopping', color: '#F59E0B' },
];

const mockExpenses = [
  { id: '1', dateISO: '2025-01-15', label: 'Courses Leclerc', amountCts: 8500, categoryId: '1' },
  { id: '2', dateISO: '2025-01-10', label: 'Essence', amountCts: 6000, categoryId: '2' },
  { id: '3', dateISO: '2025-01-20', label: 'Cinéma', amountCts: 2400, categoryId: '3' },
  { id: '4', dateISO: '2025-01-05', label: 'Pharmacie', amountCts: 1800, categoryId: '4' },
  { id: '5', dateISO: '2025-01-12', label: 'Vêtements', amountCts: 12000, categoryId: '5' },
];

const mockFixedExpenses = [
  { id: '1', label: 'Loyer', amountCts: 120000, dayOfMonth: 1 },
  { id: '2', label: 'Électricité', amountCts: 8500, dayOfMonth: 15 },
  { id: '3', label: 'Internet', amountCts: 3500, dayOfMonth: 10 },
];

const mockMonthSummary = {
  monthISO: getCurrentMonth(),
  fixedExpensesTotalCts: 132000, // 1320€
  recurringIncomesTotalCts: 280000, // 2800€
  variableExpensesTotalCts: 30700, // 307€
  otherIncomesTotalCts: 5000, // 50€
  balanceCts: 122300, // 1223€
};

// Generate mock year data
const generateMockYearData = (year: number) => {
  return Array.from({ length: 12 }, (_, i) => {
    const monthISO = dayjs().year(year).month(i).format('YYYY-MM');
    const baseIncome = 280000 + Math.random() * 20000 - 10000;
    const baseExpenses = 150000 + Math.random() * 30000 - 15000;
    
    return {
      monthISO,
      recurringIncomesTotalCts: Math.round(baseIncome),
      otherIncomesTotalCts: Math.round(Math.random() * 10000),
      fixedExpensesTotalCts: Math.round(baseExpenses * 0.8),
      variableExpensesTotalCts: Math.round(baseExpenses * 0.2),
      balanceCts: Math.round(baseIncome - baseExpenses),
    };
  });
};

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [monthSummary, setMonthSummary] = useState(mockMonthSummary);
  const [yearSummary, setYearSummary] = useState(generateMockYearData(dayjs().year()));
  
  const { toast } = useToast();
  
  // Update month summary when month changes
  useEffect(() => {
    const yearData = generateMockYearData(selectedYear);
    const monthData = yearData.find(data => data.monthISO === selectedMonth);
    if (monthData) {
      setMonthSummary(monthData);
    }
  }, [selectedMonth, selectedYear]);
  
  // Update year summary when year changes
  useEffect(() => {
    setYearSummary(generateMockYearData(selectedYear));
  }, [selectedYear]);
  
  // Generate timeline data from year summary
  const timelineData = useMemo(() => {
    return yearSummary.map((summary) => ({
      month: dayjs(summary.monthISO).format('MMM'),
      monthFull: dayjs(summary.monthISO).format('MMMM'),
      monthISO: summary.monthISO,
      recettes: summary.recurringIncomesTotalCts + summary.otherIncomesTotalCts,
      depenses: summary.fixedExpensesTotalCts + summary.variableExpensesTotalCts,
      solde: summary.balanceCts,
      isCurrentMonth: summary.monthISO === selectedMonth,
      isCurrentActualMonth: summary.monthISO === getCurrentMonth(),
    }));
  }, [yearSummary, selectedMonth]);
  
  // Generate months data for charts
  const monthsData = useMemo(() => {
    return timelineData.map(data => ({
      month: data.month,
      monthFull: data.monthFull,
      monthISO: data.monthISO,
      recettes: data.recettes,
      depenses: data.depenses,
      solde: data.solde,
    }));
  }, [timelineData]);
  
  // Prepare pie chart data for categories
  const categoryData = mockCategories.map(category => {
    const totalCts = mockExpenses
      .filter(exp => exp.categoryId === category.id)
      .reduce((sum, exp) => sum + exp.amountCts, 0);
    
    return {
      name: category.name,
      value: totalCts,
      color: category.color,
    };
  }).filter(item => item.value > 0);
  
  // Add fixed expenses as a separate segment
  if (monthSummary?.fixedExpensesTotalCts > 0) {
    categoryData.push({
      name: 'Charges fixes',
      value: monthSummary.fixedExpensesTotalCts,
      color: '#6B7280',
    });
  }
  
  // Generate daily cumulative data for the month
  const daysInMonth = dayjs(selectedMonth).daysInMonth();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    
    // Calculate cumulative expenses up to this day
    const cumulativeExpenses = mockExpenses
      .filter(exp => dayjs(exp.dateISO).date() <= day && dayjs(exp.dateISO).format('YYYY-MM') === selectedMonth)
      .reduce((sum, exp) => sum + exp.amountCts, 0);
    
    // Add fixed expenses that have occurred up to this day
    const fixedExpensesCumulative = mockFixedExpenses
      .filter(exp => exp.dayOfMonth <= day)
      .reduce((sum, exp) => sum + exp.amountCts, 0);
    
    return {
      day,
      depenses: (cumulativeExpenses + fixedExpensesCumulative) / 100,
      date: dayjs(`${selectedMonth}-${day.toString().padStart(2, '0')}`).format('DD/MM'),
    };
  });
  
  const handleMonthClick = (monthISO: string) => {
    setSelectedMonth(monthISO);
  };
  
  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
    setSelectedYear(newYear);
    // Update selected month to the same month in the new year
    const currentMonthNumber = dayjs(selectedMonth).month();
    setSelectedMonth(dayjs().year(newYear).month(currentMonthNumber).format('YYYY-MM'));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-blue-600 mt-1">Mode démonstration - Données simulées</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleYearChange('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold px-4">{selectedYear}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleYearChange('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Year Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Chronologie {selectedYear}
          </CardTitle>
          <CardDescription>
            Cliquez sur un mois pour voir le détail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
            {timelineData.map((data) => (
              <button
                key={data.monthISO}
                onClick={() => handleMonthClick(data.monthISO)}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  data.isCurrentMonth
                    ? 'border-blue-500 bg-blue-50'
                    : data.isCurrentActualMonth
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {data.month}
                </div>
                <div className={`text-xs font-semibold ${getBalanceColor(data.solde)}`}>
                  {formatCurrency(data.solde)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <div className="text-green-600">+{formatCurrency(data.recettes)}</div>
                  <div className="text-red-600">-{formatCurrency(data.depenses)}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-blue-500 bg-blue-50 rounded mr-2"></div>
              <span>Mois sélectionné</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-green-500 bg-green-50 rounded mr-2"></div>
              <span>Mois actuel</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total recettes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency((monthSummary?.recurringIncomesTotalCts || 0) + (monthSummary?.otherIncomesTotalCts || 0))}
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
                    Total dépenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency((monthSummary?.fixedExpensesTotalCts || 0) + (monthSummary?.variableExpensesTotalCts || 0))}
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
                <Euro className={`h-8 w-8 ${getBalanceColor(monthSummary?.balanceCts || 0).replace('text-', '')}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Solde du mois
                  </dt>
                  <dd className={`text-lg font-medium ${getBalanceColor(monthSummary?.balanceCts || 0)}`}>
                    {formatCurrency(monthSummary?.balanceCts || 0)}
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
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Charges fixes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(monthSummary?.fixedExpensesTotalCts || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie pour {dayjs(selectedMonth).format('MMMM YYYY')}</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Aucune dépense pour ce mois
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Line Chart - Daily Cumulative */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des dépenses</CardTitle>
            <CardDescription>Cumul journalier pour {dayjs(selectedMonth).format('MMMM YYYY')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `${value}€`} />
                <Tooltip 
                  formatter={(value) => [`${value}€`, 'Dépenses cumulées']}
                  labelFormatter={(day) => `Jour ${day}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="depenses" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Bar Chart - 12 months comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur l'année {selectedYear}</CardTitle>
          <CardDescription>Comparaison recettes vs dépenses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 100).toFixed(0)}€`} />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value as number), 
                  name === 'recettes' ? 'Recettes' : name === 'depenses' ? 'Dépenses' : 'Solde'
                ]}
              />
              <Bar dataKey="recettes" fill="#16A34A" name="recettes" />
              <Bar dataKey="depenses" fill="#DC2626" name="depenses" />
              <Bar dataKey="solde" fill="#2563EB" name="solde" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}