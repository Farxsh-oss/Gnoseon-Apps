import { create } from 'zustand';
import apiService from '../../services/apiService';
import socketService from '../../services/socketService';
import { handleAuthError } from '../../utils/errorHandler';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: string;
  memberSince?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  isLoading: true,

  initializeAuth: async () => {
    try {
      const savedToken = localStorage.getItem('gnoseon_token');
      const savedUser = localStorage.getItem('gnoseon_user');
      
      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          apiService.setToken(savedToken);
          
          // Connect to socket
          await socketService.connect(savedToken);
          
          set({ user: userData });
        } catch (error) {
          handleAuthError('Token validation failed', error instanceof Error ? error : new Error(String(error)));
          localStorage.removeItem('gnoseon_token');
          localStorage.removeItem('gnoseon_user');
        }
      }
    } catch (error) {
      handleAuthError('Auth initialization error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      
      if (response.user && response.token) {
        set({ user: response.user });
        
        // Save JWT token from server and user data
        localStorage.setItem('gnoseon_token', response.token);
        localStorage.setItem('gnoseon_user', JSON.stringify(response.user));
        
        apiService.setToken(response.token);
        
        // Connect to socket
        await socketService.connect(response.token);
        
        return true;
      }
      return false;
    } catch (error) {
      handleAuthError('Login error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  },

  logout: async () => {
    try {
      const { user } = useAuthStore.getState();
      if (user) {
        await apiService.logout(user.id);
      }
    } catch (error) {
      handleAuthError('Logout error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      set({ user: null });
      localStorage.removeItem('gnoseon_token');
      localStorage.removeItem('gnoseon_user');
      apiService.clearToken();
      socketService.disconnect();
    }
  },
}));
