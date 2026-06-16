import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://swipe2-work-ur6j.vercel.app/api'; // Dev tunnel URL

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/user/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/user/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },
  updateDocuments: async (docs: { cvUrl?: string; idUrl?: string; profileImageUrl?: string }) => {
    const response = await api.patch('/user/documents', docs);
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/user/logout');
    } catch (e) {
      console.warn('Server logout failed', e);
    } finally {
      await AsyncStorage.removeItem('token');
    }
  },
  verifyEmail: async (code: string, email?: string) => {
    const response = await api.post('/user/verify-email', { code, email });
    return response.data;
  },
  resendVerification: async (email?: string) => {
    const response = await api.post('/user/resend-verification', { email });
    return response.data;
  },
};

export const mediaService = {
  upload: async (file: any) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const jobService = {
  listJobs: async () => {
    const response = await api.get('/job');
    return response.data;
  },
  swipe: async (jobId: number, action: 'left' | 'right' | 'up') => {
    const response = await api.post('/job/swipe', { jobId, action });
    return response.data;
  },
  getDailyStats: async () => {
    const response = await api.get('/job/daily-stats');
    return response.data;
  },
};

export default api;
