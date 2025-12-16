import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

export type Txn = { id: string; date: string; item: string; qty: number; amount: number };
export type MonthSummary = { year: number; month: number; label: string; total: number };

const MONTHS_FULL = [
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

const catalog = [
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

export function useMonthWiseReport() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  const isWide = width >= 768;
  const cardWidth = isWide ? '48%' : '100%';

  useEffect(() => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const data: MonthSummary[] = Array.from({ length: 12 }, (_, m) => {
        const txns = generateMonthlyTxns(year, m);
        const total = txns.reduce((s, t) => s + t.amount, 0);
        return { year, month: m, label: `${MONTHS_FULL[m]} ${year}`, total };
      });
      setMonths(data);
      setLoading(false);
    } catch {
      setError('Failed to load monthly report');
      setLoading(false);
    }
  }, []);

  const handleNavigate = (m: MonthSummary) => {
    navigation.navigate('Statements');
    // if (navLoading) return;
    // setNavLoading(true);
    // try {
    //   const params = { year: m.year, month: m.month };
    //   navigation.navigate('Statements', params);
    // } catch {
    //   setNavLoading(false);
    //   setError('Failed to navigate to Monthly Statement');
    // }
  };

  return {
    loading,
    error,
    months,
    navLoading,
    cardWidth,
    handleNavigate,
  };
}
