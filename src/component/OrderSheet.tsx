import { GroupedItem, ShopProduct } from '@/component/OrderComponent';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { formatToKolkataTime } from '@/utils/dateUtils';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

interface OrderSheetProps {
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
  saveLabel?: string;
  editMode: boolean;
  groupedItems: GroupedItem[];
  updateOther?: (groupIdx: number, otherIdx: number, newPrice: string) => void;
  saving?: boolean;
}

export default function OrderSheet({
  sheetVisible,
  sheetY,
  height,
  currentCustomer,
  products,
  quantities,
  qtyScales,
  otherPurchased,
  setOtherPurchased,
  closeSheet,
  inc,
  dec,
  pulseQty,
  save,
  saveLabel = 'Order',
  editMode,
  groupedItems,
  updateOther,
  saving,
}: OrderSheetProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!sheetVisible) return null;

  const selectedName = currentCustomer?.name;

  const renderProductItem = (
    p: ShopProduct,
    i: number,
    keyPrefix: string,
    customQtyKey?: string,
  ) => {
    const productId = String(p._id ?? p.productId);
    const qtyKey = customQtyKey || productId;
    const qty = quantities[qtyKey] ?? 0;
    const scale = qtyScales.current[qtyKey] ?? (qtyScales.current[qtyKey] = new Animated.Value(1));

    // For edit mode, we only show items with qty > 0.
    // If user decreases to 0, it will disappear on re-render if we strictly filter by `quantities`.
    // However, for smooth UX, maybe we keep it until save?
    // Requirement: "On edit itme those product show in list that have more that 0 qty"
    // I will filter at the list generation level.

    return (
      <View key={keyPrefix + productId + i} style={styles.productItem}>
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
                dec(qtyKey);
                pulseQty(qtyKey);
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
                inc(qtyKey);
                pulseQty(qtyKey);
              }}
            >
              <Text style={styles.pillButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => (
    <>
      {editMode ? (
        <ScrollView
          style={{ maxHeight: isKeyboardVisible ? height * 0.5 : height * 0.8 }}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        >
          {groupedItems.map((group, groupIdx) => {
            const timeLabel = formatToKolkataTime(group.time);
            return (
              <View key={group.time} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{timeLabel}</Text>
                {group.products.map((item, idx) => {
                  const shopProduct = products.find(
                    (sp) => sp._id === item.productId || sp.productId === item.productId,
                  );
                  if (!shopProduct) return null;
                  const qtyKey = `${item.productId}_${group.time}`;
                  return renderProductItem(shopProduct, idx, `group-${groupIdx}-`, qtyKey);
                })}
                {group.others.map((other, idx) => (
                  <View key={`other-${groupIdx}-${idx}`} style={styles.otherItemRow}>
                    <View style={styles.labelInputRow}>
                      <Text style={styles.label50}>Other</Text>
                      <TextInput
                        style={styles.input50}
                        value={String(other.price)}
                        onChangeText={(t) =>
                          updateOther && updateOther(groupIdx, idx, t.replace(/\D/g, ''))
                        }
                        keyboardType="numeric"
                        placeholderTextColor="#666"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      ) : // Add Order Mode
      products.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ maxHeight: isKeyboardVisible ? 180 : height * 0.6 }}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
          >
            {products?.filter((p) => p.price).map((p, i) => renderProductItem(p, i, 'list-'))}
          </ScrollView>
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
        </>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        activeOpacity={0.9}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{saveLabel}</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          setIsFocused(false);
          closeSheet();
        }}
      />
      {editMode ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY: sheetY }],
                maxHeight: Math.round(height * 0.6),
                minHeight: isKeyboardVisible ? Math.round(height * 0.45) : Math.round(height * 0.6),
                paddingBottom: 24,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.dragIndicator} />
              <Text style={styles.sheetTitle}>{selectedName || ''}</Text>
            </View>
            <View style={styles.sheetCard}>{renderContent()}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      ) : (
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetY }],
              maxHeight: Math.round(height * 0.9),
              minHeight: isKeyboardVisible ? 200 : Math.round(height * 0.6),
              paddingBottom: 24,
              position: 'absolute',
              bottom: 0,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.dragIndicator} />
            <Text style={styles.sheetTitle}>{selectedName || ''}</Text>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetCard}
          >
            {renderContent()}
          </KeyboardAvoidingView>
        </Animated.View>
      )}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    paddingHorizontal: 8,
    width: '100%',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 10,
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
  },
  groupContainer: {
    backgroundColor: '#fff',
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  otherItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 0,
  },
  otherLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  otherPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0d101b',
  },
});
