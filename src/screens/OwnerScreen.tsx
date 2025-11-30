import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React, { useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OwnerScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useMemo(() => new Animated.Value(500), []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const cards: Record<number, string[]> = {
    15: ['Jeet Patel', 'Anita Shah', 'Ravi Desai', 'Meera Joshi'],
    9: ['Karan Mehta', 'Priya Singh'],
    12: ['Vishal Sharma'],
  };

  const selectedCard = useMemo(() => {
    const n = parseInt(input || '');
    return Number.isFinite(n) ? n : undefined;
  }, [input]);

  const customers = useMemo(() => {
    if (selectedCard && cards[selectedCard]) return cards[selectedCard];
    return [];
  }, [selectedCard]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((n) => n.toLowerCase().includes(q));
  }, [customers, query]);

  const products = useMemo(() => ['Amul Gold', 'Shaktii', 'Butter Milk', 'Cow'], []);

  function onDigit(d: string) {
    setInput((prev) => (prev + d).slice(0, 3));
  }

  function onBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  function onClear() {
    setInput('');
  }

  function openSheet(name: string) {
    setSelectedName(name);
    setQuantities({ 'Amul Gold': 2, Shaktii: 1, 'Butter Milk': 5, Cow: 9 });
    setSheetVisible(true);
    sheetY.setValue(500);
    Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
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

  function save() {
    closeSheet();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Patel Dairy & Sweet</Text>
          <Text style={styles.subTitle}>{input ? `Card #${input}` : 'Enter card number'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {input === '15' && filtered.length === 0 && <Text style={styles.emptyText}>No customers found</Text>}
          {filtered.map((name) => (
            <TouchableOpacity key={name} style={styles.customerCard} activeOpacity={0.85} onPress={() => openSheet(name)}>
              <Text style={styles.customerName}>{name}</Text>
              <View style={styles.cardRow}>
                {products.map((p) => (
                  <View key={p} style={styles.cardItem}>
                    <Text style={styles.cardItemLabel}>{p}</Text>
                    <View style={styles.cardItemBadge}>
                      <Text style={styles.cardItemBadgeText}>{(quantities[p] ?? 0).toString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.keypadWrapper}>
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((d) => (
              <TouchableOpacity key={d} style={styles.key} activeOpacity={0.8} onPress={() => onDigit(d)}>
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['4', '5', '6'].map((d) => (
              <TouchableOpacity key={d} style={styles.key} activeOpacity={0.8} onPress={() => onDigit(d)}>
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {['7', '8', '9'].map((d) => (
              <TouchableOpacity key={d} style={styles.key} activeOpacity={0.8} onPress={() => onDigit(d)}>
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.key, styles.utilKey]} activeOpacity={0.8} onPress={onClear}>
              <Text style={styles.utilKeyText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} activeOpacity={0.8} onPress={() => onDigit('0')}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.key, styles.utilKey]} activeOpacity={0.8} onPress={onBackspace}>
              <Text style={styles.utilKeyText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
        {sheetVisible && (
          <>
            <Pressable style={styles.overlay} onPress={closeSheet} />
            <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
              <View style={styles.sheetHeader}>
                <View style={styles.dragIndicator} />
                <Text style={styles.sheetTitle}>{selectedName || ''}</Text>
              </View>
              <View style={styles.sheetCard}>
                {products.map((p) => (
                  <View key={p} style={styles.productRow}>
                    <Text style={styles.productName}>{p}</Text>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyButton} activeOpacity={0.85} onPress={() => dec(p)}>
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{quantities[p] ?? 0}</Text>
                      <TouchableOpacity style={styles.qtyButton} activeOpacity={0.85} onPress={() => inc(p)}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.saveButton} activeOpacity={0.9} onPress={save}>
                  <Text style={styles.saveButtonText}>Save</Text>
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
    bottom: 25,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  key: {
    flex: 1,
    height: 56,
    marginHorizontal: 6,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
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
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    height: 36,
    minWidth: 44,
    borderRadius: 12,
    backgroundColor: '#0d101b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 12,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
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
