import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type Customer = {
  _id?: any;
  name?: string;
  cardNumber?: string | number;
  phone?: string | number;
  previousMonthDue?: number;
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

export function useCustomerList() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.customers.list, {
          params: { shopId },
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers) ? data?.customers : [];
        const list: Customer[] = arr
          .map((item: any) => ({
            _id: item?._id,
            name: item?.name,
            cardNumber: item?.cardNumber,
            phone: item?.phone,
            previousMonthDue: Number(item?.previousMonthDue ?? 0),
          }))
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));
        setCustomers(list);
        setLoading(false);
      } catch {
        setError('Failed to load customers');
        setLoading(false);
      }
    })();
  }, []);

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
      })),
    [customers],
  );

  function onAddPress() {
    navigation.navigate('CreateCustomer');
  }

  return { items, loading, error, onAddPress };
}
