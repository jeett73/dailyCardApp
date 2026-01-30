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

  const scrollToProductInput = useCallback((id: string) => {
    const y = inputOffsets.current[id] ?? cardOffsets.current[id] ?? 0;
    const offset = Math.max(0, y - 120);
    listRef.current?.scrollToOffset?.({ offset, animated: true });
    setTimeout(() => {
      if (lastFocusedIdRef.current === id) {
        listRef.current?.scrollToOffset?.({ offset, animated: true });
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardPadding(h);
      const id = lastFocusedIdRef.current;
      if (id) {
        setTimeout(() => {
          scrollToProductInput(id);
        }, 50);
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardPadding(0);
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
      <View style={styles.flex}>
        {content ? (
          content
        ) : (
          <DraggableFlatList
            ref={listRef}
            data={items}
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
              cardOffsets.current = {};
              inputOffsets.current = {};
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
                            const localY = e?.nativeEvent?.layout?.y ?? 0;
                            inputOffsets.current[item.id] =
                              (cardOffsets.current[item.id] ?? 0) + localY;
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
