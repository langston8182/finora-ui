const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://finora-api-preprod.cyrilmarchive.com/api/v1');
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'https://finora-auth.cyrilmarchive.com';

// Variable pour éviter les appels multiples simultanés au refresh
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

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
const handleResponse = async <T>(response: Response, originalRequest?: () => Promise<Response>): Promise<T> => {
  // Si c'est une 403, tenter le refresh token
  if (response.status === 403 && originalRequest) {
    try {
      await refreshToken();
      // Relancer la requête originale après le refresh
      const newResponse = await originalRequest();
      return handleResponse(newResponse);
    } catch (refreshError) {
      // Si le refresh échoue, rediriger vers login
      console.error('Refresh token failed:', refreshError);
      authApi.login();
      throw new Error('Session expirée, redirection vers la connexion');
    }
  }
  
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

// Fonction pour rafraîchir le token
const refreshToken = async (): Promise<void> => {
  // Si un refresh est déjà en cours, attendre qu'il se termine
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important pour envoyer les cookies
      });
      
      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }
      
      console.log('Token refreshed successfully');
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

// Fonction helper pour créer une requête avec retry automatique
const createRequestWithRetry = async (url: string, options: RequestInit): Promise<Response> => {
  const makeRequest = () => fetch(url, options);
  const response = await makeRequest();
  
  // Si c'est une 403, handleResponse va gérer le refresh et retry
  return response;
};

// CATEGORIES API
export const categoriesApi = {
  getAll: async () => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/categories`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  create: async (category: { name: string; color: string }) => {
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(category),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/categories`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/categories`, options);
    return handleResponse(response, originalRequest);
  },

  update: async (id: string, updates: { name?: string; color?: string }) => {
    const options = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/categories/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/categories/${id}`, options);
    return handleResponse(response, originalRequest);
  },

  delete: async (id: string) => {
    const options = {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/categories/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/categories/${id}`, options);
    return handleResponse(response, originalRequest);
  },
};

// EXPENSES API
export const expensesApi = {
  getByMonth: async (month: string) => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/expenses?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/expenses?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  create: async (expense: {
    date: string;
    label: string;
    amountCts: number;
    categoryId: string;
    notes?: string;
  }) => {
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(expense),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/expenses`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/expenses`, options);
    return handleResponse(response, originalRequest);
  },

  update: async (id: string, updates: {
    date?: string;
    label?: string;
    amountCts?: number;
    categoryId?: string;
    notes?: string;
  }) => {
    const options = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/expenses/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/expenses/${id}`, options);
    return handleResponse(response, originalRequest);
  },

  delete: async (id: string) => {
    const options = {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/expenses/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/expenses/${id}`, options);
    return handleResponse(response, originalRequest);
  },
};

// INCOMES API
export const incomesApi = {
  getByMonth: async (month: string) => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/incomes?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/incomes?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  create: async (income: {
    date: string;
    label: string;
    amountCts: number;
    notes?: string;
  }) => {
    const options = {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(income),
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/incomes`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/incomes`, options);
    return handleResponse(response, originalRequest);
  },

  update: async (id: string, updates: {
    date?: string;
    label?: string;
    amountCts?: number;
    notes?: string;
  }) => {
    const options = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/incomes/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/incomes/${id}`, options);
    return handleResponse(response, originalRequest);
  },

  delete: async (id: string) => {
    const options = {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/incomes/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/incomes/${id}`, options);
    return handleResponse(response, originalRequest);
  },
};

// FIXED EXPENSES API
export const fixedExpensesApi = {
  getAll: async () => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/fixed-expenses`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/fixed-expenses`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  create: async (fixedExpense: {
    label: string;
    amountCts: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string;
  }) => {
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fixedExpense),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/fixed-expenses`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/fixed-expenses`, options);
    return handleResponse(response, originalRequest);
  },

  update: async (id: string, updates: {
    label?: string;
    amountCts?: number;
    dayOfMonth?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const options = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/fixed-expenses/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/fixed-expenses/${id}`, options);
    return handleResponse(response, originalRequest);
  },

  delete: async (id: string) => {
    const options = {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/fixed-expenses/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/fixed-expenses/${id}`, options);
    return handleResponse(response, originalRequest);
  },
};

// RECURRING INCOMES API
export const recurringIncomesApi = {
  getAll: async () => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/recurring-incomes`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/recurring-incomes`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  create: async (recurringIncome: {
    label: string;
    amountCts: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string;
  }) => {
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recurringIncome),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/recurring-incomes`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/recurring-incomes`, options);
    return handleResponse(response, originalRequest);
  },

  update: async (id: string, updates: {
    label?: string;
    amountCts?: number;
    dayOfMonth?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const options = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/recurring-incomes/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/recurring-incomes/${id}`, options);
    return handleResponse(response, originalRequest);
  },

  delete: async (id: string) => {
    const options = {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/recurring-incomes/${id}`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/recurring-incomes/${id}`, options);
    return handleResponse(response, originalRequest);
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
    const options = {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    };
    const response = await createRequestWithRetry(`${API_BASE_URL}/forecast/calc`, options);
    const originalRequest = () => fetch(`${API_BASE_URL}/forecast/calc`, options);
    return handleResponse(response, originalRequest);
  },
};

// SUMMARY API
export const summaryApi = {
  getByMonth: async (month: string) => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/summary?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/summary?month=${month}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  getLastMonths: async (months: number) => {
    const response = await createRequestWithRetry(`${API_BASE_URL}/summary/last-months?months=${months}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${API_BASE_URL}/summary/last-months?months=${months}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },
};

// AUTH API
export const authApi = {
  login: async () => {
    window.location.href = `${AUTH_BASE_URL}/auth/login`;
  },

  getUserInfo: async () => {
    const response = await createRequestWithRetry(`${AUTH_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    const originalRequest = () => fetch(`${AUTH_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response, originalRequest);
  },

  signout: async () => {
    window.location.href = `${AUTH_BASE_URL}/auth/logout`;
  },
};