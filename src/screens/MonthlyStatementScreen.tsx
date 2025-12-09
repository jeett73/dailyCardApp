import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React, { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Txn = { id: string; date: string; item: string; qty: number; amount: number };
type DayEntry = { orders: Txn[]; total: number };
type CatalogItem = { item: string; price: number };

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

const StatementCard = memo(function StatementCard({
  dayLabel,
  orders,
  total,
  scale,
}: {
  dayLabel: string;
  orders: Txn[];
  total: number;
  scale: number;
}) {
  const hasOrders = orders.length > 0;
  return (
    <View style={styles.statementCard} accessibilityRole="summary">
      <Text style={[styles.statementTitle, { fontSize: Math.round(20 * scale) }]}>{dayLabel}</Text>
      <View style={styles.statementDivider} />
      {hasOrders ? (
        <>
          {orders.map((ord) => (
            <View key={ord.id} style={styles.statementRow}>
              <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
                {ord.item} ({ord.qty} × ₹{(ord.amount / ord.qty).toFixed(0)})
              </Text>
              <Text style={[styles.itemQty, { fontSize: Math.round(18 * scale) }]}>
                ₹{ord.amount}
              </Text>
            </View>
          ))}
          <View style={styles.statementDivider} />
          <View style={styles.statementRow}>
            <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
              Total Amount
            </Text>
            <Text style={[styles.itemQty, { fontSize: Math.round(18 * scale) }]}>₹{total}</Text>
          </View>
        </>
      ) : (
        <View style={styles.statementRow}>
          <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>No Orders</Text>
        </View>
      )}
    </View>
  );
});

const SummaryCard = memo(function SummaryCard({
  totalTxns,
  totalAmount,
  avgAmount,
  scale,
}: {
  totalTxns: number;
  totalAmount: number;
  avgAmount: number;
  scale: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryTitle, { fontSize: Math.round(18 * scale) }]}>Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total transactions</Text>
        <Text style={styles.summaryValue}>{totalTxns}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total amount</Text>
        <Text style={styles.summaryValue}>₹{totalAmount}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Average amount</Text>
        <Text style={styles.summaryValue}>₹{avgAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
});

export default function MonthlyStatementScreen() {
  const insets = useSafeAreaInsets();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeroHeader color={Colors.light.brandPurple} title={`Monthly Statement - ${fmtDay(1)}`} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 55,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        {error ? (
          <View style={styles.statementCard}>
            <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
              Unable to load data
            </Text>
          </View>
        ) : null}
        {days.map((day) => {
          const entry = groupedByDay[day] ?? { orders: [], total: 0 };
          return (
            <StatementCard
              key={`day-${day}`}
              dayLabel={fmtDay(day)}
              orders={entry.orders}
              total={entry.total}
              scale={scale}
            />
          );
        })}
        <SummaryCard
          totalTxns={totalTxns}
          totalAmount={totalAmount}
          avgAmount={avgAmount}
          scale={scale}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  screenTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text, paddingHorizontal: 16 },

  statementCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 120,
    backgroundColor: '#a69af7',
  },

  statementTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statementDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#a69af7',
  },

  itemName: { fontSize: 18, color: '#fff', fontWeight: '600' },
  itemQty: { fontSize: 18, color: '#fff', fontWeight: '600' },

  summaryCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  summaryTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
});
