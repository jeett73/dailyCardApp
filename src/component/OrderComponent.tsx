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

export type GroupedItem = {
  time: number;
  products: {
    productId: string;
    qty: number;
    price: number;
  }[];
  others: {
    time: number;
    price: number;
  }[];
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
  const [cardId, setCardId] = useState<string | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
  const [saving, setSaving] = useState(false);

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
      const { _id, day, cardId: orderCardId } = orderToEdit || {};

      let d = day;
      // If day is missing, try to extract from products or others
      if (!d) {
        const pList = Array.isArray(orderToEdit.products) ? orderToEdit.products : [];
        d = pList[0]?.day;
      }

      setCardId(orderCardId || _id);
      setDay(d);
      setEditMode(true);

      setOtherPurchased('');
      loadProducts(customer, orderToEdit);
    } else {
      setEditMode(false);

      setQuantities({});
      setOtherPurchased('');
      setGroupedItems([]);
      loadProducts(customer);
    }
  }

  function closeSheet() {
    Animated.timing(sheetY, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setCurrentCustomer(null);
      setEditMode(false);
      setCardId(null);
      setDay(null);
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
        // Grouping logic
        const groups: Record<number, GroupedItem> = {};

        // Check if it is RecentOrder structure (flat products array)
        // RecentOrder has cardId and flattened products array
        if (
          orderToEdit.cardId ||
          (Array.isArray(orderToEdit.products) &&
            orderToEdit.products.length > 0 &&
            orderToEdit.products[0].productId)
        ) {
          const prods = Array.isArray(orderToEdit.products) ? orderToEdit.products : [];
          const others = Array.isArray(orderToEdit.others) ? orderToEdit.others : [];

          for (const p of prods) {
            const t = p.time;
            if (!groups[t]) groups[t] = { time: t, products: [], others: [] };
            groups[t].products.push(p);

            if (p.productId) {
              const key = `${p.productId}_${p.time}`;
              nextQuantities[key] = Number(p.qty ?? 0);
            }
          }

          for (const o of others) {
            const t = o.time;
            if (!groups[t]) groups[t] = { time: t, products: [], others: [] };
            groups[t].others.push(o);
          }
        } else {
          // Existing logic for Card structure (nested day entries)
          const dayEntries = Array.isArray(orderToEdit.products) ? orderToEdit.products : [];
          for (const dayEntry of dayEntries) {
            const prods = Array.isArray(dayEntry.product) ? dayEntry.product : [];
            const others = Array.isArray(dayEntry.others) ? dayEntry.others : [];

            for (const p of prods) {
              const t = p.time;
              if (!groups[t]) groups[t] = { time: t, products: [], others: [] };
              groups[t].products.push(p);

              if (p.productId) {
                // Use composite key to support same product at different times
                const key = `${p.productId}_${p.time}`;
                nextQuantities[key] = Number(p.qty ?? 0);
              }
            }

            for (const o of others) {
              const t = o.time;
              if (!groups[t]) groups[t] = { time: t, products: [], others: [] };
              groups[t].others.push(o);
            }
          }
        }

        const sortedGroups = Object.values(groups).sort((a, b) => b.time - a.time);
        setGroupedItems(sortedGroups);
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
    if (saving) return;
    setSaving(true);
    try {
      const token = await getItem('token');
      const storedShopId = await getItem('userId');
      const shopId = storedShopId ? String(storedShopId) : '';
      const time = Date.now();

      if (editMode) {
        if (!cardId || !day) {
          console.warn('Update skipped: Missing cardId or day', { cardId, day });
          alert('Cannot update order: Missing details');
          return;
        }

        const items: { productId: string; time: number; qty: number; price: number }[] = [];

        Object.entries(quantities).forEach(([key, qty]) => {
          if (qty > 0) {
            const parts = key.split('_');
            if (parts.length === 2) {
              const [pid, tStr] = parts;
              const t = Number(tStr);

              let price = 0;
              const group = groupedItems.find((g) => g.time === t);
              const item = group?.products.find((p) => p.productId === pid);

              if (item) {
                price = item.price;
              } else {
                const prod = products.find((p) => p._id === pid || p.productId === pid);
                price = prod?.price ?? 0;
              }

              items.push({ productId: pid, time: t, qty, price });
            }
          }
        });

        let others: { time: number; price: number }[] = [];
        groupedItems.forEach((g) => {
          others = others.concat(g.others);
        });

        const otherAmount = Number(otherPurchased);
        if (otherAmount > 0) {
          others.push({ time, price: otherAmount });
        }

        const payload = {
          cardId: cardId,
          day: day,
          products: items.map((i) => ({
            productId: i.productId,
            time: i.time,
            qty: i.qty,
            price: i.price,
          })),
          others: others,
        };
        console.log('Update Order Payload:', JSON.stringify(payload, null, 2));
        await postRequest(apiEndpoint.cards.updateOrderPost, payload, {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
      } else {
        const items: { productId: string; time: number; qty: number; price: number }[] = [];
        const productsWithPrice = products.filter((p) => p?.price > 0);
        for (const p of productsWithPrice) {
          const qty = quantities[p._id] ?? 0;
          if (qty > 0) {
            items.push({ productId: p._id, time: time, qty, price: p.price });
          }
        }

        const otherAmount = Number(otherPurchased);

        if (items.length === 0 && otherAmount <= 0) {
          if (editMode) {
            // Should not reach here due to if check above
          } else {
            closeSheet();
            return;
          }
        }
        const others =
          otherAmount > 0
            ? [
                {
                  time: time,
                  price: otherAmount,
                },
              ]
            : [];

        const payload = {
          customerId: currentCustomer?._id ? String(currentCustomer._id) : '',
          shopId,
          products: [{ day: new Date().getDate(), product: items, others: others }],
        };
        await postRequest(apiEndpoint.cards.order, payload, {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
      }

      setQuantities({});
      setOtherPurchased('');
      if (onSuccess && typeof onSuccess === 'function') onSuccess();
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
      closeSheet();
    }
  }

  function updateOther(groupIdx: number, otherIdx: number, newPrice: string) {
    setGroupedItems((prev) => {
      const copy = [...prev];
      if (copy[groupIdx]) {
        const g = { ...copy[groupIdx] };
        if (g.others && g.others[otherIdx]) {
          const others = [...g.others];
          others[otherIdx] = { ...others[otherIdx], price: Number(newPrice) };
          g.others = others;
          copy[groupIdx] = g;
        }
      }
      return copy;
    });
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
    groupedItems,
    updateOther,
    saving,
  };
}
