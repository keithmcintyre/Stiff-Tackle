import { createContext, useContext, useState } from 'react';
import { loginApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('st_token'));

  const login = async (password) => {
    const data = await loginApi(password);
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('st_token', data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'Login failed' };
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('st_token');
  };

  return (
    <AuthContext.Provider value={{ isAdmin: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
