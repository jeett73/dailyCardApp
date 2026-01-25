import { Txn, useCustomerDetail } from '@/components/CustomerDetailComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { formatToKolkataTime } from '@/utils/dateUtils';
import React, { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatMobile(phone?: string | number) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return 'N/A';
  const n = digits.slice(-10);
  return `+91 ${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`;
}

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
                      {ord.item} ×{ord.qty}
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

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const {
    customer,
    dues,
    selectedDueIndex,
    setSelectedDueIndex,
    groupedByDay,
    days,
    loading,
    ordersLoading,
    error,
    fmtDay,
  } = useCustomerDetail();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeroHeader color={Colors.light.brandPurple} title="Customer Detail" />
      <View
        style={[
          styles.contentContainer,
          { paddingTop: Platform.OS === 'ios' ? 110 : insets.top + 90 },
        ]}
      >
        {/* Customer Details Section */}
        <View style={styles.customerCard}>
          <View style={styles.customerRow}>
            <AvatarInitials title={customer.name} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>
                <Text style={{ fontStyle: 'italic' }}>#{customer.cardNumber}</Text> {customer.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{formatMobile(customer.phone)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Deposit</Text>
                <Text style={styles.metaValue}> ₹{customer.deposit || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Due Months Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Due Months</Text>
        </View>
        {dues.length === 0 ? (
          <View style={[styles.customerCard, styles.fullWidthCard]}>
            <View style={[styles.customerRow, styles.centerRow]}>
              <Text style={styles.emptyText}>No dues found</Text>
            </View>
          </View>
        ) : (
          <View style={{ height: 100, backgroundColor: '#fff' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dueScroll}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {dues.map((due, index) => (
                <TouchableOpacity
                  key={`${due.year}-${due.month}`}
                  style={[styles.dueCard, selectedDueIndex === index && styles.dueCardSelected]}
                  onPress={() => setSelectedDueIndex(index)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.dueLabel, selectedDueIndex === index && styles.dueLabelSelected]}
                  >
                    {due.label}
                  </Text>
                  <Text
                    style={[
                      styles.dueAmount,
                      selectedDueIndex === index && styles.dueAmountSelected,
                    ]}
                  >
                    Due: ₹{due.amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Monthly Orders Section */}
        {dues.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Orders</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {ordersLoading ? (
          <ActivityIndicator size="small" color={Colors.light.tint} style={{ marginTop: 2 }} />
        ) : days.length === 0 && dues.length > 0 ? (
          <View style={[styles.customerCard, styles.fullWidthCard]}>
            <View style={styles.customerRow}>
              <Text style={styles.emptyText}>No orders for this month</Text>
            </View>
          </View>
        ) : (
          days.map((day) => {
            const entry = groupedByDay[day];
            return (
              <StatementCard
                key={`day-${day}`}
                dayLabel={fmtDay(day)}
                orders={entry.orders}
                total={entry.total}
                scale={1}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { paddingHorizontal: 16, backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#e53935' },

  customerCard: {
    // backgroundColor: '#fff',
    // borderRadius: 12,
    // padding: 16,
    // marginBottom: 5,
    // // shadowColor: '#000',
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 4 },
    // elevation: 3,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  centerRow: { justifyContent: 'center', width: '100%' },
  customerInfo: { marginLeft: 16, flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  metaRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center', backgroundColor: '#fff' },
  metaLabel: { fontSize: 14, color: '#666', width: 50 },
  metaValue: { fontSize: 14, color: Colors.light.text, fontWeight: '600' },
  fullWidthCard: { width: '100%' },

  sectionHeader: { marginBottom: 5, marginTop: 5, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },

  dueScroll: { marginBottom: 5, flexDirection: 'row', backgroundColor: '#fff' },
  dueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
  },
  dueCardSelected: {
    backgroundColor: Colors.light.brandPurple,
    borderColor: Colors.light.brandPurple,
  },
  dueLabel: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  dueLabelSelected: { color: '#fff' },
  dueAmount: { fontSize: 14, color: '#666' },
  dueAmountSelected: { color: 'rgba(255,255,255,0.9)' },

  emptyText: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 8 },

  statementCard: {
    marginTop: 12,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.orange,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 120,
  },
  statementTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  statementDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    backgroundColor: 'rgba(0,0,0)',
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  timeHeader: { fontSize: 16, color: '#000', fontWeight: '800', marginBottom: 4, marginTop: 8 },
  itemName: { fontSize: 18, color: '#000', fontWeight: '300' },
  itemQty: { fontSize: 18, color: '#000', fontWeight: '300' },
  totalAmount: { fontSize: 18, color: '#000', fontWeight: '800' },
});
