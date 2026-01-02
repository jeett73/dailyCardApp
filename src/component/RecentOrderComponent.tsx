import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
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
  }[];
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
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      // Assuming entries.list returns recent orders.
      // We might need to sort them or filter by date if the API doesn't do it.
      const res = await getRequest(apiEndpoint.cards.recentOrder);

      const data = (res?.data ?? []) as any;
      const arr = Array.isArray(data?.entries) ? data?.entries : Array.isArray(data) ? data : [];

      const list: RecentOrder[] = arr.map((item: any) => ({
        _id: item?._id,
        customerName: item?.customerName || item?.customer?.name,
        cardNumber: item?.cardNumber || item?.customer?.cardNumber,
        phoneNumber: item?.phoneNumber || item?.customer?.phone,
        amount: Number(item?.totalAmount ?? 0),
        date: item?.createdAt || item?.date,
        products: Array.isArray(item?.products) ? item.products : [],
      }));

      setOrders(list);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError('Failed to load recent orders');
      setLoading(false);
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
        dateDisplay: new Date(o.date).toLocaleString(),
        raw: o,
      })),
    [orders],
  );

  return { items, loading, error, refresh: fetchOrders };
}
