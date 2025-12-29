type Id = string | number;
const API_BASE_URL = 'http://172.20.10.2:3000';
// const API_BASE_URL = 'http://10.210.52.6:3000';

const url = (path: string) => `${API_BASE_URL}${path}`;

const apiEndpoint = {
  baseUrl: API_BASE_URL,
  url,
  auth: {
    login: url('/auth/login'),
    verifyOtp: url('/auth/verify-otp'),
    logout: url('/auth/logout'),
    logoutUser: (id: Id) => url(`/auth/logout/${id}`),
    sendOtp: url('/auth/send-otp'),
    refresh: url('/auth/refresh'),
  },
  mpin: {
    set: url('/auth/set-mpin'),
    verify: url('/auth/verify-mpin'),
  },
  customers: {
    list: url('/customers'),
    customerById: (id: Id) => url(`/customers/${id}`),
    add: url('/customers/add'),
    update: (id: Id) => url(`/customers/${id}`),
    dues: (customerId: Id, shopId: Id) =>
      url(`/customers/dues?customerId=${customerId}&shopId=${shopId}`),
    pay: url('/customers/pay'),
  },
  entries: {
    list: url('/entries'),
    create: url('/entries'),
    detail: (id: Id) => url(`/entries/${id}`),
    delete: (id: Id) => url(`/entries/${id}`),
  },
  cards: {
    order: url('/cards/order'),
    monthlyStatement: (customerId: string, shopId: string) =>
      url(`/cards?customerId=${customerId}&shopId=${shopId}`),
    summary: (customerId: string, shopId: string) =>
      url(`/cards/summary?customerId=${customerId}&shopId=${shopId}`),
  },
  shopProducts: {
    listShopProducts: url('/shop-products'),
    add: url('/shop-products/add'),
  },
  products: {
    list: url('/products'),
  },
  uploads: (icon: string) => url(`/uploads/${icon}`),
} as const;

export default apiEndpoint;
