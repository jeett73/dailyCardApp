type Id = string | number;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.codestoryteller.blog';

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
    delete: (id: Id) => url(`/customers/${id}`),
  },
  cards: {
    order: url('/cards/order'),
    monthlyStatement: (customerId: string, shopId: string) =>
      url(`/cards?customerId=${customerId}&shopId=${shopId}`),
    summary: (customerId: string, shopId: string) =>
      url(`/cards/summary?customerId=${customerId}&shopId=${shopId}`),
    dueCards: (customerId: string, shopId: string) =>
      url(`/cards/due-cards?customerId=${customerId}&shopId=${shopId}`),
    payment: url('/cards/payment-done'),
    recentOrder: (shopId: string, page: number, limit: number, q?: string) =>
      url(`/cards/recent-orders?shopId=${shopId}&page=${page}&limit=${limit}${q ? `&q=${q}` : ''}`),
    updateOrderPost: url('/cards/update-order'),
    duesDetails: (customerId: string, shopId: string) =>
      url(`/cards/dues-details?customerId=${customerId}&shopId=${shopId}`),
  },
  shopProducts: {
    listShopProducts: url('/shop-products'),
    add: url('/shop-products/add'),
  },
  products: {
    list: url('/products'),
  },
  shops: {
    resetPassword: (shopId: string) => url(`/shops/${shopId}/password`),
  },
  uploads: (icon: string) => url(`/uploads/${icon}`),
} as const;

export default apiEndpoint;
