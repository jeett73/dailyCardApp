import { Txn, useCustomerDetail } from '@/components/CustomerDetailComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StatementCard = memo(function StatementCard({
  dayLabel,
  orders,
  total,
}: {
  dayLabel: string;
  orders: Txn[];
  total: number;
}) {
  const hasOrders = orders.length > 0;
  return (
    <View style={styles.statementCard}>
      <Text style={styles.statementTitle}>{dayLabel}</Text>
      <View style={styles.statementDivider} />
      {hasOrders ? (
        <>
          {orders.map((ord) => (
            <View key={ord.id} style={styles.statementRow}>
              <Text style={styles.itemName}>
                {ord.item} ({ord.qty} × ₹{(ord.amount / ord.qty).toFixed(0)})
              </Text>
              <Text style={styles.itemQty}>₹{ord.amount}</Text>
            </View>
          ))}
          <View style={styles.statementDivider} />
          <View style={styles.statementRow}>
            <Text style={styles.itemName}>Total Amount</Text>
            <Text style={styles.itemQty}>₹{total}</Text>
          </View>
        </>
      ) : (
        <View style={styles.statementRow}>
          <Text style={styles.itemName}>No Orders</Text>
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
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Platform.OS === 'ios' ? 110 : insets.top + 90 },
          { paddingBottom: Math.max(insets.bottom, 24) },
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
                <Text style={styles.metaValue}>{customer.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Due Months Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Due Months</Text>
        </View>
        <View style={{ height: 100 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dueScroll}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {dues.length === 0 ? (
              <Text style={styles.emptyText}>No dues found</Text>
            ) : (
              dues.map((due, index) => (
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
              ))
            )}
          </ScrollView>
        </View>

        {/* Monthly Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Orders</Text>
        </View>

        {ordersLoading ? (
          <ActivityIndicator size="small" color={Colors.light.tint} style={{ marginTop: 20 }} />
        ) : days.length === 0 ? (
          <Text style={styles.emptyText}>No orders for this month</Text>
        ) : (
          days.map((day) => {
            const entry = groupedByDay[day];
            return (
              <StatementCard
                key={`day-${day}`}
                dayLabel={fmtDay(day)}
                orders={entry.orders}
                total={entry.total}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { paddingHorizontal: 16, backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#e53935' },

  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerInfo: { marginLeft: 16, flex: 1 },
  customerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  metaRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  metaLabel: { fontSize: 14, color: '#666', width: 60 },
  metaValue: { fontSize: 14, color: Colors.light.text, fontWeight: '600' },

  sectionHeader: { marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },

  dueScroll: { marginBottom: 24, flexDirection: 'row' },
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
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statementTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  statementDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
    backgroundColor: '#eee',
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: { fontSize: 14, color: Colors.light.text },
  itemQty: { fontSize: 14, color: Colors.light.text, fontWeight: '600' },
});
