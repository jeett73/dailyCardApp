import { getDeviceId } from '@/services/deviceService';
import storage from '@/services/storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL: string =
  (process.env.EXPO_PUBLIC_API_URL as string) ||
  ((Constants?.expoConfig as any)?.extra?.apiUrl as string) ||
  '';

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 18000,
});

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  const subs = [...refreshSubscribers];
  refreshSubscribers = [];
  subs.forEach((cb) => cb(token));
}

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

async function setAccessToken(token: string | null): Promise<void> {
  if (token) {
    await storage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    await storage.removeItem(ACCESS_TOKEN_KEY);
  }
}

async function setRefreshToken(token: string | null): Promise<void> {
  if (token) {
    await storage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await storage.removeItem(REFRESH_TOKEN_KEY);
  }
}

async function getAccessToken(): Promise<string | null> {
  return (await storage.getItem(ACCESS_TOKEN_KEY)) || null;
}

async function getRefreshToken(): Promise<string | null> {
  return (await storage.getItem(REFRESH_TOKEN_KEY)) || null;
}

async function clearTokens(): Promise<void> {
  await storage.removeItem(ACCESS_TOKEN_KEY);
  await storage.removeItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string | null, refreshToken?: string | null) {
  inMemoryAccessToken = accessToken;
  if (typeof refreshToken !== 'undefined') {
    inMemoryRefreshToken = refreshToken;
  }
  await setAccessToken(accessToken || null);
  if (typeof refreshToken !== 'undefined') {
    await setRefreshToken(refreshToken || null);
  }
}

export async function initAuthFromStorage(): Promise<void> {
  const [a, r] = await Promise.all([getAccessToken(), getRefreshToken()]);
  inMemoryAccessToken = a;
  inMemoryRefreshToken = r;
}

http.interceptors.request.use(async (config) => {
  if (!inMemoryAccessToken) {
    inMemoryAccessToken = await getAccessToken();
  }
  if (inMemoryAccessToken) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

async function doTokenRefresh(): Promise<string | null> {
  if (!inMemoryRefreshToken) {
    inMemoryRefreshToken = await getRefreshToken();
  }
  const tokenToUse = inMemoryRefreshToken;
  if (!tokenToUse) {
    return null;
  }

  const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
  try {
    const deviceId = await getDeviceId();
    const res = await refreshClient.post('/auth/refresh', { refreshToken: tokenToUse, deviceId });
    const data = res?.data || {};
    const newAccess: string | null = data.accessToken || data.token || null;
    const newRefresh: string | undefined = data.refreshToken;

    await setTokens(newAccess, typeof newRefresh !== 'undefined' ? newRefresh : undefined);
    return newAccess;
  } catch (e) {
    await clearTokens();
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = (error.response && error.response.status) || 0;

    const url = (originalRequest && originalRequest.url) || '';
    const isRefreshEndpoint = url?.includes('/auth/refresh');

    if (status !== 401 || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doTokenRefresh().finally(() => {
        isRefreshing = false;
      });
      const newToken = await refreshPromise;
      onRefreshed(newToken);
    }

    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (token) => {
        if (!token) {
          reject(error);
          return;
        }
        try {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as any).Authorization = `Bearer ${token}`;
          const resp = await http(originalRequest);
          resolve(resp);
        } catch (err) {
          reject(err);
        }
      });
    });
  },
);

export { http };
