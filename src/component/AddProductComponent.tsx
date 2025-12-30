import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type CatalogProduct = { _id: string; name: string; icon: string };
type SelectedProduct = { productId: string; price: number };

export function useAddProduct() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProduct>>({});
  const [enteredPrices, setEnteredPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
        shopArr.forEach((p: any) => {
          const pid = String(p?.productId || '');
          const price = Number(p?.price ?? 0);
          if (pid) shopMap.set(pid, price);
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
        setLoading(false);
      } catch {
        setError('Failed to load products');
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(
    () =>
      products.map((p) => {
        const id = p._id;
        const selected = !!selectedProducts[id];
        const priceText = enteredPrices[id] ?? '';
        return { id, name: p.name, selected, priceText, icon: p.icon };
      }),
    [products, selectedProducts, enteredPrices],
  );

  function toggle(id: string) {
    setError(null);
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
      const payloads = products.map((p) => {
        const id = p._id;
        const isSelected = !!selectedProducts[id];
        let price = 0;
        if (isSelected) {
          price = Number(enteredPrices[id] ?? 0);
        }
        return {
          shopId: String(shopId ?? ''),
          productId: id,
          price,
        };
      });
      const results = await Promise.allSettled(
        payloads.map((payload) =>
          postRequest(apiEndpoint.shopProducts.add, payload, {
            headers: { authorization: token ? `Bearer ${token}` : '' },
          }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === 0) {
        navigation.goBack();
      } else {
        setError(`Failed to add ${failed} product(s)`);
      }
    } catch {
      setError('Failed to add product');
    } finally {
      setSaving(false);
    }
  }

  return { items, loading, error, toggle, setPriceText, saveAll, saving };
}
