import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import { useOrder, type ShopProduct } from './OrderComponent';

export type Customer = {
  _id?: any;
  name?: string;
  cardNumber?: string | number;
  regularProduct?: any[];
  phone: string | number;
  previousMonthDue?: number;
};

export { ShopProduct };

export function useOwner() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const orderLogic = useOrder();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedInput(input);
    }, 200);
    if (!input) {
      setDebouncedInput('');
    }
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    async function fetchCustomers() {
      const q = debouncedInput.trim();
      if (!q) {
        if (!cancelled) setCustomersLoading(false);
        if (!cancelled) setCustomers([]);
        return;
      }
      if (!cancelled) setCustomersLoading(true);
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.customers.list, {
          params: { shopId: shopId, q },
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers) ? data?.customers : [];
        const list: Customer[] = arr
          .map((item: any) => {
            if (typeof item === 'string') {
              return { name: item } as Customer;
            }
            return item as Customer;
          })
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));
        if (!cancelled) setCustomers(list);
      } catch (e) {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    }
    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [customers, query]);

  function onDigit(d: string) {
    setInput((prev) => (prev + d).slice(0, 10));
  }

  function onBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  function onClear() {
    setInput('');
  }

  function formatCardNumber(card?: string | number) {
    const digits = String(card ?? '').replace(/\D/g, '');
    if (!digits) return '—';
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatMobile(mobile?: string | number) {
    const digits = String(mobile ?? '').replace(/\D/g, '');
    if (!digits) return 'N/A';
    const n = digits.slice(-10);
    return `+91 ${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`;
  }

  // Derive selectedName from orderLogic for backward compatibility
  const selectedName = orderLogic.currentCustomer?.name ?? null;

  // Responsive Logic
  const isTablet = width > 768;
  const contentWidth = isTablet ? 600 : '100%';
  const headerHeight = isTablet ? 320 : 150;
  const cardWidth = isTablet ? '48%' : '100%'; // Grid layout for tablet

  // Animation Logic
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    width,
    // height comes from orderLogic or useWindowDimensions.
    // orderLogic exports height.
    query,
    input,
    customersLoading,
    selectedName,
    customers,
    filtered,
    onDigit,
    onBackspace,
    onClear,
    formatCardNumber,
    formatMobile,
    ...orderLogic,
    // UI Props
    isTablet,
    contentWidth,
    headerHeight,
    cardWidth,
    fadeAnim,
    slideAnim,
  };
}
