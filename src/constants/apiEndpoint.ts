type Id = string | number;
// process.env.EXPO_PUBLIC_API_BASE_URL ||
const API_BASE_URL = 'https://api.example.com';

const url = (path: string) => `${API_BASE_URL}${path}`;

export const apiEndpoint = {
  baseUrl: API_BASE_URL,
  url,
  auth: {
    login: url('/auth/login'),
    otpVerify: url('/auth/otp/verify'),
    logout: url('/auth/logout'),
  },
  mpin: {
    set: url('/auth/mpin/set'),
    verify: url('/auth/mpin/verify'),
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
