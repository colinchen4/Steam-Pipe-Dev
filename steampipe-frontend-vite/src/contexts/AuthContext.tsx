import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  phantomWalletAddress: string;
  steamId: string;
  steamProfile: {
    steamid: string;
    personaname: string;
    profileurl: string;
    avatar: string;
    avatarfull: string;
    loccountrycode?: string;
  };
  inventory?: any; // Steam inventory items
  steamTradeStatus?: {
    status: string;
    lastChecked: string;
  };
  steamInventoryStatus?: {
    isPublic: boolean;
    lastChecked: string;
  };
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user data when token is available
      api.get('/api/user/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch user profile:', error);
          setToken(null);
          setUser(null);
        });
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      setToken,
      isAuthenticated: !!token,
      user,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
