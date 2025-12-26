import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { getItem } from '@/services/storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type CustomerInfo = {
  id: string;
  name: string;
  phone: string;
  cardNumber: string;
};

type DuesItem = { label: string; amount: number };

export default function PaymentModal({
  visible,
  customer,
  onClose,
}: {
  visible: boolean;
  customer: CustomerInfo | null;
  onClose: (paid?: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DuesItem[]>([]);
  const totalDue = useMemo(() => items.reduce((s, it) => s + (it.amount || 0), 0), [items]);
  const [payText, setPayText] = useState<string>('');
  const canPay = useMemo(() => {
    const t = payText.replace(/[^0-9.]/g, '');
    const n = Number(t);
    return t.length > 0 && Number.isFinite(n) && n > 0;
  }, [payText]);

  useEffect(() => {
    if (!visible || !customer) return;
    setLoading(true);
    setError(null);
    setItems([]);
    setPayText('');
    (async () => {
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(
          apiEndpoint.customers.dues(customer.id, String(shopId ?? '')),
          {
            headers: { authorization: token ? `Bearer ${token}` : '' },
          },
        );
        const data = (res?.data ?? {}) as any;
        const arr = Array.isArray(data?.dues) ? data?.dues : Array.isArray(data) ? data : [];
        const list: DuesItem[] = arr
          .map((d: any) => ({
            label: String(d?.label ?? d?.month ?? ''),
            amount: Number(d?.amount ?? d?.due ?? 0),
          }))
          .filter((d: DuesItem) => !!d.label);
        setItems(list);
        setPayText(String(list.reduce((s, it) => s + (it.amount || 0), 0)));
        setLoading(false);
      } catch (e) {
        setError('Failed to load dues');
        setLoading(false);
      }
    })();
  }, [visible, customer]);

  async function handlePay() {
    if (!customer) return;
    const t = payText.replace(/[^0-9.]/g, '');
    const amount = Number(t);
    if (!(t.length > 0 && Number.isFinite(amount) && amount > 0)) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getItem('token');
      const shopId = await getItem('userId');
      const payload = {
        customerId: customer.id,
        shopId: String(shopId ?? ''),
        amount,
      };
      await postRequest(apiEndpoint.customers.pay, payload, {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      onClose(amount);
    } catch {
      setError('Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose()}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Payment</Text>
          {customer ? (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>{customer.name}</Text>
              <Text style={styles.summaryText}>{customer.phone}</Text>
              <Text style={styles.summaryText}>{customer.cardNumber}</Text>
            </View>
          ) : null}
          {loading ? (
            <View style={styles.centerRow}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <ScrollView style={styles.duesList} contentContainerStyle={styles.duesContainer}>
                {items.length === 0 ? (
                  <Text style={styles.emptyText}>No pending bills</Text>
                ) : (
                  items.map((d, i) => (
                    <View key={d.label + i} style={styles.duesRow}>
                      <Text style={styles.duesLabel}>{d.label}</Text>
                      <Text style={styles.duesAmount}>₹{d.amount}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalAmount}>₹{totalDue}</Text>
              </View>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={payText}
                onChangeText={setPayText}
              />
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payBtn, (!canPay || loading) && styles.payBtnDisabled]}
                  onPress={handlePay}
                  disabled={!canPay || loading}
                >
                  <Text style={styles.payText}>Payment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.light.text, textAlign: 'center' },
  summary: { marginTop: 8 },
  summaryText: { fontSize: 14, color: Colors.light.text, textAlign: 'center' },
  centerRow: { paddingVertical: 16, alignItems: 'center' },
  error: { fontSize: 14, color: '#e53935', textAlign: 'center', paddingVertical: 8 },
  duesList: { maxHeight: 180, marginTop: 8 },
  duesContainer: { paddingVertical: 4 },
  duesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  duesLabel: { fontSize: 14, color: '#666' },
  duesAmount: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalAmount: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  inputLabel: { marginTop: 12, fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  input: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  cancelText: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  payBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  payBtnDisabled: { opacity: 0.6 },
  payText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
});
