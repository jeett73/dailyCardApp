type Id = string | number;
const API_BASE_URL = 'http://172.20.10.2:3000';

const url = (path: string) => `${API_BASE_URL}${path}`;

export const apiEndpoint = {
  baseUrl: API_BASE_URL,
  url,
  auth: {
    login: url('/auth/login'),
    otpVerify: url('/auth/otp/verify'),
    verifyOtp: url('/auth/verify-otp'),
    logout: url('/auth/logout'),
    sendOtp: url('/auth/send-otp'),
    refresh: url('/auth/refresh-token'),
  },
  mpin: {
    set: url('/auth/set-mpin'),
    verify: url('/auth/verify-mpin'),
  },
  users: {
    me: url('/users/me'),
  },
  entries: {
    list: url('/entries'),
    create: url('/entries'),
    detail: (id: Id) => url(`/entries/${id}`),
    delete: (id: Id) => url(`/entries/${id}`),
  },
} as const;

export default apiEndpoint;
