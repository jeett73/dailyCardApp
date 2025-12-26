import { useCustomerList } from '@/components/CustomerListComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import PaymentModal from '@/components/PaymentModal';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { items, loading, error, onAddPress } = useCustomerList();
  const [query, setQuery] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    cardNumber: string;
  } | null>(null);
  const [dueOverrides, setDueOverrides] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = String(it.name || '').toLowerCase();
      const card = String(it.card || '');
      const mobile = String(it.mobile || '');
      return name.includes(q) || card.includes(q) || mobile.includes(q);
    });
  }, [items, query]);

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
    if (!items || items.length === 0) {
      return <Text style={styles.emptyText}>No customers found</Text>;
    }
    if (query && filtered.length === 0) {
      return <Text style={styles.emptyText}>No customers found</Text>;
    }
    return filtered.map((it) => {
      const currentDue =
        typeof dueOverrides[it.id] === 'number' ? dueOverrides[it.id] : Number(it?.dueAmount ?? 0);
      const canPay = Number(currentDue ?? 0) > 0;
      function handleEdit() {
        const phoneDigits = String(it?.phone ?? '')
          .replace(/\D/g, '')
          .slice(-10);
        const cardDigits = String(it?.cardNumber ?? '')
          .replace(/\s+/g, '')
          .replace(/[^A-Za-z0-9-]/g, '');
        navigation.navigate('CreateCustomer', {
          mode: 'edit',
          initial: {
            id: it.id,
            name: it.name,
            phone: phoneDigits,
            cardNumber: cardDigits,
          },
        });
      }
      function handlePayment() {
        if (!canPay) return;
        setPaymentCustomer({
          id: it.id,
          name: it.name,
          phone: it.mobile,
          cardNumber: it.card,
        });
        setPaymentOpen(true);
      }
      return (
        <TouchableOpacity
          key={it.id}
          style={styles.customerCard}
          activeOpacity={0.85}
          accessibilityLabel={`${it.name || 'Unknown'} • Card ${it.card} • Mobile ${it.mobile}`}
        >
          <View style={styles.customerRow}>
            <AvatarInitials title={it.name || 'Unknown'} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>{it.name || 'Unknown'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Card</Text>
                <Text style={styles.metaValue}>{it.card}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{it.mobile}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last Due</Text>
                <Text style={styles.metaValue}>{`₹${currentDue}`}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={handleEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Edit customer"
                >
                  <Feather name="edit-3" size={18} color="#0d101b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn]}
                  activeOpacity={0.8}
                  onPress={handlePayment}
                  disabled={!canPay}
                  accessibilityRole="button"
                  accessibilityLabel="Pay due"
                >
                  <Text style={styles.actionIcon}>₹</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }, [items, loading, error, filtered, query]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Customers" />
      <View style={{ paddingTop: insets.top + 90, flex: 1 }}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
          />
          <View style={styles.searchIconWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {content}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 24) + 12 }, { right: 16 }]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add Customer"
        onPress={onAddPress}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
      <PaymentModal
        visible={paymentOpen}
        customer={paymentCustomer}
        onClose={(paid) => {
          setPaymentOpen(false);
          if (paymentCustomer && typeof paid === 'number' && paid > 0) {
            const prev =
              typeof dueOverrides[paymentCustomer.id] === 'number'
                ? dueOverrides[paymentCustomer.id]
                : (filtered.find((f) => f.id === paymentCustomer.id)?.dueAmount ?? 0);
            const next = Math.max(0, Number(prev) - Number(paid));
            setDueOverrides((m) => ({ ...m, [paymentCustomer.id]: next }));
          }
          setPaymentCustomer(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    height: 55,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    paddingLeft: 16,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    width: '90%',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  searchIconWrap: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 16,
    color: '#0d101b',
  },
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
  actionsRow: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionIcon: { fontSize: 18, color: '#0d101b' },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 28 },
});
