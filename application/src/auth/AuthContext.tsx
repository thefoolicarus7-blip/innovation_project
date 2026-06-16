import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: string;
  role: string;
  cvUrl?: string;
  idUrl?: string;
  profileUrl?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // If we have a token, we might be logged in. 
        // We'll try to fetch the profile.
        try {
          const profile = await authService.getProfile();
          setUser(profile.user);
        } catch (error: any) {
          console.error('Failed to fetch profile during load', error);
          if (error.response?.status === 401) {
            // Token is definitely invalid
            await AsyncStorage.removeItem('token');
            setUser(null);
          } else {
            // Probably a network error, we can't verify yet.
            // For UX, we could either stay on splash or assume login if we have a token.
            // Let's keep user as null but maybe we can do better.
          }
        }
      }
    } catch (error) {
      console.error('Failed to access storage', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user);
  };

  const register = async (userData: any) => {
    const data = await authService.register(userData);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile.user);
    } catch (error) {
      console.error('Failed to refresh profile', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
