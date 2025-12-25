import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';

export type Customer = { _id?: any; name?: string; cardNumber?: string | number };
export type ShopProduct = {
  _id?: any;
  productId: string;
  price: number;
  productName?: string;
  icon: string;
};

export function useOwner() {
  const { width, height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useMemo(() => new Animated.Value(0), []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const qtyScales = useRef<Record<string, Animated.Value>>({});

  const totalAmount = useMemo(
    () => products.reduce((sum, p) => sum + (quantities[p._id] ?? 0) * p.price, 0),
    [products, quantities],
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchCustomers() {
      const q = input.trim();
      if (!q) {
        if (!cancelled) setCustomers([]);
        return;
      }
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
        const res = await getRequest(apiEndpoint.customers.list, {
          params: { shopId: shopId, q },
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? []) as any;
        const arr = Array.isArray(data?.customers) ? data?.customers : [];
        const list: Customer[] = arr
          .map((item: any) => {
            if (typeof item === 'string') {
              return { name: item } as Customer;
            }
            return {
              _id: item?._id,
              name: item?.name,
              cardNumber: item?.cardNumber,
            } as Customer;
          })
          .filter((c: Customer) => !!(c.name && String(c.name).trim()));
        if (!cancelled) setCustomers(list);
      } catch (e) {
        if (!cancelled) setCustomers([]);
      }
    }
    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, [input]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [customers, query]);

  function onDigit(d: string) {
    setInput((prev) => (prev + d).slice(0, 3));
  }

  function onBackspace() {
    setInput((prev) => prev.slice(0, -1));
  }

  function onClear() {
    setInput('');
  }

  function formatCardNumber(card?: string | number) {
    const digits = String(card ?? '').replace(/\D/g, '');
    if (!digits) return '—';
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatMobile(mobile?: string | number) {
    const digits = String(mobile ?? '').replace(/\D/g, '');
    if (!digits) return 'N/A';
    const n = digits.slice(-10);
    return `+91 ${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`;
  }

  function openSheet(name: string) {
    setSelectedName(name);
    setSheetVisible(true);
    sheetY.setValue(500);
    Animated.timing(sheetY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    loadProducts();
  }

  function closeSheet() {
    Animated.timing(sheetY, { toValue: 500, duration: 180, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      setSelectedName(null);
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

  async function loadProducts() {
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
        _id: p?._id,
        productId: String(p?.productId || ''),
        price: Number(p?.price ?? 0),
        productName: String(p?.productName || ''),
        icon: String(p?.icon ?? '../../assets/images/bg.png'),
      }));
      setProducts(list);
    } catch (e) {
      setProducts([]);
    }
  }

  async function save() {
    try {
      const token = await getItem('token');
      const storedShopId = await getItem('userId');
      const shopId = storedShopId ? String(storedShopId) : '';
      const customer = customers.find((c) => (c.name || '') === (selectedName || '')) || null;
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
        customerId: customer?._id ? String(customer._id) : '',
        shopId,
        products: [{ day: new Date().getDate(), product: items }],
      };
      await postRequest(apiEndpoint.cards.order, payload, {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      closeSheet();
      setQuantities({});
    } catch (e) {
      closeSheet();
    }
  }

  return {
    width,
    height,
    query,
    input,
    selectedName,
    sheetVisible,
    sheetY,
    quantities,
    customers,
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
  };
}
