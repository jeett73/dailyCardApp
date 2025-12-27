import { AxiosRequestConfig } from 'axios';
import api from './apiClient';

export const getRequest = (url: string, config?: AxiosRequestConfig) => api.get(url, config);
export const postRequest = (url: string, data: unknown, config?: AxiosRequestConfig) =>
  api.post(url, data, config);
export const putRequest = (url: string, data: unknown, config?: AxiosRequestConfig) =>
  api.put(url, data, config);
export const patchRequest = (url: string, data: unknown, config?: AxiosRequestConfig) =>
  api.patch(url, data, config);
export const deleteRequest = (url: string, config?: AxiosRequestConfig) => api.delete(url, config);

export default { getRequest, postRequest, putRequest, patchRequest, deleteRequest };
