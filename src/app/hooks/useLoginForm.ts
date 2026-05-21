import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiService from '../../services/apiService';

interface LoginUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: string;
}

export const useLoginForm = (onLogin?: (user: LoginUser) => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const success = await login(username, password);
      if (success) {
        if (onLogin) {
          const savedUser = localStorage.getItem('gnoseon_user');
          onLogin(savedUser ? JSON.parse(savedUser) : ({} as LoginUser));
        }
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('regUsername') as string;
    const displayName = formData.get('displayName') as string;
    const password = formData.get('regPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    try {
      await apiService.register(username, password, displayName);
      setSuccess('Registrasi berhasil! Silakan login.');
      
      // Auto switch to login tab or just show success
    } catch (err) {
      console.error('Registration error:', err);
      setError('Terjadi kesalahan saat registrasi');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return {
    isLoading,
    error,
    success,
    handleLogin,
    handleRegister,
    generateRandomPassword,
    setError,
    setSuccess
  };
};
