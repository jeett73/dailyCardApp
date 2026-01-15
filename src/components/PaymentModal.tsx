import { getRequest, postRequest } from '@/api/apiMethods';
import { MONTHS_FULL } from '@/component/MonthlyStatementComponent';
import { AvatarInitials } from '@/components/HeroHeader';
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
          apiEndpoint.cards.dueCards(customer.id, String(shopId ?? '')),
          {
            headers: { authorization: token ? `Bearer ${token}` : '' },
          },
        );
        const data = (res?.data ?? {}) as any;
        const arr = Array.isArray(data?.dues) ? data?.dues : Array.isArray(data) ? data : [];
        const list: DuesItem[] = arr
          .map((d: any) => ({
            label: String((MONTHS_FULL[d?.month - 1] ?? 'Month') + ' ' + (d?.year ?? '')),
            amount: Number(d?.dueAmount ?? d?.due ?? 0),
          }))
          .filter((d: DuesItem) => !!d.label);
        setItems(list);
        setPayText(String(list.reduce((s, it) => s + (it.amount || 0), 0)));
        setLoading(false);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load dues';
        setError(msg);
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
      const shopId = await getItem('userId');
      const payload = {
        customerId: customer.id,
        shopId: String(shopId ?? ''),
        paymentAmount: amount,
      };
      await postRequest(apiEndpoint.cards.payment, payload);
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
              <View style={styles.customerRow}>
                <AvatarInitials title={customer.name || 'Unknown'} />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerTitle}>{customer.name || 'Unknown'}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Card</Text>
                    <Text style={styles.metaValue}>{customer.cardNumber}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Mobile</Text>
                    <Text style={styles.metaValue}>{customer.phone}</Text>
                  </View>
                </View>
              </View>
              {/* <View style={styles.hr} /> */}
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
                  <>
                    <View style={styles.duesHeader}>
                      <Text style={styles.duesHeaderLabel}>Month</Text>
                      <Text style={styles.duesHeaderAmount}>Amount</Text>
                    </View>
                    {items.map((d, i) => (
                      <View key={d.label + i} style={styles.duesRow}>
                        <Text style={styles.duesLabel}>{d.label}</Text>
                        <Text style={styles.duesAmount}>₹{d.amount}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalAmount}>₹{totalDue}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel50}>Amount</Text>
                <TextInput
                  style={styles.amountInput50}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={payText}
                  onChangeText={setPayText}
                />
              </View>
            </>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            {!error ? (
              <TouchableOpacity
                style={[styles.payBtn, (!canPay || loading) && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={!canPay || loading}
              >
                <Text style={styles.payText}>Payment</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
  duesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,16,27,0.08)',
  },
  duesHeaderLabel: { fontSize: 14, color: '#666', fontWeight: '700' },
  duesHeaderAmount: { fontSize: 14, color: '#666', fontWeight: '700' },
  duesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  duesLabel: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  duesAmount: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalAmount: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  amountRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel50: {
    width: '50%',
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '700',
    paddingRight: 8,
  },
  amountInput50: {
    width: '50%',
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
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  customerInfo: { flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff' },
  metaLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
  hr: {
    height: 1,
    backgroundColor: 'rgba(13,16,27,0.12)',
    marginVertical: 10,
  },
});
