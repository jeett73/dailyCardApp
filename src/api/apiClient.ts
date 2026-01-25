import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import apiEndpoint from '../constants/apiEndpoint';
import { getDeviceId } from '../services/deviceService';
import { reportError } from '../services/globalErrorHandler';
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
        reportError(error, { source: 'api', userMessage: 'Session expired. Please login again.' });
        return Promise.reject(error);
      }
      try {
        const deviceId = await getDeviceId();
        const res = await axios.post(apiEndpoint.auth.refresh, { refreshToken: rt, deviceId });
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
        reportError(refreshErr, { source: 'api.refresh' });
        return Promise.reject(refreshErr);
      }
    }
    reportError(error, { source: 'api' });
    return Promise.reject(error);
  },
);

export default api;
