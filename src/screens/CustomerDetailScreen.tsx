import { useCustomerDetail } from '@/components/CustomerDetailComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { StatementCard } from '@/components/StatementCard';
import { Text, View } from '@/components/Themed';

import Colors from '@/constants/Colors';
import React from 'react';
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

  return (
    <View style={styles.container}>
      <HeroHeader color={Colors.light.brandPurple} title="Customer Detail" />
      <View style={[styles.body, { paddingTop: Platform.OS === 'ios' ? 110 : insets.top + 90 }]}>
        {loading ? (
          <View style={[styles.centerContainer, { paddingVertical: 24 }]}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : error || !customer ? (
          <View style={[styles.centerContainer, { paddingVertical: 24 }]}>
            <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, styles.customerCard]}>
              <View style={styles.customerRow}>
                <AvatarInitials title={customer.name} />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerTitle}>
                    <Text style={{ fontStyle: 'italic' }}>#{customer.cardNumber}</Text>{' '}
                    {customer.name}
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

            <View style={[styles.card, styles.dueSectionCard]}>
              <Text style={styles.cardTitle}>Current & Previous Month Dues</Text>
              {dues.length === 0 ? (
                <View style={styles.cardBodyCenter}>
                  <Text style={styles.emptyText}>No dues found</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dueScroll}
                  contentContainerStyle={styles.dueScrollContent}
                >
                  {dues.map((due, index) => (
                    <TouchableOpacity
                      key={`${due.year}-${due.month}`}
                      style={[styles.dueCard, selectedDueIndex === index && styles.dueCardSelected]}
                      onPress={() => setSelectedDueIndex(index)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dueLabel,
                          selectedDueIndex === index && styles.dueLabelSelected,
                        ]}
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
              )}
            </View>

            <View style={[styles.card, styles.monthlyOrdersCard]}>
              <Text style={styles.cardTitle}>Monthly Orders</Text>
              {ordersLoading ? (
                <View style={styles.cardBodyCenter}>
                  <ActivityIndicator size="small" color={Colors.light.tint} />
                </View>
              ) : days.length === 0 ? (
                <View style={styles.cardBodyCenter}>
                  <Text style={styles.emptyText}>No orders for this month</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.monthlyScroll}
                  contentContainerStyle={[
                    styles.monthlyScrollContent,
                    { paddingBottom: Math.max(insets.bottom, 16) },
                  ]}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {days.map((day) => {
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
                  })}
                </ScrollView>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, paddingHorizontal: 16, backgroundColor: Colors.light.background },
  errorText: { fontSize: 16, color: '#e53935' },

  card: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, alignSelf: 'center' },
  cardBodyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingTop: 12,
    paddingBottom: 8,
  },

  customerCard: {
    marginTop: 5,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  centerRow: { justifyContent: 'center', width: '100%' },
  customerInfo: { marginLeft: 16, flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  metaRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center', backgroundColor: '#fff' },
  metaLabel: { fontSize: 14, color: '#666', width: 50 },
  metaValue: { fontSize: 14, color: Colors.light.text, fontWeight: '600' },
  fullWidthCard: { width: '100%' },

  dueSectionCard: {
    paddingBottom: 10,
  },

  dueScroll: { marginTop: 12, flexDirection: 'row', backgroundColor: 'transparent' },
  dueScrollContent: { paddingRight: 16 },
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

  monthlyOrdersCard: {
    flex: 1,
    paddingBottom: 10,
    marginBottom: 12,
  },
  monthlyScroll: { flex: 1, backgroundColor: 'transparent', marginTop: 6, borderRadius: 12 },
  monthlyScrollContent: { paddingBottom: 8 },

  emptyText: { fontSize: 14, color: '#666', fontStyle: 'italic' },

});
