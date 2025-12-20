import { useOwner } from '@/component/OwnerComponent';
import HeroHeader, { AvatarInitials, toTitleCase } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const brandPurple = '#b3a0ff';

export default function OwnerScreen() {
  const insets = useSafeAreaInsets();
  const {
    height,
    input,
    selectedName,
    sheetVisible,
    sheetY,
    quantities,
    products,
    qtyScales,
    totalAmount,
    filtered,
    onDigit,
    onBackspace,
    onClear,
    formatCardNumber,
    formatMobile,
    openSheet,
    closeSheet,
    inc,
    dec,
    pulseQty,
    save,
  } = useOwner();
  const [otherPurchased, setOtherPurchased] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <HeroHeader color={brandPurple} title="Patel Dairy & Sweet" showHomeIcon={true} />
      <View style={[styles.container, { paddingTop: insets.top + 90 }]}>
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
                onPress={() => {
                  setIsFocused(false);
                  openSheet(c.name || '');
                }}
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

        <View
          style={[
            styles.keypadWrapper,
            {
              bottom: 0,
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 0,
            },
          ]}
        >
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
            <Pressable
              style={styles.overlay}
              onPress={() => {
                setIsFocused(false);
                closeSheet();
              }}
            />
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: sheetY }],
                  maxHeight: Math.round(height * 0.9),
                  paddingBottom: 24,
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
                  <ScrollView
                    style={isFocused ? { maxHeight: 150 } : undefined}
                    contentContainerStyle={styles.productsList}
                    showsVerticalScrollIndicator={false}
                  >
                    {products
                      ?.filter((p) => p.price)
                      .map((p, i) => {
                        const id = String(p._id ?? p.productId);
                        const qty = quantities[p._id] ?? 0;
                        const scale =
                          qtyScales.current[id] ?? (qtyScales.current[id] = new Animated.Value(1));
                        return (
                          <View key={id + i} style={styles.productItem}>
                            <View style={styles.thumbWrap}>
                              <Image
                                source={require('../../assets/images/bg.png')}
                                style={styles.productThumb}
                                resizeMode="cover"
                                accessibilityRole="image"
                                accessibilityLabel={`${p.productName || p.productId} image`}
                              />
                              <Animated.View
                                style={[styles.qtyChipImage, { transform: [{ scale }] }]}
                                accessibilityLabel={`Quantity ${qty}`}
                              >
                                <Text style={styles.qtyChipText}>{qty}</Text>
                              </Animated.View>
                            </View>
                            <View style={styles.productInfoBlock}>
                              <Text style={styles.productTitle} numberOfLines={1}>
                                {p.productName || p.productId}
                              </Text>
                              <Text style={styles.productSubPrice}>₹{p.price}</Text>
                            </View>
                            <View style={styles.rowRight}>
                              <View style={styles.actionRow}>
                                <TouchableOpacity
                                  style={[styles.pillButton, styles.pillButtonSeconder]}
                                  activeOpacity={0.85}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Decrease quantity for ${p.productName || p.productId}`}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                  </ScrollView>
                )}

                <View style={styles.labelInputRow}>
                  <Text style={styles.label50}>Other</Text>
                  <TextInput
                    style={styles.input50}
                    value={otherPurchased}
                    onChangeText={(t) => setOtherPurchased(t.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>

                {/* <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>₹{totalAmount}</Text>
                </View> */}
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
    bottom: 0,
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
    paddingHorizontal: 8,
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
    paddingVertical: 0,
    paddingHorizontal: 12,
    flex: 1,
    backgroundColor: '#fff',
  },
  productsList: { gap: 5, backgroundColor: '#fff' },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.06)',
    padding: 8,
    marginBottom: 8,
  },
  thumbWrap: {
    position: 'relative',
    marginRight: 12,
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  qtyChipImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0d101b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 2,
  },
  qtyChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  productInfoBlock: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  productSubPrice: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
  },
  pillButton: {
    width: 32,
    height: 32,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pillButtonPrimary: {
    backgroundColor: Colors.light.brandPurple,
  },
  pillButtonSeconder: {
    backgroundColor: Colors.light.tint,
  },
  pillButtonText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    marginTop: 8,
    backgroundColor: '#fff',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  labelInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  label50: {
    width: '50%',
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    paddingRight: 8,
  },
  input50: {
    width: '50%',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: '#0d101b',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#0d101b',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
