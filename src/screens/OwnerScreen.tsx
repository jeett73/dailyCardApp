import { getRequest, postRequest } from '@/api/apiMethods';
import HeroHeader, { AvatarInitials, toTitleCase } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { getItem } from '@/services/storage';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const brandPurple = '#b3a0ff';
type Customer = { _id?: any; name?: string; cardNumber?: string | number };
type ShopProduct = { _id?: any; productId: string; price: number; productName?: string };

export default function OwnerScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useMemo(() => new Animated.Value(0), []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const qtyScales = useRef<Record<string, Animated.Value>>({});
  const totalAmount = useMemo(
    () => products.reduce((sum, p) => sum + (quantities[p._id] ?? 0) * p.price, 0),
    [products, quantities],
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchCustomers() {
      const q = input.trim();
      if (!q) {
        if (!cancelled) setCustomers([]);
        return;
      }
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.customers.list, {
          params: { shopId: shopId, q },
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers) ? data?.customers : [];
        const list: Customer[] = arr
          .map((item: any) => {
            if (typeof item === 'string') {
              return { name: item } as Customer;
            }
            return {
              _id: item?._id,
              name: item?.name,
              cardNumber: item?.cardNumber,
            } as Customer;
          })
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));
        if (!cancelled) setCustomers(list);
      } catch (e) {
        if (!cancelled) setCustomers([]);
      }
    }
    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, [input]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [customers, query]);

  function onDigit(d: string) {
    setInput((prev) => (prev + d).slice(0, 3));
  }

  function onBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  function onClear() {
    setInput('');
  }

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

  function openSheet(name: string) {
    setSelectedName(name);
    setSheetVisible(true);
    sheetY.setValue(500);
    Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    loadProducts();
  }

  function closeSheet() {
    Animated.timing(sheetY, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setSelectedName(null);
    });
  }

  function inc(p: string) {
    setQuantities((q) => ({ ...q, [p]: (q[p] ?? 0) + 1 }));
  }

  function dec(p: string) {
    setQuantities((q) => ({ ...q, [p]: Math.max(0, (q[p] ?? 0) - 1) }));
  }

  function pulseQty(id: string) {
    const v = qtyScales.current[id] ?? (qtyScales.current[id] = new Animated.Value(1));
    Animated.sequence([
      Animated.timing(v, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }

  async function loadProducts() {
    try {
      const token = await getItem('token');
      const storedShopId = await getItem('userId');
      const shopId = storedShopId;
      const res = await getRequest(apiEndpoint.shopProducts.listShopProducts, {
        params: { shopId },
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      const data = (res?.data ?? {}) as any;
      const arr = Array.isArray(data?.shopProducts) ? data?.shopProducts : [];
      const list: ShopProduct[] = arr.map((p: any) => ({
        _id: p?._id,
        productId: String(p?.productId || ''),
        price: Number(p?.price ?? 0),
        productName: String(p?.productName || ''),
      }));
      setProducts(list);
    } catch (e) {
      setProducts([]);
    }
  }

  async function save() {
    try {
      const token = await getItem('token');
      const storedShopId = await getItem('userId');
      const shopId = storedShopId ? String(storedShopId) : '';
      const customer = customers.find((c) => (c.name || '') === (selectedName || '')) || null;
      const items: { productId: string; time: number; qty: number; price: number }[] = [];
      for (const p of products) {
        const qty = quantities[p._id] ?? 0;
        if (qty > 0) {
          items.push({ productId: p._id, time: Date.now(), qty, price: p.price });
        }
      }
      if (items.length === 0) {
        closeSheet();
        return;
      }
      const payload = {
        customerId: customer?._id ? String(customer._id) : '',
        shopId,
        products: [{ day: new Date().getDate(), product: items }],
      };
      await postRequest(apiEndpoint.cards.order, payload, {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      closeSheet();
      setQuantities({});
    } catch (e) {
      closeSheet();
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <HeroHeader color={brandPurple} title="Patel Dairy & Sweet" />
      <View style={[styles.container, { paddingTop: insets.top + 150 }]}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter card number..."
            placeholderTextColor="#aaa"
            value={input}
            editable={false}
          />
          <View style={styles.searchIconWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {input && filtered.length === 0 && (
            <Text style={styles.emptyText}>No customers found</Text>
          )}
          {filtered.map((c) => {
            const name = toTitleCase(String(c.name || '').trim());
            const cardFormatted = formatCardNumber(c.cardNumber);
            const mobileFormatted = formatMobile((c as any)?.mobile);
            return (
              <TouchableOpacity
                key={String(c._id ?? `${c.name}-${c.cardNumber ?? ''}`)}
                style={styles.customerCard}
                activeOpacity={0.85}
                onPress={() => openSheet(c.name || '')}
                accessibilityLabel={`${name || 'Unknown'} • Card ${cardFormatted} • Mobile ${mobileFormatted}`}
              >
                <View style={styles.customerRow}>
                  <AvatarInitials title={name || 'Unknown'} />
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerTitle}>{name || 'Hiren Dabhi'}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Card</Text>
                      <Text style={styles.metaValue}>#{cardFormatted}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Mobile</Text>
                      <Text style={styles.metaValue}>{7600924242}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.keypadWrapper}>
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.key}
                activeOpacity={0.8}
                onPress={() => onDigit(d)}
              >
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['4', '5', '6'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.key}
                activeOpacity={0.8}
                onPress={() => onDigit(d)}
              >
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['7', '8', '9'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.key}
                activeOpacity={0.8}
                onPress={() => onDigit(d)}
              >
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={[styles.key, styles.utilKey]}
              activeOpacity={0.8}
              onPress={onClear}
            >
              <Text style={styles.utilKeyText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} activeOpacity={0.8} onPress={() => onDigit('0')}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.key, styles.utilKey]}
              activeOpacity={0.8}
              onPress={onBackspace}
            >
              <Text style={styles.utilKeyText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
        {sheetVisible && (
          <>
            <Pressable style={styles.overlay} onPress={closeSheet} />
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: sheetY }],
                  maxHeight: Math.round(height * 0.9),
                },
              ]}
            >
              <View style={styles.sheetHeader}>
                <View style={styles.dragIndicator} />
                <Text style={styles.sheetTitle}>{selectedName || ''}</Text>
              </View>
              <View style={styles.sheetCard}>
                {products.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.light.tint} />
                  </View>
                ) : (
                  <View style={styles.productsList}>
                    {products.map((p) => {
                      const id = String(p._id ?? p.productId);
                      const qty = quantities[p._id] ?? 0;
                      const scale =
                        qtyScales.current[id] ?? (qtyScales.current[id] = new Animated.Value(1));
                      return (
                        <View key={id} style={styles.productItem}>
                          <Image
                            source={require('../../assets/images/bg.png')}
                            style={styles.productThumb}
                            resizeMode="cover"
                            accessibilityRole="image"
                            accessibilityLabel={`${p.productName || p.productId} image`}
                          />
                          <View style={styles.productInfoBlock}>
                            <Text style={styles.productTitle} numberOfLines={1}>
                              {p.productName || p.productId}
                            </Text>
                            <Text style={styles.productSubPrice}>₹{p.price}</Text>
                          </View>
                          <View style={styles.rowRight}>
                            <Animated.View
                              style={[styles.qtyChip, { transform: [{ scale }] }]}
                              accessibilityLabel={`Quantity ${qty}`}
                            >
                              <Text style={styles.qtyChipText}>{qty}</Text>
                            </Animated.View>
                            <View style={styles.actionRow}>
                              <TouchableOpacity
                                style={styles.pillButton}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel={`Decrease quantity for ${p.productName || p.productId}`}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                onPress={() => {
                                  dec(p._id);
                                  pulseQty(id);
                                }}
                              >
                                <Text style={styles.pillButtonText}>−</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.pillButton, styles.pillButtonPrimary]}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel={`Increase quantity for ${p.productName || p.productId}`}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                onPress={() => {
                                  inc(p._id);
                                  pulseQty(id);
                                }}
                              >
                                <Text style={styles.pillButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>₹{totalAmount}</Text>
                </View>
                <TouchableOpacity style={styles.saveButton} activeOpacity={0.9} onPress={save}>
                  <Text style={styles.saveButtonText}>Order</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -50,
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
    width: '92%',
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
  listContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingVertical: 12,
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
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  customerInfo: { flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff' },
  metaLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardItemLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  cardItemBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#0d101b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  keypadWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    minHeight: 320,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    flex: 1,
    height: 68,
    marginHorizontal: 6,
    borderRadius: 18,
    backgroundColor: '#a0c6ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  utilKey: {
    backgroundColor: '#0d101b',
  },
  utilKeyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  dragIndicator: {
    width: 70,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginVertical: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  sheetCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  productsList: { gap: 8, backgroundColor: '#fff' },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    padding: 8,
  },
  productThumb: { width: 72, height: 56, borderRadius: 8, marginRight: 12 },
  productInfoBlock: {
    flex: 1,
    backgroundColor: '#fff',
  },
  productTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  productSubPrice: { marginTop: 4, fontSize: 14, color: '#555' },
  rowRight: { alignItems: 'flex-end', backgroundColor: '#fff' },
  qtyChip: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0d101b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  qtyChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  pillButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonPrimary: { backgroundColor: '#e6f0ff', borderColor: '#c7defa' },
  pillButtonText: { fontSize: 18, fontWeight: '800', color: '#333' },
  totalRow: {
    marginTop: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#555' },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  saveButton: {
    marginTop: 12,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
