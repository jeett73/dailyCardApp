import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';

type Customer = {
  _id?: any;
  name?: string;
  cardNumber?: string | number;
  mobile?: string | number;
  dueAmount?: number;
};

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
            mobile: item?.mobile,
            dueAmount: Number(item?.lastDueAmount ?? item?.dueAmount ?? 0),
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
        mobile: formatMobile(c.mobile),
        dueDisplay: `₹${Number(c?.dueAmount ?? 0)}`,
      })),
    [customers],
  );

  function onAddPress() {
    navigation.navigate('CreateCustomer');
  }

  return { items, loading, error, onAddPress };
}
