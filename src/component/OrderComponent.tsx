import { getRequest, postRequest, putRequest } from '@/api/apiMethods';
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
  const [editMode, setEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const totalAmount = useMemo(
    () =>
      products.reduce((sum, p) => sum + (quantities[p._id] ?? 0) * p.price, 0) +
      (Number(otherPurchased) || 0),
    [products, quantities, otherPurchased],
  );

  function openSheet(customer: Customer, orderToEdit?: any) {
    setCurrentCustomer(customer);
    setSheetVisible(true);
    sheetY.setValue(500);
    Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }).start();

    if (orderToEdit) {
      setEditMode(true);
      setEditingOrderId(orderToEdit._id);
      setOtherPurchased(''); // Assuming no other purchased field in orderToEdit for now
      loadProducts(customer, orderToEdit);
    } else {
      setEditMode(false);
      setEditingOrderId(null);
      setQuantities({});
      setOtherPurchased('');
      loadProducts(customer);
    }
  }

  function closeSheet() {
    Animated.timing(sheetY, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setCurrentCustomer(null);
      setEditMode(false);
      setEditingOrderId(null);
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

  async function loadProducts(customer: Customer, orderToEdit?: any) {
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

      const nextQuantities: Record<string, number> = {};

      if (orderToEdit) {
        // Pre-fill from order
        const orderProducts = Array.isArray(orderToEdit.products) ? orderToEdit.products : [];
        for (const p of orderProducts) {
          if (p.productId) {
            nextQuantities[String(p.productId)] = Number(p.qty ?? 0);
          }
        }
      } else {
        // Pre-fill from regular
        const regular: { productId: string; qty: number }[] = Array.isArray(
          customer?.regularProduct,
        )
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
        for (const p of list) {
          const q = regMap[String(p._id)];
          if (typeof q === 'number' && q > 0) {
            nextQuantities[p._id] = q;
          }
        }
      }
      setQuantities(nextQuantities);
    } catch (e) {
      setProducts([]);
    }
  }

  async function save(onSuccess?: () => void) {
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
        // If edit mode and items are empty, it might mean deleting the order or just clearing products?
        // For now, let's assume at least one product is required or just close.
        if (editMode && editingOrderId) {
          // If deleting all products is allowed, we might send empty list.
          // But let's stick to returning if empty for now unless user explicitly wants to delete.
          // return;
        } else {
          closeSheet();
          return;
        }
      }

      if (editMode && editingOrderId) {
        const payload = {
          products: items.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price })),
        };
        await putRequest(apiEndpoint.cards.updateOrder(editingOrderId), payload);
      } else {
        const payload = {
          customerId: currentCustomer?._id ? String(currentCustomer._id) : '',
          shopId,
          products: [{ day: new Date().getDate(), product: items }],
        };
        await postRequest(apiEndpoint.cards.order, payload, {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
      }

      closeSheet();
      setQuantities({});
      setOtherPurchased('');
      if (onSuccess) onSuccess();
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
    editMode,
  };
}
