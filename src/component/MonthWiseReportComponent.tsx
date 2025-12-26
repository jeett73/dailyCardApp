import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { DimensionValue, useWindowDimensions } from 'react-native';

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

const SHOP_ID = '692f04d99800aaaa111ccd9b';

export function useMonthWiseReport() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  const isWide = width >= 768;
  const cardWidth: DimensionValue = isWide ? '48%' : '100%';

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('token');
        const userId = await getItem('userId');
        const customerId = userId; // Assuming logged in user is customer

        if (!customerId) {
          setError('User not identified');
          setLoading(false);
          return;
        }

        const res = await getRequest(apiEndpoint.cards.summary(customerId, SHOP_ID), {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });

        const data = (res?.data ?? []) as any[];

        // Expected data: [{ "month": 12, "year": 2025, "totalBill": 5777 }]
        const mapped: MonthSummary[] = data.map((item: any) => {
          const m = (item.month || 1) - 1; // 1-based to 0-based
          const y = item.year || new Date().getFullYear();
          const label = (MONTHS_FULL[m] || 'Unknown') + ' ' + y;
          return {
            year: y,
            month: m,
            label: label,
            total: Number(item.totalBill || 0),
          };
        });

        setMonths(mapped);
        setLoading(false);
      } catch (e) {
        setError('Failed to load monthly report');
        setLoading(false);
      }
    })();
  }, []);

  const handleNavigate = (m: MonthSummary) => {
    navigation.navigate('Statements', { year: m.year, month: m.month });
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
