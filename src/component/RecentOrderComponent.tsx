import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

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
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  useEffect(() => {
    fetchOrders(true);
  }, []);

  async function fetchOrders(reset = false) {
    if (reset) {
      setRefreshing(true);
      setError(null);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const shopId = await getItem('userId');
      const currentPage = reset ? 1 : page;
      const res = await getRequest(apiEndpoint.cards.recentOrder(shopId, currentPage, LIMIT));

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
            ? new Date(item.year, item.month - 1).toISOString()
            : new Date().toISOString()),
        products: Array.isArray(item?.products) ? item.products : [],
        others: Array.isArray(item?.others) ? item.others : [],
        cardId: item?.cardId || item?.card?._id || item?.card,
        day: item?.day,
      }));

      if (reset) {
        setOrders(list);
        setPage(2);
        setHasMore(list.length >= LIMIT);
        setLoading(false);
      } else {
        setOrders((prev) => [...prev, ...list]);
        setPage((prev) => prev + 1);
        setHasMore(list.length >= LIMIT);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load recent orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

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
