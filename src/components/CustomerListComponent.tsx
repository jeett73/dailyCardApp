import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Customer = {
  _id?: any;
  name?: string;
  cardNumber?: string | number;
  phone?: string | number;
  previousMonthDue?: number;
  deposit?: number;
};

function formatCardNumber(card?: string | number) {
  const digits = String(card ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatMobile(phone?: string | number) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return 'N/A';
  const n = digits.slice(-10);
  return `+91 ${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`;
}

function toTitleCaseLocal(s: string) {
  return s
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function useCustomerList(searchQuery = '', showDueOnly = false, sortBy: 'none' | 'card' | 'name' = 'none') {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const requestSeqRef = useRef(0);
  const inFlightSeqRef = useRef<number | null>(null);
  const activeQueryRef = useRef('');
  const requestedPagesByQueryRef = useRef<Map<string, Set<number>>>(new Map());

  /* Use refs for filters to keep fetchCustomers stable but accessing latest values */
  const filtersRef = useRef({ showDueOnly, sortBy });
  filtersRef.current = { showDueOnly, sortBy };

  // Track mount status to avoid double fetch on initial render (handled by useFocusEffect)
  const isMountedRef = useRef(false);

  function customerKey(c: Customer) {
    return String(c._id ?? `${c.name ?? ''}-${c.cardNumber ?? ''}-${c.phone ?? ''}`);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(String(searchQuery ?? ''));
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function hasRequestedPage(query: string, page: number) {
    const set = requestedPagesByQueryRef.current.get(query);
    return !!set && set.has(page);
  }

  function markRequestedPage(query: string, page: number) {
    const map = requestedPagesByQueryRef.current;
    const set = map.get(query) ?? new Set<number>();
    set.add(page);
    map.set(query, set);
  }

  const fetchCustomers = useCallback(
    async (reset: boolean, query: string) => {
      const seq = ++requestSeqRef.current;
      if (reset) {
        setRefreshing(true);
        setError(null);
      } else {
        if (!hasMoreRef.current) return;
        if (inFlightSeqRef.current !== null) return;
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : pageRef.current;
      if (!reset && hasRequestedPage(query, currentPage)) {
        setLoadingMore(false);
        return;
      }

      inFlightSeqRef.current = seq;
      markRequestedPage(query, currentPage);

      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');

        const params: any = { shopId, page: currentPage, limit: LIMIT, q: query };

        // Add filter parameters from ref
        const { showDueOnly: currentDueOnly, sortBy: currentSortBy } = filtersRef.current;
        if (currentDueOnly) {
          params.dueOnly = 'true';
        }
        if (currentSortBy !== 'none') {
          params.sortBy = currentSortBy;
        }

        const res = await getRequest(apiEndpoint.customers.list, {
          params,
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });

        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers)
          ? data?.customers
          : Array.isArray(data)
            ? data
            : [];

        const list: Customer[] = arr
          .map((item: any) => ({
            _id: item?._id,
            name: item?.name,
            cardNumber: item?.cardNumber,
            phone: item?.phone,
            previousMonthDue: Number(item?.previousMonthDue ?? 0),
            deposit: Number(item?.deposit ?? 0),
          }))
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));

        if (activeQueryRef.current !== query) {
          return;
        }

        if (reset) {
          setCustomers(list);
          pageRef.current = 2;
        } else {
          setCustomers((prev) => {
            const existing = new Set(prev.map(customerKey));
            const newOnes = list.filter((c) => !existing.has(customerKey(c)));
            return [...prev, ...newOnes];
          });
          if (pageRef.current === currentPage) {
            pageRef.current = pageRef.current + 1;
          }
        }

        hasMoreRef.current = list.length >= LIMIT;
        setHasMore(hasMoreRef.current);
      } catch {
        setError('Failed to load customers');
      } finally {
        if (inFlightSeqRef.current === seq) {
          inFlightSeqRef.current = null;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [LIMIT],
  );

  // Reset pagination when filters change
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    setLoading(true);
    activeQueryRef.current = debouncedQuery;
    requestedPagesByQueryRef.current = new Map();
    hasMoreRef.current = true;
    setHasMore(true);
    pageRef.current = 1;
    fetchCustomers(true, debouncedQuery);
  }, [showDueOnly, sortBy, fetchCustomers, debouncedQuery]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      activeQueryRef.current = debouncedQuery;
      requestedPagesByQueryRef.current = new Map();
      hasMoreRef.current = true;
      setHasMore(true);
      pageRef.current = 1;
      fetchCustomers(true, debouncedQuery);
    }, [debouncedQuery, fetchCustomers]),
  );

  const items = useMemo(
    () =>
      customers.map((c) => ({
        id: String(c._id ?? `${c.name}-${c.cardNumber ?? ''}`),
        name: toTitleCaseLocal(String(c.name || '').trim()),
        card: `#${formatCardNumber(c.cardNumber)}`,
        mobile: formatMobile(c.phone),
        dueDisplay: `₹${Number(c?.previousMonthDue ?? 0)}`,
        previousMonthDue: Number(c?.previousMonthDue ?? 0),
        phone: String(c?.phone ?? ''),
        cardNumber: String(c?.cardNumber ?? ''),
        deposit: Number(c?.deposit ?? 0),
      })),
    [customers],
  );

  function onAddPress() {
    navigation.navigate('CreateCustomer');
  }

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh: () => fetchCustomers(true, debouncedQuery),
    loadMore: () => fetchCustomers(false, debouncedQuery),
    hasMore,
    onAddPress,
  };
}
