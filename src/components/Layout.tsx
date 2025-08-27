import React from 'react';
import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Plus, 
  User,
  LogOut,
  Euro,
  CreditCard,
  PiggyBank,
  Calculator,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { forecastApi } from '../services/api';
import { Loading } from './ui/loading';
import { useToast } from './ui/use-toast';
import { formatCurrency, getCurrentMonth, getBalanceColor } from '../lib/utils';

export function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { toast } = useToast();
  const [forecastData, setForecastData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Load current month forecast
  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const data = await forecastApi.calculate({
          month: getCurrentMonth(),
          plannedExtras: [],
        });
        setForecastData(data);
      } catch (error) {
        console.error('Error loading forecast:', error);
        // Use mock data as fallback
        setForecastData({
          projectedBalanceCts: 920000,
          components: {
            budgetBaseCts: 460000,
            realizedExpensesCts: 0,
            realizedIncomesCts: 0,
            fixedRemainingCts: 0,
            recurringRemainingCts: 460000,
            extrasExpenseCts: 0,
            extrasIncomeCts: 0,
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadForecast();
  }, [refreshTrigger]);
  
  // Listen for transaction changes to refresh forecast
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Listen for custom events from the budget store
    window.addEventListener('budgetDataChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('budgetDataChanged', handleStorageChange);
    };
  }, []);
  
  // Calculate forecast values
  const components = forecastData?.components || {};
  const expectedIncomesCts = (components.recurringRemainingCts || 0) + (components.extrasIncomeCts || 0);
  const expectedExpensesCts = (components.fixedRemainingCts || 0) + (components.extrasExpenseCts || 0);
  const projectedBalanceCts = forecastData?.projectedBalanceCts || 0;
  
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };
  
  const navigation = [
    { name: 'Prévisionnel', href: '/forecast', icon: TrendingUp },
    { name: 'Chronologie', href: '/timeline', icon: Calendar },
    { name: 'Saisie dépense', href: '/entry/expense', icon: Plus },
    { name: 'Saisie recette', href: '/entry/income', icon: Euro },
    { name: 'Charges fixes', href: '/settings/fixed-expenses', icon: CreditCard },
    { name: 'Revenus récurrents', href: '/settings/recurring-incomes', icon: PiggyBank },
  ];
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-lg font-medium text-gray-900">Budget App</div>
              </div>
            </div>
          </div>
          
          {/* Current month summary */}
          <div className="mt-6 px-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Prévisionnel mois en cours
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recettes prévues</span>
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <span className="text-green-600">
                      +{formatCurrency(expectedIncomesCts)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dépenses prévues</span>
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <span className="text-red-600">
                      -{formatCurrency(expectedExpensesCts)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                  <span>Solde prévisionnel</span>
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <span className={getBalanceColor(projectedBalanceCts)}>
                      {formatCurrency(projectedBalanceCts)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* User menu */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user?.fullName || user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Euro className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-lg font-medium text-gray-900">Budget App</div>
                  </div>
                </div>
              </div>
              
              {/* Current month summary */}
              <div className="mt-6 px-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Prévisionnel mois en cours
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recettes prévues</span>
                      {loading ? (
                        <Loading size="sm" />
                      ) : (
                        <span className="text-green-600">
                          +{formatCurrency(expectedIncomesCts)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dépenses prévues</span>
                      {loading ? (
                        <Loading size="sm" />
                      ) : (
                        <span className="text-red-600">
                          -{formatCurrency(expectedExpensesCts)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                      <span>Solde prévisionnel</span>
                      {loading ? (
                        <Loading size="sm" />
                      ) : (
                        <span className={getBalanceColor(projectedBalanceCts)}>
                          {formatCurrency(projectedBalanceCts)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <nav className="mt-6 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            
            {/* User menu */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.fullName || user?.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Euro className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-lg font-medium text-gray-900">Budget App</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}