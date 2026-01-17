import { ParsedCommand } from './geminiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SESSION_KEY = 'dompet_session';
const SESSION_EXPIRY_KEY = 'dompet_session_expiry';

// Password login
interface LoginResponse {
  success: boolean;
  error?: string;
  sessionExpiresAt?: string;
}

export const loginWithPassword = async (password: string): Promise<LoginResponse> => {
  if (!API_BASE_URL) return { success: false, error: 'API not configured' };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    // Save session
    if (data.sessionExpiresAt) {
      saveSession(data.sessionExpiresAt);
    }
    
    return { success: true, sessionExpiresAt: data.sessionExpiresAt };
  } catch (error) {
    console.error('Failed to login', error);
    return { success: false, error: 'Network error' };
  }
};

// Session management
export const saveSession = (expiresAt: string): void => {
  localStorage.setItem(SESSION_KEY, 'authenticated');
  localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt);
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const isSessionValid = (): boolean => {
  const session = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (!session || !expiry) return false;
  
  try {
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    // Check if expiry date is valid
    if (isNaN(expiryDate.getTime())) {
      clearSession();
      return false;
    }
    
    if (now >= expiryDate) {
      clearSession();
      return false;
    }
    
    return true;
  } catch {
    clearSession();
    return false;
  }
};

export const getSessionRemainingTime = (): number => {
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiry) return 0;
  
  const expiryDate = new Date(expiry);
  const now = new Date();
  const remaining = Math.max(0, expiryDate.getTime() - now.getTime());
  
  return Math.floor(remaining / 1000); // seconds
};

export const sendTelegramCommandToApi = async (message: string): Promise<ParsedCommand | null> => {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/telegram/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.parsed as ParsedCommand;
  } catch (error) {
    console.error('Failed to reach Telegram API endpoint', error);
    return null;
  }
};

interface OTPRequestResponse {
  success: boolean;
  error?: string;
  expiresAt?: string;
  expiresIn?: number;
  remainingDaily?: number;
  waitSeconds?: number;
  isExisting?: boolean;
}

export const requestOTP = async (username: string): Promise<OTPRequestResponse> => {
  if (!API_BASE_URL) return { success: false, error: 'API not configured' };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Failed to send OTP',
        waitSeconds: data.waitSeconds,
        remainingDaily: data.remainingDaily
      };
    }
    
    return { 
      success: true,
      expiresAt: data.expiresAt,
      expiresIn: data.expiresIn,
      remainingDaily: data.remainingDaily,
      isExisting: data.isExisting
    };
  } catch (error) {
    console.error('Failed to request OTP', error);
    return { success: false, error: 'Network error' };
  }
};

interface OTPVerifyResponse {
  valid: boolean;
  error?: string;
  attemptsLeft?: number;
  sessionExpiresAt?: string;
}

export const verifyOTP = async (username: string, code: string): Promise<OTPVerifyResponse> => {
  if (!API_BASE_URL) return { valid: false, error: 'API not configured' };

  try {
    const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, code })
    });

    const data = await response.json().catch(() => ({}));
    
    // If valid, save session to localStorage
    if (data.valid && data.sessionExpiresAt) {
      saveSession(data.sessionExpiresAt);
    }
    
    return { 
      valid: data.valid === true,
      error: data.error,
      attemptsLeft: data.attemptsLeft,
      sessionExpiresAt: data.sessionExpiresAt
    };
  } catch (error) {
    console.error('Failed to verify OTP', error);
    return { valid: false, error: 'Network error' };
  }
};

export const clearAllData = async (): Promise<{ success: boolean }> => {
  if (!API_BASE_URL) return { success: false };

  try {
    const response = await fetch(`${API_BASE_URL}/api/data/clear-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return { success: false };
    return { success: true };
  } catch (error) {
    console.error('Failed to clear data', error);
    return { success: false };
  }
};

export const clearAllTransactions = async (): Promise<{ success: boolean }> => {
  if (!API_BASE_URL) return { success: false };

  try {
    const response = await fetch(`${API_BASE_URL}/api/data/clear-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return { success: false };
    return { success: true };
  } catch (error) {
    console.error('Failed to clear transactions', error);
    return { success: false };
  }
};

export const syncState = async (state: {
  accounts?: any[];
  transactions?: any[];
  goals?: any[];
  budgets?: any[];
}): Promise<{ success: boolean }> => {
  if (!API_BASE_URL) return { success: false };

  try {
    const response = await fetch(`${API_BASE_URL}/api/state/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });

    if (!response.ok) return { success: false };
    return { success: true };
  } catch (error) {
    console.error('Failed to sync state', error);
    return { success: false };
  }
};

// Fetch real state from database
export const fetchState = async (): Promise<{
  accounts: any[];
  transactions: any[];
  goals: any[];
  budgets: any[];
} | null> => {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/state`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch state', error);
    return null;
  }
};
