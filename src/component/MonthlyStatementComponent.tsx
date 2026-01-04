import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

export type Txn = {
  id: string;
  date: string;
  item: string;
  qty: number;
  amount: number;
  time: number;
};
export type DayEntry = { orders: Txn[]; total: number };

// API Response Types
interface ProductItem {
  productId: string;
  time: number;
  qty: number;
  price: number;
  productName: string;
  icon: string;
}

interface OtherItem {
  time: number;
  price: number;
}

interface DailyProduct {
  day: number;
  product: ProductItem[];
  others?: OtherItem[];
}

interface CardData {
  _id: string;
  customerId: string;
  shopId: string;
  month: number;
  year: number;
  totalBill: number;
  products: DailyProduct[];
}

interface MonthlyStatementResponse {
  card: CardData;
}

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function useMonthlyStatement() {
  const { width } = useWindowDimensions();
  const scale = width >= 768 ? 1.1 : width <= 360 ? 0.95 : 1;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const upto = today.getDate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customerId = await getItem('userId');
      const shopId = await getItem('shopId');
      const url = apiEndpoint.cards.monthlyStatement(customerId!, shopId!);
      const res = await getRequest(url);
      const data = res.data as MonthlyStatementResponse;
      setCardData(data.card);
    } catch (err) {
      console.error('Failed to fetch monthly statement', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const txns = useMemo(() => {
    if (!cardData || !cardData.products) return [];

    const allTxns: Txn[] = [];

    cardData.products.forEach((daily) => {
      daily.product.forEach((prod) => {
        const date = new Date(prod.time).toISOString().split('T')[0];
        allTxns.push({
          id: `${prod.productId}-${prod.time}`,
          date: date,
          item: prod.productName,
          qty: prod.qty,
          amount: prod.qty * prod.price,
          time: prod.time,
        });
      });

      if (daily.others && daily.others.length > 0) {
        // We aggregate all "others" for a single day into one entry or list them individually?
        // Requirement: "Others And total of price from others array"
        // If the UI shows a list of transactions per day, we can add each 'other' item or sum them up.
        // "We will show like this Others And total of price from others array"
        // It sounds like we should show individual entries but labeled "Others" or maybe aggregated.
        // Let's list them individually but with item name "Others".
        // Actually, if there are multiple "others" entries in one day, showing "Others" multiple times might be fine.
        // Or we can sum them up if they have exact same time?
        // Let's add them as individual transactions for now, as that fits the current Txn structure.

        daily.others.forEach((other, idx) => {
          const date = new Date(other.time).toISOString().split('T')[0];
          allTxns.push({
            id: `other-${other.time}-${idx}`,
            date: date,
            item: 'Others',
            qty: 1,
            amount: other.price,
            time: other.time,
          });
        });
      }
    });

    return allTxns;
  }, [cardData]);

  const days = useMemo(() => Array.from({ length: upto }, (_, i) => upto - i), [upto]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() <= upto
      );
    });
  }, [txns, currentYear, currentMonth, upto]);

  const groupedByDay = useMemo(() => {
    const res: Record<number, DayEntry> = {};
    for (const t of filtered) {
      const day = new Date(t.date).getDate();
      const entry = res[day] ?? { orders: [], total: 0 };
      entry.orders.push(t);
      entry.total += t.amount;
      res[day] = entry;
    }
    return res;
  }, [filtered]);

  const totalAmount = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalTxns = filtered.length;
  const avgAmount = useMemo(
    () => (totalTxns > 0 ? totalAmount / totalTxns : 0),
    [totalAmount, totalTxns],
  );

  function fmtDay(day: number) {
    return `${day} ${MONTHS_SHORT[currentMonth]} ${currentYear}`;
  }

  const currentMonthLabel = `${MONTHS_FULL[currentMonth]} ${currentYear}`;

  return {
    days,
    groupedByDay,
    totalTxns,
    totalAmount,
    avgAmount,
    scale,
    error,
    fmtDay,
    loading,
    refetch: fetchStatement,
    currentMonthLabel,
  };
}
