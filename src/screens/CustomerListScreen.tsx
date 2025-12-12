import { getRequest } from '@/api/apiMethods';
import HeroHeader, { AvatarInitials, toTitleCase } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Customer = {
  _id?: any;
  name?: string;
  cardNumber?: string | number;
  mobile?: string | number;
  dueAmount?: number;
};

function formatCardNumber(card?: string | number) {
  const digits = String(card ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatMobile(mobile?: string | number) {
  const digits = String(mobile ?? '').replace(/\D/g, '');
  if (!digits) return 'N/A';
  const n = digits.slice(-10);
  return `+91 ${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`;
}

export default function CustomerListScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.customers.list, {
          params: { shopId },
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers) ? data?.customers : [];
        const list: Customer[] = arr
          .map((item: any) => ({
            _id: item?._id,
            name: item?.name,
            cardNumber: item?.cardNumber,
            mobile: item?.mobile,
            dueAmount: Number(item?.lastDueAmount ?? item?.dueAmount ?? 0),
          }))
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));
        setCustomers(list);
        setLoading(false);
      } catch {
        setError('Failed to load customers');
        setLoading(false);
      }
    })();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      );
    }
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    if (customers.length === 0) {
      return <Text style={styles.emptyText}>No customers found</Text>;
    }
    return customers.map((c) => {
      const name = toTitleCase(String(c.name || '').trim());
      const cardFormatted = formatCardNumber(c.cardNumber);
      const mobileFormatted = formatMobile(c.mobile);
      const due = Number(c?.dueAmount ?? 0);
      return (
        <TouchableOpacity
          key={String(c._id ?? `${c.name}-${c.cardNumber ?? ''}`)}
          style={styles.customerCard}
          activeOpacity={0.85}
          accessibilityLabel={`${name || 'Unknown'} • Card ${cardFormatted} • Mobile ${mobileFormatted}`}
        >
          <View style={styles.customerRow}>
            <AvatarInitials title={name || 'Unknown'} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>{name || 'Unknown'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Card</Text>
                <Text style={styles.metaValue}>#{cardFormatted}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{mobileFormatted}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last Due</Text>
                <Text style={styles.metaValue}>₹{due}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }, [customers, loading, error]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Customers" />
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingTop: insets.top + 90 },
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  customerCard: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  customerInfo: { flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff' },
  metaLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
});
