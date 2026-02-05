import { GroupedItem, ShopProduct } from '@/component/OrderComponent';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { formatToKolkataTime } from '@/utils/dateUtils';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
  currentCustomer: { name?: string; cardNumber?: string | number } | null;
  products: ShopProduct[];
  productsLoading?: boolean;
  quantities: Record<string, number>;
  qtyScales: React.MutableRefObject<Record<string, Animated.Value>>;
  otherPurchased: string;
  setOtherPurchased: (value: string) => void;
  isFocused?: boolean; // Optional if we manage it internally
  closeSheet: () => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  pulseQty: (id: string) => void;
  save: (onSuccess?: () => void, options?: { autoClose?: boolean }) => void;
  saveLabel?: string;
  editMode: boolean;
  groupedItems: GroupedItem[];
  updateOther?: (groupIdx: number, otherIdx: number, newPrice: string) => void;
  saving?: boolean;
  onClear?: () => void;
}

type OrderConfirmationItem = { name: string; qty: number };

function OrderConfirmationOverlay({
  visible,
  items,
  otherPurchased,
  total,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  items: OrderConfirmationItem[];
  otherPurchased: string;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const otherVal = Number(otherPurchased);
  const hasOther = !isNaN(otherVal) && otherVal > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <BlurView
          intensity={Platform.OS === 'android' ? 5 : 15}
          tint="dark"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Confirm Order</Text>

          <ScrollView style={styles.confirmList} contentContainerStyle={{ paddingVertical: 10 }}>
            {items.map((item, idx) => (
              <View key={`confirm-${idx}`} style={styles.confirmItemRow}>
                <Text style={styles.confirmItemName}>{item.name}</Text>
                <Text style={styles.confirmItemQty}>[ {item.qty} ]</Text>
              </View>
            ))}

            {hasOther && (
              <View style={styles.confirmItemRow}>
                <Text style={styles.confirmItemName}>Other</Text>
                <Text style={styles.confirmItemQty}>₹{otherVal}</Text>
              </View>
            )}

            {items.length === 0 && !hasOther && (
              <Text
                style={{
                  color: '#999',
                  textAlign: 'center',
                  marginVertical: 10,
                }}
              >
                No items selected
              </Text>
            )}
          </ScrollView>
          <Text style={{ textAlign: 'center', color: '#ccc', marginVertical: 4 }}>
            -----------------------------------
          </Text>

          <View style={styles.confirmItemRow}>
            <Text style={[styles.confirmItemName, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.confirmItemQty, { fontWeight: '700' }]}>₹{total}</Text>
          </View>

          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnConfirm} onPress={onConfirm}>
              <Text style={styles.btnConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SuccessOverlay({
  visible,
  title = 'Order Placed!',
  message = 'Your order has been confirmed successfully.',
}: {
  visible: boolean;
  title?: string;
  message?: string;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.confirmOverlay}>
        <BlurView
          intensity={Platform.OS === 'android' ? 5 : 15}
          tint="dark"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.confirmCard, { alignItems: 'center', paddingVertical: 30 }]}>
          <Image
            source={require('../../assets/Success.gif')}
            style={{ width: 120, height: 120, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text style={[styles.confirmTitle, { marginBottom: 8 }]}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function OrderSheet({
  sheetVisible,
  sheetY,
  height,
  currentCustomer,
  products,
  productsLoading = false,
  quantities,
  qtyScales,
  otherPurchased,
  setOtherPurchased,
  closeSheet,
  inc,
  dec,
  pulseQty,
  save,
  saveLabel = 'Place Order',
  editMode,
  groupedItems,
  updateOther,
  saving,
  onClear,
}: OrderSheetProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
  const cardNumber = currentCustomer?.cardNumber;

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

    return (
      <View key={keyPrefix + productId + i} style={styles.productCard}>
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
        </View>
        <View style={styles.productInfoBlock}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {(p.productName || p.productId)?.split('(')[0]?.trim()}
          </Text>

          {(p.productName || p.productId)?.includes('(') && (
            <Text style={styles.productTitle} numberOfLines={1}>
              {(p.productName || p.productId)?.split('(')[1]?.replace(')', '')?.trim()}
            </Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
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
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Animated.Text style={[styles.qtyText, { transform: [{ scale }] }]}>{qty}</Animated.Text>
          <TouchableOpacity
            style={styles.qtyBtn}
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
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
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
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {groupedItems.map((group, groupIdx) => {
            const timeLabel = formatToKolkataTime(group.time);
            return (
              <View key={group.time} style={styles.groupContainer}>
                <Text style={styles.groupHeader}>{timeLabel}</Text>
                <View style={styles.gridContainer}>
                  {group.products.map((item, idx) => {
                    const shopProduct = products.find(
                      (sp) => sp._id === item.productId || sp.productId === item.productId,
                    );
                    if (!shopProduct) return null;
                    const qtyKey = `${item.productId}_${group.time}`;
                    const pricedProduct: ShopProduct = {
                      ...shopProduct,
                      price: Number(item.price ?? shopProduct.price),
                    };
                    return renderProductItem(pricedProduct, idx, `group-${groupIdx}-`, qtyKey);
                  })}
                </View>
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
        productsLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.light.tint} />
          </View>
        ) : products.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontWeight: '600' }}>No products found</Text>
          </View>
        ) : (
          <>
            <FlatList
              style={{ maxHeight: isKeyboardVisible ? 180 : height * 0.6 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              removeClippedSubviews={false}
              data={products?.filter((p) => p.price) ?? []}
              keyExtractor={(item, index) => `list-${String(item._id ?? item.productId)}-${index}`}
              contentContainerStyle={styles.productsList}
              numColumns={3}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item, index }) => renderProductItem(item, index, 'list-')}
            />
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
        onPress={handleOrderPress}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.saveButtonContent}>
            <Text style={styles.saveButtonText}>{saveLabel}</Text>
            <Text style={styles.saveButtonText}>Total: ₹{calculateTotal()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );

  const calculateTotal = () => {
    let total = 0;
    if (editMode) {
      groupedItems?.forEach((group) => {
        group.products?.forEach((item) => {
          const shopProduct = products?.find(
            (sp) => sp._id === item.productId || sp.productId === item.productId,
          );
          if (shopProduct) {
            const price = Number(item.price ?? shopProduct.price ?? 0);
            const qtyKey = `${item.productId}_${group.time}`;
            const qty = quantities[qtyKey] ?? 0;
            total += price * qty;
          }
        });
        group.others?.forEach((other) => {
          total += Number(other.price || 0);
        });
      });
    } else {
      products?.forEach((p) => {
        const qtyKey = String(p._id ?? p.productId);
        const qty = quantities[qtyKey] ?? 0;
        const price = Number(p.price || 0);
        total += price * qty;
      });
      const otherVal = Number(otherPurchased);
      if (!isNaN(otherVal)) {
        total += otherVal;
      }
    }
    return total;
  };

  const getConfirmationItems = () => {
    const items: { name: string; qty: number; price: number }[] = [];
    products.forEach((p) => {
      const productId = String(p._id ?? p.productId);
      const qty = quantities[productId];
      const price = Number(p.price || 0);
      if (qty && qty > 0 && price > 0) {
        items.push({
          name: p.productName || p.productId || 'Item',
          qty,
          price,
        });
      }
    });
    return items;
  };

  const handleOrderPress = () => {
    if (saving) return;
    if (editMode) {
      save(
        () => {
          setShowSuccess(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            setShowSuccess(false);
            if (onClear) onClear();
            closeSheet();
          }, 2500);
        },
        { autoClose: false },
      );
    } else {
      setShowConfirm(true);
    }
  };

  const renderConfirmation = () => {
    if (!showConfirm) return null;

    const items = getConfirmationItems();

    return (
      <OrderConfirmationOverlay
        visible={showConfirm}
        items={items}
        otherPurchased={otherPurchased}
        total={calculateTotal()}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          save(
            () => {
              setShowSuccess(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => {
                setShowSuccess(false);
                if (onClear) onClear();
                closeSheet();
              }, 2500);
            },
            { autoClose: false },
          );
        }}
      />
    );
  };

  return (
    <>
      {/* Overlay */}
      <Pressable
        style={styles.overlay}
        onPress={() => {
          setIsFocused(false);
          closeSheet();
        }}
      />

      {/* Bottom Sheet */}
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
            <Text style={styles.sheetTitle}>
              {cardNumber ? <Text style={{ fontStyle: 'italic' }}>#{cardNumber} </Text> : null}
              {selectedName || ''}
            </Text>
          </View>

          <View style={styles.sheetCard}>{renderContent()}</View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      {renderConfirmation()}

      {/* Success Overlay */}
      <SuccessOverlay
        visible={showSuccess}
        title={editMode ? 'Order Updated!' : 'Order Placed!'}
        message={
          editMode
            ? 'Order has been updated successfully.'
            : 'Your order has been confirmed successfully.'
        }
      />
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
    top: 120,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 10,
    elevation: 10,
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
  productsList: {
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  productCard: {
    width: '31%', // Approx 1/3 with gaps
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.06)',
    padding: 8,
    marginBottom: 8,
    height: 150,
  },
  thumbWrap: {
    position: 'relative',
    // marginBottom: 2,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
  },

  productInfoBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: '#fff',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 0,
  },
  rowRight: {
    // Deprecated but kept for compatibility if referenced elsewhere (it's not)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    height: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  qtyBtn: {
    width: 32,
    height: '100%',
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginTop: -2,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0d101b',
    flex: 1,
    textAlign: 'center',
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
  saveButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    color: '#fff',
  },
  groupContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  columnWrapper: {
    gap: 8,
    justifyContent: 'flex-start',
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 100,
    elevation: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0d101b',
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmList: {
    maxHeight: 200,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  confirmItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  confirmItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  confirmItemQty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d101b',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btnCancel: {
    width: '48%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#bababaff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirm: {
    width: '48%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0d101b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d101b',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff',
  },
  btnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
