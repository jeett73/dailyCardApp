import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import apiEndpoint from '../constants/apiEndpoint';
import { log, error as logError } from '../services/logger';
import { getItem, removeItem, setItem } from '../services/storage';

const api = axios.create({
  baseURL: apiEndpoint.baseUrl,
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
  try {
    const method = String(config.method || 'GET').toUpperCase();
    const endpoint = String(config.url || '');
    log('REQUEST', method, endpoint);
    const isSensitive = endpoint === apiEndpoint.auth.refresh;
    if (!isSensitive) {
      if (config.params) {
        try {
          log('PARAMS', JSON.stringify(config.params, null, 4));
        } catch { }
      }
      if (typeof config.data !== 'undefined') {
        try {
          const payload =
            typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 4);
          log('PAYLOAD', payload);
        } catch { }
      }
    }
  } catch { }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    log('===================================================');
    const method = String(response.config.method || 'GET').toUpperCase();
    const endpoint = String(response.config.url || '');
    log('API', response.status, method, endpoint);
    if (endpoint !== apiEndpoint.auth.refresh) {
      try {
        log(JSON.stringify(response.data, null, 4));
      } catch { }
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const method = String(error.config?.method || 'GET').toUpperCase();
    const endpoint = String(error.config?.url || '');
    logError('API Error', status, method, endpoint, error.message);
    try {
      log(`${method} - ${endpoint}`);
      const payload = error.response?.data ?? { message: error.message };
      log(JSON.stringify(payload, null, 4));
    } catch { }
    const originalRequest: any = error.config;
    if (
      status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url !== apiEndpoint.auth.refresh
    ) {
      originalRequest._retry = true;
      const rt = await getItem('refreshToken');
      if (!rt) {
        await removeItem('token');
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(apiEndpoint.auth.refresh, { refreshToken: rt });
        const newToken: string | undefined = (res.data as any)?.token;
        const newRefresh: string | undefined = (res.data as any)?.refreshToken;
        if (newToken) {
          await setItem('token', newToken);
        }
        if (newRefresh) {
          await setItem('refreshToken', newRefresh);
        }
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api.request(originalRequest);
      } catch (refreshErr) {
        await removeItem('token');
        await removeItem('refreshToken');
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
