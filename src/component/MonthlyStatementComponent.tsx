import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { formatToKolkataDateString, getKolkataCurrentDate } from '@/utils/dateUtils';
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

export function useMonthlyStatement(year?: number, month?: number) {
  const { width } = useWindowDimensions();
  const scale = width >= 768 ? 1.1 : width <= 360 ? 0.95 : 1;

  const {
    year: currentYear,
    month: currentMonth,
    day: currentDay,
  } = getKolkataCurrentDate();

  // If year/month provided, use them. Else use current date.
  const isHistoryMode = year !== undefined && month !== undefined;

  // Display year/month
  const displayYear = isHistoryMode ? year : currentYear;
  const displayMonth = isHistoryMode ? month : currentMonth;

  // For current month, show up to today. For past months, show all days (up to 31).
  const daysInMonth = useMemo(() => {
    if (!displayYear || displayMonth === undefined) return 30;
    // get days in month: new Date(year, month + 1, 0).getDate()
    // month is 0-indexed in JS Date
    return new Date(displayYear, displayMonth + 1, 0).getDate();
  }, [displayYear, displayMonth]);


  const upto = isHistoryMode ? daysInMonth : currentDay;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customerId = await getItem('userId');
      const shopId = await getItem('shopId');

      if (!customerId || !shopId) {
        setError("User not identified");
        setLoading(false);
        return;
      }

      let res;
      if (isHistoryMode) {
        // POST /cards/monthly-details
        // Body: { customerId, shopId, month: month + 1, year }
        // API expects 1-based month? Yes, usually. Our internal is 0-based.
        // User request: "month": , "year":

        const payload = {
          customerId,
          shopId,
          month: (month || 0) + 1, // Convert 0-based to 1-based
          year: year
        };

        res = await postRequest(apiEndpoint.cards.monthlyDetails, payload);
      } else {
        // GET /cards/monthly-statement (Current month)
        const url = apiEndpoint.cards.monthlyStatement(customerId, shopId);
        res = await getRequest(url);
      }

      const data = res?.data as MonthlyStatementResponse;
      setCardData(data?.card || null);

    } catch (err) {
      console.error('Failed to fetch monthly statement', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isHistoryMode, year, month]);

  const txns = useMemo(() => {
    if (!cardData || !cardData.products) return [];

    const allTxns: Txn[] = [];

    cardData.products.forEach((daily, dailyIdx) => {
      daily.product.forEach((prod) => {
        const date = formatToKolkataDateString(prod.time);
        allTxns.push({
          id: `${dailyIdx}-${prod.productId}-${prod.time}`,
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
          const date = formatToKolkataDateString(other.time);
          allTxns.push({
            id: `other-${dailyIdx}-${other.time}-${idx}`,
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
      const [yStr, mStr, dStr] = t.date.split('-');
      const tYear = parseInt(yStr, 10);
      const tMonth = parseInt(mStr, 10) - 1;
      const tDay = parseInt(dStr, 10);
      return tYear === displayYear && tMonth === displayMonth && tDay <= upto;
    });
  }, [txns, displayYear, displayMonth, upto]);

  const groupedByDay = useMemo(() => {
    const res: Record<number, DayEntry> = {};
    for (const t of filtered) {
      const day = parseInt(t.date.split('-')[2], 10);
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
    return `${day} ${MONTHS_SHORT[displayMonth]} ${displayYear}`;
  }

  const currentMonthLabel = `${MONTHS_FULL[displayMonth]} ${displayYear}`;

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
