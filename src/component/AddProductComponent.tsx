import { getRequest, postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type CatalogProduct = { _id: string; name: string };
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
        const res = await getRequest(apiEndpoint.products.list, {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        const data = (res?.data ?? {}) as any;
        const arr = Array.isArray(data?.products)
          ? data?.products
          : Array.isArray(data)
            ? data
            : [];
        const list: CatalogProduct[] = arr
          .map((p: any) => ({
            _id: String(p?._id ?? p?.id ?? ''),
            name: String(p?.Name ?? p?.name ?? p?.productName ?? p?.title ?? ''),
          }))
          .filter((p: CatalogProduct) => !!p._id && !!p.name.trim());
        console.log('products', list);

        setProducts(list);
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
        return { id, name: p.name, selected, priceText };
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
    const keys = Object.keys(selectedProducts);
    if (keys.length === 0) return;
    const invalid = keys.filter((id) => {
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
      const payloads = keys.map((id) => ({
        shopId: String(shopId ?? ''),
        productId: selectedProducts[id].productId,
        price: Number(enteredPrices[id] ?? 0),
      }));
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
