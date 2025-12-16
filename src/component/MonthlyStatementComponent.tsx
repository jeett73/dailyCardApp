import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

export type Txn = { id: string; date: string; item: string; qty: number; amount: number };
export type DayEntry = { orders: Txn[]; total: number };
export type CatalogItem = { item: string; price: number };

const MONTHS_SHORT = [
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

const catalog: CatalogItem[] = [
  { item: 'Amul Gold', price: 60 },
  { item: 'Shaktii', price: 45 },
  { item: 'Butter Milk', price: 20 },
  { item: 'Cow Milk', price: 20 },
  { item: 'Heritage Toned Milk 1L', price: 50 },
  { item: 'Amul Fresh Cream 250ml', price: 70 },
  { item: 'Britannia Rusk 300g', price: 35 },
  { item: 'Gowardhan Butter 100g', price: 48 },
  { item: 'Nandini Curd 500g', price: 30 },
  { item: 'Sanchi Ghee 200ml', price: 95 },
];

function generateMonthlyTxns(year: number, month: number): Txn[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const txns: Txn[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const itemsCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < itemsCount; i++) {
      const ci = catalog[Math.floor(Math.random() * catalog.length)];
      const qty = 1 + Math.floor(Math.random() * 5);
      const amount = qty * ci.price;
      const id = `m-${year}-${month + 1}-${day}-${i}`;
      const date = new Date(year, month, day).toISOString().split('T')[0];
      txns.push({ id, date, item: ci.item, qty, amount });
    }
  }
  return txns;
}

export function useMonthlyStatement() {
  const { width } = useWindowDimensions();
  const scale = width >= 768 ? 1.1 : width <= 360 ? 0.95 : 1;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const upto = today.getDate();

  const [error, setError] = useState<string | null>(null);

  const txns = useMemo(() => {
    try {
      return generateMonthlyTxns(currentYear, currentMonth);
    } catch {
      setError('Failed to load data');
      return [];
    }
  }, [currentYear, currentMonth]);

  const days = useMemo(() => Array.from({ length: upto }, (_, i) => i + 1), [upto]);

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

  return {
    days,
    groupedByDay,
    totalTxns,
    totalAmount,
    avgAmount,
    scale,
    error,
    fmtDay,
  };
}
