import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Txn = { id: string; date: string; item: string; qty: number; amount: number };
type MonthSummary = { year: number; month: number; label: string; total: number };

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

type StatementsParams = { year: number; month: number };

export default function MonthWiseReportScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  const content = useMemo(() => {
    if (loading) {
      return <Text style={styles.loading}>Loading...</Text>;
    }
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    return months.map((m) => (
      <Pressable
        key={`${m.year}-${m.month}`}
        onPress={() => {
          navigation.navigate('Statements');
          // return;
          // if (navLoading) return;
          // setNavLoading(true);
          // try {
          //   const params: StatementsParams = { year: m.year, month: m.month };
          //   (navigation as any).navigate('Statements', params);
          // } catch {
          //   setNavLoading(false);
          //   z;
          //   // Show inline error state for navigation failures
          //   // Navigation errors are rare; this ensures graceful fallback
          //   setError('Failed to navigate to Monthly Statement');
          // }
        }}
        style={({ pressed }) => [
          styles.statementCard,
          { width: cardWidth },
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${m.label}`}
        accessibilityHint="Shows monthly statement for selected month"
      >
        <Text style={styles.statementTitle}>{m.label}</Text>
        <View style={styles.statementDivider} />
        <View style={styles.statementRow}>
          <Text style={styles.itemName}>Total Amount</Text>
          <Text style={styles.itemQty}>₹{m.total}</Text>
        </View>
      </Pressable>
    ));
  }, [months, loading, error, cardWidth, navigation, navLoading]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <Text style={styles.screenTitle}>Month-wise Report</Text>
        <View style={styles.grid}>{content}</View>
        {navLoading && (
          <View style={styles.navOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.navOverlayText}>Navigating…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  grid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statementCard: {
    marginTop: 16,
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
  cardPressed: { opacity: 0.85 },
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
  loading: { fontSize: 14, color: Colors.light.text },
  error: { fontSize: 14, color: '#e53935' },
  navOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  navOverlayText: { marginTop: 8, fontSize: 14, color: Colors.light.text, fontWeight: '700' },
});
