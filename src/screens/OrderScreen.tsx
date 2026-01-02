import { ShopProduct } from '@/component/OrderComponent';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

interface OrderScreenProps {
  sheetVisible: boolean;
  sheetY: Animated.Value;
  height: number;
  currentCustomer: { name?: string } | null;
  products: ShopProduct[];
  quantities: Record<string, number>;
  qtyScales: React.MutableRefObject<Record<string, Animated.Value>>;
  otherPurchased: string;
  setOtherPurchased: (value: string) => void;
  isFocused?: boolean; // Optional if we manage it internally
  closeSheet: () => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  pulseQty: (id: string) => void;
  save: () => void;
}

export default function OrderScreen({
  sheetVisible,
  sheetY,
  height,
  currentCustomer,
  products,
  quantities,
  qtyScales,
  closeSheet,
  inc,
  dec,
  pulseQty,
  save,
}: OrderScreenProps) {
  const [otherPurchased, setOtherPurchased] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Reset local state when sheet closes or opens?
  // We can't easily detect open/close here without effect, but existing code didn't reset otherPurchased explicitly on open/close in the snippet,
  // except maybe by unmounting?
  // In OwnerScreen, {sheetVisible && ( ... )} means it unmounts when hidden.
  // So state resets automatically.
  // So if we conditionally render OrderScreen in OwnerScreen, we are good.

  if (!sheetVisible) return null;

  const selectedName = currentCustomer?.name;

  return (
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
                          source={{
                            uri: apiEndpoint.uploads(p.icon),
                          }}
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

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.9} onPress={save}>
            <Text style={styles.saveButtonText}>Order</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#ffffffff',
  },
  qtyChipImage: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0d101b',
    borderRadius: 20,
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 2,
  },
  qtyChipText: {
    color: '#fff',
    fontSize: 15,
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
