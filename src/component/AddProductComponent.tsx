import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  LayoutAnimation,
  Platform,
  TextInput,
  UIManager,
  useWindowDimensions,
} from 'react-native';

type CatalogProduct = { _id: string; name: string; icon: string };
type SelectedProduct = { productId: string; price: number };
type InputRef = React.ElementRef<typeof TextInput>;

export function useAddProduct() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProduct>>({});
  const [enteredPrices, setEnteredPrices] = useState<Record<string, string>>({});
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // UI Logic Refs
  const listRef = useRef<any>(null);
  const inputRefs = useRef<Record<string, InputRef | null>>({});
  const cardOffsets = useRef<Record<string, number>>({});
  const inputOffsets = useRef<Record<string, number>>({});
  const lastFocusedIdRef = useRef<string | null>(null);
  const keyboardHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const listHeightRef = useRef(0);

  // UI State
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Responsive Logic
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const contentWidth = isTablet ? 600 : '100%';
  const headerHeight = isTablet ? 300 : 100;

  // Animation Logic
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Footer Config
  const footerHeight = 12 + 50 + 34; // approx

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const scrollToProductInput = useCallback(
    (id: string) => {
      if (!listRef.current) return;

      const cardY = cardOffsets.current[id] ?? 0;
      const inputY = inputOffsets.current[id] ?? 0;
      const y = cardY + inputY;

      const currentScrollY = scrollYRef.current;
      const viewHeight = listHeightRef.current;
      const keyboardHeight = keyboardHeightRef.current;

      if (viewHeight === 0) return;

      const effectiveVisibleHeight = viewHeight - keyboardHeight;
      const availableHeight = effectiveVisibleHeight - footerHeight;
      const INPUT_HEIGHT = 60;
      const MARGIN = 20;
      const inputTop = y - currentScrollY;
      let targetOffset: number | null = null;

      if (inputTop < MARGIN) {
        targetOffset = Math.max(0, y - MARGIN);
      } else if (inputTop + INPUT_HEIGHT + MARGIN > availableHeight) {
        targetOffset = Math.max(0, y + INPUT_HEIGHT - availableHeight + MARGIN);
      }

      if (targetOffset === null) return;

      listRef.current.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });

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
      // Check if item is in current items list to avoid stale closure issues
      // We rely on orderIds mapped to products logic in items calculation
      // Here we just fire focus if ID is set
      timer = setTimeout(() => {
        inputRefs.current[focusTargetId]?.focus?.();
        setFocusTargetId(null);
      }, 50);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [focusTargetId]); // Removed items dependency to strict logic

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const [catalogRes, shopRes] = await Promise.all([
          getRequest(apiEndpoint.products.list, {
            headers: { authorization: token ? `Bearer ${token}` : '' },
          }),
          getRequest(apiEndpoint.shopProducts.listShopProducts, {
            params: { shopId },
            headers: { authorization: token ? `Bearer ${token}` : '' },
          }),
        ]);

        const data = (catalogRes?.data ?? {}) as any;
        const arr = Array.isArray(data?.products)
          ? data?.products
          : Array.isArray(data)
            ? data
            : [];
        const list: CatalogProduct[] = arr
          .map((p: any) => ({
            _id: String(p?._id ?? p?.id ?? ''),
            name: String(p?.Name ?? p?.name ?? p?.productName ?? p?.title ?? ''),
            icon: String(p?.icon ?? ''),
          }))
          .filter((p: CatalogProduct) => !!p._id && !!p.name.trim());

        const shopData = (shopRes?.data ?? {}) as any;
        const shopArr = Array.isArray(shopData?.shopProducts) ? shopData?.shopProducts : [];
        const shopMap = new Map<string, number>();
        const orderMap = new Map<string, number>();
        shopArr.forEach((p: any) => {
          const pid = String(p?.productId || '');
          const price = Number(p?.price ?? 0);
          const order = Number(p?.order ?? 0);
          if (pid) {
            shopMap.set(pid, price);
            orderMap.set(pid, order);
          }
        });

        list.sort((a, b) => {
          const orderA = orderMap.has(a._id) ? orderMap.get(a._id)! : Number.MAX_SAFE_INTEGER;
          const orderB = orderMap.has(b._id) ? orderMap.get(b._id)! : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });

        const initSelected: Record<string, SelectedProduct> = {};
        const initPrices: Record<string, string> = {};

        list.forEach((p) => {
          if (shopMap.has(p._id)) {
            const price = shopMap.get(p._id) || 0;
            if (price > 0) {
              initSelected[p._id] = { productId: p._id, price };
              initPrices[p._id] = String(price);
            }
          }
        });

        setProducts(list);
        setSelectedProducts(initSelected);
        setEnteredPrices(initPrices);
        setOrderIds(list.map((p) => p._id));
        setLoading(false);
      } catch {
        setError('Failed to load products');
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(
    () =>
      orderIds
        .map((id) => products.find((p) => p._id === id))
        .filter(Boolean)
        .map((p) => {
          const id = (p as CatalogProduct)._id;
          const selected = !!selectedProducts[id];
          const priceText = enteredPrices[id] ?? '';
          return {
            id,
            name: (p as CatalogProduct).name,
            selected,
            priceText,
            icon: (p as CatalogProduct).icon,
          };
        }),
    [orderIds, products, selectedProducts, enteredPrices],
  );

  function toggle(id: string) {
    setError(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Auto focus logic
    const isCurrentlySelected = selectedProducts[id];
    if (!isCurrentlySelected) {
      setFocusTargetId(id);
    }

    setSelectedProducts((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { productId: id, price: 0 } };
    });
    setEnteredPrices((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: '' };
    });
  }

  function setPriceText(id: string, t: string) {
    setError(null);
    setEnteredPrices((prev) => ({ ...prev, [id]: t }));
  }

  async function saveAll() {
    const selectedKeys = Object.keys(selectedProducts);
    const invalid = selectedKeys.filter((id) => {
      const v = (enteredPrices[id] ?? '').trim();
      const n = Number(v);
      return !(v.length > 0 && Number.isFinite(n) && n > 0);
    });
    if (invalid.length > 0) {
      setError('Enter price for all selected products');
      return;
    }
    setSaving(true);
    try {
      const token = await getItem('token');
      const shopId = await getItem('userId');
      const payloads = orderIds.map((id, index) => {
        const isSelected = !!selectedProducts[id];
        let price = 0;
        if (isSelected) {
          price = Number(enteredPrices[id] ?? 0);
        }
        return {
          shopId: String(shopId ?? ''),
          productId: id,
          price,
          order: index + 1,
        };
      });
      await postRequest(
        apiEndpoint.shopProducts.add,
        { products: payloads },
        {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        },
      );
      navigation.goBack();
    } catch {
      setError('Failed to add product');
    } finally {
      setSaving(false);
    }
  }

  // Ref Handlers
  const handleLayoutList = (e: any) => (listHeightRef.current = e.nativeEvent.layout.height);
  const handleScroll = (e: any) => (scrollYRef.current = e.nativeEvent.contentOffset.y);
  const handleDragBegin = () => setDragging(true);
  const handleDragEnd = ({ data }: { data: any[] }) => {
    setDragging(false);
    const currentYs = Object.values(cardOffsets.current).sort((a, b) => a - b);
    const newOffsets: Record<string, number> = {};
    data.forEach((item, index) => {
      if (index < currentYs.length) {
        newOffsets[item.id] = currentYs[index];
      }
    });
    cardOffsets.current = newOffsets;
    setOrderIds(data.map((x) => x.id));
  };

  const handleInputFocus = (id: string) => {
    lastFocusedIdRef.current = id;
    scrollToProductInput(id);
  };

  const handleInputLayout = (id: string, e: any) => {
    inputOffsets.current[id] = e?.nativeEvent?.layout?.y ?? 0;
  };

  const handleCardLayout = (id: string, e: any) => {
    cardOffsets.current[id] = e?.nativeEvent?.layout?.y ?? 0;
  };

  const setInputRef = (id: string, r: any) => {
    inputRefs.current[id] = r;
  };

  return {
    items,
    loading,
    error,
    toggle,
    setPriceText,
    saveAll,
    saving,
    setOrderIds,
    // UI Props
    listRef,
    keyboardPadding,
    dragging,
    isTablet,
    contentWidth,
    headerHeight,
    fadeAnim,
    slideAnim,
    // Event Handlers
    handleLayoutList,
    handleScroll,
    handleDragBegin,
    handleDragEnd,
    handleInputFocus,
    handleInputLayout,
    handleCardLayout,
    setInputRef,
  };
}
