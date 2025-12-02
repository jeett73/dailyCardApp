import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { log, error as logError } from '../services/logger';
import { getItem, removeItem } from '../services/storage';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getItem('token');
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    log('API', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    logError('API Error', status, error.message);
    if (status === 401) {
      await removeItem('token');
    }
    return Promise.reject(error);
  },
);

export default api;
