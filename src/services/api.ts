const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://finora-api-preprod.cyrilmarchive.com/api/v1');

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Configuration des headers par défaut
const getHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

// Fonction utilitaire pour gérer les erreurs
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Erreur ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('JSON parsing error:', error, 'Response text:', text);
    throw new Error('Réponse invalide du serveur');
  }
};

// CATEGORIES API
export const categoriesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (category: { name: string; color: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    return handleResponse(response);
  },

  update: async (id: string, updates: { name?: string; color?: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// EXPENSES API
export const expensesApi = {
  getByMonth: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/expenses?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (expense: {
    date: string;
    label: string;
    amountCts: number;
    categoryId: string;
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(expense),
    });
    return handleResponse(response);
  },

  update: async (id: string, updates: {
    date?: string;
    label?: string;
    amountCts?: number;
    categoryId?: string;
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// INCOMES API
export const incomesApi = {
  getByMonth: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/incomes?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (income: {
    date: string;
    label: string;
    amountCts: number;
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/incomes`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(income),
    });
    return handleResponse(response);
  },

  update: async (id: string, updates: {
    date?: string;
    label?: string;
    amountCts?: number;
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// FIXED EXPENSES API
export const fixedExpensesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/fixed-expenses`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (fixedExpense: {
    label: string;
    amountCts: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/fixed-expenses`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(fixedExpense),
    });
    return handleResponse(response);
  },

  update: async (id: string, updates: {
    label?: string;
    amountCts?: number;
    dayOfMonth?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/fixed-expenses/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/fixed-expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// RECURRING INCOMES API
export const recurringIncomesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/recurring-incomes`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (recurringIncome: {
    label: string;
    amountCts: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/recurring-incomes`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(recurringIncome),
    });
    return handleResponse(response);
  },

  update: async (id: string, updates: {
    label?: string;
    amountCts?: number;
    dayOfMonth?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/recurring-incomes/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/recurring-incomes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// FORECAST API
export const forecastApi = {
  calculate: async (data: {
    month: string;
    plannedExtras?: Array<{
      label: string;
      amountCts: number;
      dateISO?: string;
      type: 'expense' | 'income';
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/forecast/calc`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// SUMMARY API
export const summaryApi = {
  getByMonth: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/summary?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getLastMonths: async (months: number) => {
    const response = await fetch(`${API_BASE_URL}/summary/last-months?months=${months}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// AUTH API
export const authApi = {
  callback: async (code: string, state?: string) => {
    const params = new URLSearchParams();
    params.append('code', code);
    if (state) {
      params.append('state', state);
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/callback?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getUserInfo: async (accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/userinfo`, {
      method: 'POST',
      headers: {
        ...getHeaders()
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  signout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};