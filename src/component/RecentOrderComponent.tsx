import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { formatToKolkataDateString } from '@/utils/dateUtils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type RecentOrder = {
  _id: string;
  customerName: string;
  cardNumber: string;
  phoneNumber: string;
  amount: number;
  date: string;
  products: {
    productId: string;
    productName: string;
    qty: number;
    price: number;
    time: number;
  }[];
  others: {
    time: number;
    price: number;
  }[];
  cardId: string;
  day: number;
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

export function useRecentOrder() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const requestSeqRef = useRef(0);
  const inFlightSeqRef = useRef<number | null>(null);

  function orderKey(o: RecentOrder) {
    return String(o._id ?? '');
  }

  const fetchOrders = useCallback(
    async (reset: boolean) => {
      const seq = ++requestSeqRef.current;

      if (reset) {
        setLoading(true);
        setRefreshing(true);
        setError(null);
      } else {
        if (!hasMoreRef.current) return;
        if (inFlightSeqRef.current !== null) return;
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : pageRef.current;
      if (!reset && requestedPagesRef.current.has(currentPage)) {
        setLoadingMore(false);
        return;
      }

      inFlightSeqRef.current = seq;
      requestedPagesRef.current.add(currentPage);

      try {
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.cards.recentOrder(shopId!, currentPage, LIMIT));

        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.orders) ? data?.orders : Array.isArray(data) ? data : [];

        const list: RecentOrder[] = arr.map((item: any) => ({
          _id: item?._id,
          customerName: item?.customerName || item?.customer?.name,
          cardNumber: item?.cardNumber || item?.customer?.cardNumber,
          phoneNumber: item?.phone || item?.phoneNumber || item?.customer?.phone,
          amount: Number(item?.totalBill ?? item?.totalAmount ?? 0),
          date:
            item?.createdAt ||
            item?.date ||
            (item?.month && item?.year
              ? `${item.year}-${String(item.month).padStart(2, '0')}-01`
              : formatToKolkataDateString(new Date())),
          products: Array.isArray(item?.products) ? item.products : [],
          others: Array.isArray(item?.others) ? item.others : [],
          cardId: item?.cardId || item?.card?._id || item?.card,
          day: item?.day,
        }));

        if (reset) {
          setOrders(list);
          pageRef.current = 2;
        } else {
          setOrders((prev) => {
            const existing = new Set(prev.map(orderKey));
            const newOnes = list.filter((o) => !existing.has(orderKey(o)));
            return [...prev, ...newOnes];
          });
          if (pageRef.current === currentPage) {
            pageRef.current = pageRef.current + 1;
          }
        }

        hasMoreRef.current = list.length >= LIMIT;
        setHasMore(hasMoreRef.current);
      } catch {
        setError('Failed to load recent orders');
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

  useEffect(() => {
    setLoading(true);
    requestedPagesRef.current = new Set();
    hasMoreRef.current = true;
    setHasMore(true);
    pageRef.current = 1;
    fetchOrders(true);
  }, [fetchOrders]);

  const items = useMemo(
    () =>
      orders.map((o) => ({
        id: o._id,
        name: toTitleCaseLocal(String(o.customerName || '').trim()),
        card: `#${formatCardNumber(o.cardNumber)}`,
        mobile: formatMobile(o.phoneNumber),
        amountDisplay: `₹${o.amount}`,
        amount: o.amount,
        raw: o,
      })),
    [orders],
  );

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh: () => fetchOrders(true),
    loadMore: () => fetchOrders(false),
    hasMore,
  };
}
