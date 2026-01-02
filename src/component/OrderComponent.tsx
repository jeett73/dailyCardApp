import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import type { Customer } from './OwnerComponent';

export type ShopProduct = {
  _id?: any;
  productId: string;
  price: number;
  productName?: string;
  icon: string;
};

export function useOrder() {
  const { height } = useWindowDimensions();
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useMemo(() => new Animated.Value(0), []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const qtyScales = useRef<Record<string, Animated.Value>>({});
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [otherPurchased, setOtherPurchased] = useState<string>('');

  const totalAmount = useMemo(
    () =>
      products.reduce((sum, p) => sum + (quantities[p._id] ?? 0) * p.price, 0) +
      (Number(otherPurchased) || 0),
    [products, quantities, otherPurchased],
  );

  function openSheet(customer: Customer) {
    setCurrentCustomer(customer);
    setSheetVisible(true);
    setQuantities({});
    setOtherPurchased('');
    sheetY.setValue(500);
    Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    loadProducts(customer);
  }

  function closeSheet() {
    Animated.timing(sheetY, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setCurrentCustomer(null);
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

  async function loadProducts(customer: Customer) {
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
        _id: String(p?._id || ''),
        productId: String(p?.productId || ''),
        price: Number(p?.price ?? 0),
        productName: String(p?.productName || ''),
        icon: String(p?.icon || ''),
      }));
      setProducts(list);

      const regular: { productId: string; qty: number }[] = Array.isArray(customer?.regularProduct)
        ? customer.regularProduct
        : [];
      const regMap: Record<string, number> = {};
      for (const r of regular) {
        if (r && r.productId) {
          const qtyNum = Number((r as any)?.qty ?? 0);
          if (Number.isFinite(qtyNum) && qtyNum > 0) {
            regMap[String(r.productId)] = qtyNum;
          }
        }
      }
      const nextQuantities: Record<string, number> = {};
      for (const p of list) {
        const q = regMap[String(p._id)];
        if (typeof q === 'number' && q > 0) {
          nextQuantities[p._id] = q;
        }
      }
      setQuantities(nextQuantities);
    } catch (e) {
      setProducts([]);
    }
  }

  async function save() {
    try {
      const token = await getItem('token');
      const storedShopId = await getItem('userId');
      const shopId = storedShopId ? String(storedShopId) : '';

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
        customerId: currentCustomer?._id ? String(currentCustomer._id) : '',
        shopId,
        products: [{ day: new Date().getDate(), product: items }],
      };
      await postRequest(apiEndpoint.cards.order, payload, {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      closeSheet();
      setQuantities({});
      setOtherPurchased('');
    } catch (e) {
      closeSheet();
    }
  }

  return {
    height,
    sheetVisible,
    sheetY,
    quantities,
    products,
    qtyScales,
    currentCustomer,
    totalAmount,
    otherPurchased,
    setOtherPurchased,
    openSheet,
    closeSheet,
    inc,
    dec,
    pulseQty,
    save,
  };
}
