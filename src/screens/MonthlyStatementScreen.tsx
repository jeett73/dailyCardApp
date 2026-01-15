import { Txn, useMonthlyStatement } from '@/component/MonthlyStatementComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { formatToKolkataTime } from '@/utils/dateUtils';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TimeGroup = { time: number; orders: Txn[] };

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
  const hasOrders = orders && orders.length > 0;

  function formatTime(timestamp: number) {
    if (!timestamp) return '';
    return formatToKolkataTime(timestamp);
  }

  // Group orders by time locally
  const timeGroups = useMemo(() => {
    if (!orders) return [];
    const groups: TimeGroup[] = [];
    orders.forEach((ord) => {
      let group = groups.find((g) => g.time === ord.time);
      if (!group) {
        group = { time: ord.time, orders: [] };
        groups.push(group);
      }
      group.orders.push(ord);
    });
    // Sort by time descending
    groups.sort((a, b) => a.time - b.time);
    return groups;
  }, [orders]);

  return (
    <View style={styles.statementCard} accessibilityRole="summary">
      <Text style={[styles.statementTitle, { fontSize: Math.round(20 * scale) }]}>{dayLabel}</Text>
      <View style={styles.statementDivider} />
      {hasOrders ? (
        <>
          {timeGroups.map((group, groupIdx) => (
            <View
              key={`group-${groupIdx}`}
              style={{ marginBottom: 12, backgroundColor: 'transparent' }}
            >
              <Text style={[styles.timeHeader, { fontSize: styles.timeHeader.fontSize }]}>
                [ {formatTime(group.time)} ]
              </Text>
              {group.orders.map((ord) => (
                <View key={ord.id} style={styles.statementRow}>
                  {ord.item === 'Others' ? (
                    <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
                      Others
                    </Text>
                  ) : (
                    <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
                      {ord.item} × {ord.qty}
                    </Text>
                  )}
                  <Text style={[styles.itemQty, { fontSize: Math.round(18 * scale) }]}>
                    ₹{ord.amount}
                  </Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.statementDivider} />
          <View style={styles.statementRow}>
            <Text style={[styles.totalAmount, { fontSize: Math.round(18 * scale) }]}>Total</Text>
            <Text style={[styles.totalAmount, { fontSize: Math.round(18 * scale) }]}>₹{total}</Text>
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

// const SummaryCard = memo(function SummaryCard({
//   totalTxns,
//   totalAmount,
//   avgAmount,
//   scale,
// }: {
//   totalTxns: number;
//   totalAmount: number;
//   avgAmount: number;
//   scale: number;
// }) {
//   return (
//     <View style={styles.summaryCard}>
//       <Text style={[styles.summaryTitle, { fontSize: Math.round(18 * scale) }]}>Summary</Text>
//       <View style={styles.summaryRow}>
//         <Text style={styles.summaryLabel}>Total transactions</Text>
//         <Text style={styles.summaryValue}>{totalTxns}</Text>
//       </View>
//       <View style={styles.summaryRow}>
//         <Text style={styles.summaryLabel}>Total amount</Text>
//         <Text style={styles.summaryValue}>₹{totalAmount}</Text>
//       </View>
//       <View style={styles.summaryRow}>
//         <Text style={styles.summaryLabel}>Average amount</Text>
//         <Text style={styles.summaryValue}>₹{avgAmount.toFixed(2)}</Text>
//       </View>
//     </View>
//   );
// });

export default function MonthlyStatementScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const {
    days,
    groupedByDay,
    // totalTxns,
    // totalAmount,
    // avgAmount,
    scale,
    error,
    fmtDay,
    loading,
    refetch,
    currentMonthLabel,
  } = useMonthlyStatement();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (route.params?.refreshTimestamp) {
      refetch();
    }
  }, [route.params?.refreshTimestamp, refetch]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title={currentMonthLabel} />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.brandPurple} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingTop: Platform.OS === 'ios' ? 120 : insets.top + 90,
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
          {/* <SummaryCard
            totalTxns={totalTxns}
            totalAmount={totalAmount}
            avgAmount={avgAmount}
            scale={scale}
          /> */}
        </ScrollView>
      )}
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
    backgroundColor: Colors.light.orange,
  },

  statementTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  timeHeader: { fontSize: 16, color: '#000', fontWeight: '800', marginBottom: 4, marginTop: 8 },
  statementDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: Colors.light.orange,
  },

  itemName: { fontSize: 18, color: '#000', fontWeight: '300' },
  itemTime: { fontSize: 11, color: '#888', fontWeight: '300', marginLeft: 8 },
  itemQty: { fontSize: 18, color: '#000', fontWeight: '300' },
  totalAmount: { fontSize: 18, color: '#000', fontWeight: '800' },

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
