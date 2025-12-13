type Id = string | number;
// const API_BASE_URL = 'http://172.20.10.2:3000';
const API_BASE_URL = 'http://10.210.52.6:3000';

const url = (path: string) => `${API_BASE_URL}${path}`;

const apiEndpoint = {
  baseUrl: API_BASE_URL,
  url,
  auth: {
    login: url('/auth/login'),
    otpVerify: url('/auth/otp/verify'),
    verifyOtp: url('/auth/verify-otp'),
    logout: url('/auth/logout'),
    sendOtp: url('/auth/send-otp'),
    refresh: url('/auth/refresh'),
  },
  mpin: {
    set: url('/auth/set-mpin'),
    verify: url('/auth/verify-mpin'),
  },
  customers: {
    list: url('/customers'),
    add: url('/customers/add'),
  },
  entries: {
    list: url('/entries'),
    create: url('/entries'),
    detail: (id: Id) => url(`/entries/${id}`),
    delete: (id: Id) => url(`/entries/${id}`),
  },
  cards: {
    order: url('/cards/order'),
  },
  shopProducts: {
    listShopProducts: url('/shop-products'),
  },
} as const;

export default apiEndpoint;
