import { useAddProduct } from '@/component/AddProductComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  UIManager,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type InputRef = React.ElementRef<typeof TextInput>;

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, toggle, setPriceText, saveAll, saving, setOrderIds } =
    useAddProduct();
  const listRef = useRef<import('react-native-gesture-handler').FlatList<any> | null>(null);
  const inputRefs = useRef<Record<string, InputRef | null>>({});
  const cardOffsets = useRef<Record<string, number>>({});
  const inputOffsets = useRef<Record<string, number>>({});
  const lastFocusedIdRef = useRef<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [dragging, setDragging] = useState(false);

  const footerBottomPadding = Math.max(insets.bottom, 16);
  const footerHeight = 12 + 50 + footerBottomPadding;

  const keyboardHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const listHeightRef = useRef(0);

  const scrollToProductInput = useCallback(
    (id: string) => {
      if (!listRef.current) return;

      // Get stored Y position of input or card
      const cardY = cardOffsets.current[id] ?? 0;
      const inputY = inputOffsets.current[id] ?? 0;
      const y = cardY + inputY;

      const currentScrollY = scrollYRef.current;
      const viewHeight = listHeightRef.current;
      const keyboardHeight = keyboardHeightRef.current;

      if (viewHeight === 0) return;

      // Visible height after keyboard opens
      const effectiveVisibleHeight = viewHeight - keyboardHeight;

      // Height available for list content after footer
      const availableHeight = effectiveVisibleHeight - footerHeight;

      // Approximate input size and margin
      const INPUT_HEIGHT = 60;
      const MARGIN = 20;

      // Position of input relative to current viewport
      const inputTop = y - currentScrollY;

      let targetOffset: number | null = null;

      // Case 1: Input is above visible area
      if (inputTop < MARGIN) {
        targetOffset = Math.max(0, y - MARGIN);
      }
      // Case 2: Input is below visible area (hidden by keyboard/footer)
      else if (inputTop + INPUT_HEIGHT + MARGIN > availableHeight) {
        targetOffset = Math.max(0, y + INPUT_HEIGHT - availableHeight + MARGIN);
      }

      if (targetOffset === null) return;

      // First scroll
      listRef.current.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });

      // Second scroll to stabilize after keyboard animation
      setTimeout(() => {
        if (lastFocusedIdRef.current === id) {
          listRef.current?.scrollToOffset({
            offset: targetOffset!,
            animated: true,
          });
        }
      }, 250);
    },
    [footerHeight],
  );
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardPadding(h);
      keyboardHeightRef.current = h;
      const id = lastFocusedIdRef.current;
      if (id) {
        setTimeout(() => {
          scrollToProductInput(id);
        }, 50);
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardPadding(0);
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToProductInput]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (focusTargetId) {
      const targetSelected = items.some((it) => it.id === focusTargetId && it.selected);
      if (targetSelected) {
        timer = setTimeout(() => {
          inputRefs.current[focusTargetId]?.focus?.();
          setFocusTargetId(null);
        }, 50);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [items, focusTargetId]);

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
      return <Text style={styles.emptyText}>No products available</Text>;
    }
    return null;
  }, [items, loading, error, toggle, setPriceText, scrollToProductInput]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Select Product" />
      <View
        style={styles.flex}
        onLayout={(e) => (listHeightRef.current = e.nativeEvent.layout.height)}
      >
        {content ? (
          content
        ) : (
          <DraggableFlatList
            ref={listRef}
            data={items}
            onScroll={(e) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            activationDistance={0}
            containerStyle={styles.flex}
            scrollEnabled={!dragging}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingTop: insets.top + 90 },
              { paddingBottom: footerHeight + 24 + keyboardPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            onDragBegin={() => setDragging(true)}
            onDragEnd={({ data }) => {
              setDragging(false);
              // Preserve approximate Y positions for the new order to prevent scroll jumping
              // (onLayout will correct these if heights differ, but this covers the no-layout-change case)
              const currentYs = Object.values(cardOffsets.current).sort((a, b) => a - b);
              const newOffsets: Record<string, number> = {};
              data.forEach((item, index) => {
                if (index < currentYs.length) {
                  newOffsets[item.id] = currentYs[index];
                }
              });
              cardOffsets.current = newOffsets;

              setOrderIds(data.map((x) => x.id));
            }}
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<any>) => {
              return (
                <Pressable
                  style={[
                    styles.productCard,
                    item.selected && styles.productCardSelected,
                    isActive && styles.productCardActive,
                  ]}
                  onLongPress={drag}
                  delayLongPress={200}
                  accessibilityLabel={`${item.name}`}
                  onLayout={(e) => {
                    cardOffsets.current[item.id] = e?.nativeEvent?.layout?.y ?? 0;
                  }}
                >
                  <View style={[styles.productRow, item.selected && styles.productRowSelected]}>
                    <Image
                      source={{ uri: apiEndpoint.uploads(item.icon) }}
                      style={styles.productThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.selected && (
                        <TextInput
                          ref={(r) => {
                            inputRefs.current[item.id] = r;
                          }}
                          style={styles.priceInput}
                          placeholder="Enter price"
                          keyboardType="decimal-pad"
                          value={item.priceText}
                          onChangeText={(t) => setPriceText(item.id, t)}
                          onLayout={(e) => {
                            inputOffsets.current[item.id] = e?.nativeEvent?.layout?.y ?? 0;
                          }}
                          onFocus={() => {
                            lastFocusedIdRef.current = item.id;
                            scrollToProductInput(item.id);
                          }}
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.checkbox, item.selected && styles.checkboxChecked]}
                      activeOpacity={0.85}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        if (!item.selected) setFocusTargetId(item.id);
                        toggle(item.id);
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.selected }}
                    >
                      {item.selected && <Feather name="check" size={14} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
        <View
          style={[styles.footer, { paddingBottom: footerBottomPadding, bottom: keyboardPadding }]}
        >
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.9}
            onPress={saveAll}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  productCard: {
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
  productCardSelected: { borderColor: Colors.light.tint, backgroundColor: '#fff' },
  productCardActive: { opacity: 0.9 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  productRowSelected: { backgroundColor: '#fff' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(13,16,27,0.25)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  productThumb: { width: 84, height: 84, borderRadius: 14, marginVertical: -4 },
  productInfo: { flex: 1, backgroundColor: '#fff' },
  productTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  priceInput: {
    marginTop: 6,
    height: 40,
    width: 120,
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveButton: {
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
});
