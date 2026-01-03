import { getRequest } from '@/api/apiMethods';
import { MONTHS_FULL, MONTHS_SHORT } from '@/component/MonthlyStatementComponent';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

export type Txn = { id: string; date: string; item: string; qty: number; amount: number };
export type DayEntry = { orders: Txn[]; total: number };

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  cardNumber: string;
}

export interface DueMonth {
  month: number;
  year: number;
  label: string;
  amount: number;
}

export function useCustomerDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const customerIdParam = route.params?.customerId;

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [dues, setDues] = useState<DueMonth[]>([]);
  const [selectedDueIndex, setSelectedDueIndex] = useState<number>(0);
  const [orders, setOrders] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerIdParam) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const shopId = await getItem('userId');
        const token = await getItem('token');
        const headers = { authorization: token ? `Bearer ${token}` : '' };

        // Fetch Customer Details
        const custRes = await getRequest(apiEndpoint.customers.customerById(customerIdParam));
        const custData = (custRes?.data ?? {}) as any;
        const c = custData?.customer ?? custData;
        if (c) {
          setCustomer({
            id: String(c._id ?? c.id),
            name: String(c.name ?? ''),
            phone: String(c.phone ?? ''),
            cardNumber: String(c.cardNumber ?? ''),
          });
        }

        // Fetch Due Months
        const dueRes = await getRequest(
          apiEndpoint.cards.dueCards(customerIdParam, String(shopId ?? '')),
          { headers },
        );
        const dueData = (dueRes?.data ?? {}) as any;
        const dueArr = Array.isArray(dueData?.dues)
          ? dueData?.dues
          : Array.isArray(dueData)
          ? dueData
          : [];
        const mappedDues: DueMonth[] = dueArr
          .map((d: any) => {
            const m = Number(d?.month ?? 0);
            const y = Number(d?.year ?? 0);
            if (!m || !y) return null;
            return {
              month: m,
              year: y,
              label: `${MONTHS_FULL[m - 1] ?? 'Month'} ${y}`,
              amount: Number(d?.dueAmount ?? d?.due ?? 0),
            };
          })
          .filter((d: any) => d !== null);

        setDues(mappedDues);
        if (mappedDues.length > 0) {
          setSelectedDueIndex(0);
        }
      } catch (e) {
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    })();
  }, [customerIdParam]);

  useEffect(() => {
    const selected = dues[selectedDueIndex];
    if (!selected || !customerIdParam) {
      setOrders([]);
      return;
    }

    (async () => {
      try {
        setOrdersLoading(true);
        const shopId = await getItem('userId');
        const token = await getItem('token');
        
        // Fetch Orders for selected month
        // Note: apiEndpoint.cards.monthlyStatement updated to accept month/year
        const url = apiEndpoint.cards.monthlyStatement(
          customerIdParam,
          String(shopId ?? ''),
          selected.month,
          selected.year,
        );
        const res = await getRequest(url, {
            headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? {}) as any;
        const cardData = data?.card; // Assuming response structure { card: { products: ... } }

        if (cardData && Array.isArray(cardData.products)) {
          const allTxns: Txn[] = [];
          cardData.products.forEach((daily: any) => {
            if (Array.isArray(daily.product)) {
              daily.product.forEach((prod: any) => {
                const date = new Date(prod.time).toISOString().split('T')[0];
                allTxns.push({
                  id: `${prod.productId}-${prod.time}`,
                  date: date,
                  item: prod.productName,
                  qty: prod.qty,
                  amount: prod.qty * prod.price,
                });
              });
            }
          });
          setOrders(allTxns);
        } else {
            setOrders([]);
        }
      } catch (e) {
        // console.error(e);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [selectedDueIndex, dues, customerIdParam]);

  const groupedByDay = useMemo(() => {
    const res: Record<number, DayEntry> = {};
    for (const t of orders) {
      const day = new Date(t.date).getDate();
      const entry = res[day] ?? { orders: [], total: 0 };
      entry.orders.push(t);
      entry.total += t.amount;
      res[day] = entry;
    }
    return res;
  }, [orders]);

  const days = useMemo(() => {
     // Sort days descending
     const d = Object.keys(groupedByDay).map(Number).sort((a, b) => b - a);
     return d;
  }, [groupedByDay]);

  function fmtDay(day: number) {
    const selected = dues[selectedDueIndex];
    if (!selected) return `${day}`;
    return `${day} ${MONTHS_SHORT[selected.month - 1]} ${selected.year}`;
  }

  return {
    customer,
    dues,
    selectedDueIndex,
    setSelectedDueIndex,
    orders,
    groupedByDay,
    days,
    loading,
    ordersLoading,
    error,
    fmtDay,
  };
}
