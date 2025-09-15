import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, login as apiLogin } from '../api/auth';

function getToken() {
  return localStorage.getItem('token');
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = getToken();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: getMe,
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    if (data && data.token) {
      localStorage.setItem('token', data.token);
    }
    await queryClient.invalidateQueries({ queryKey: ['auth'] });
    return data;
  }, [queryClient]);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    await queryClient.clear();
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };
}
