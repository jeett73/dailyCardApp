import { getRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';

type ShopProduct = {
  _id?: any;
  productId: string;
  price: number;
  productName?: string;
  icon: string;
};

export function useProductList() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem('token');
        const shopId = await getItem('userId');
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
          icon: String(p?.icon || ''),
        }));
        const map: Record<string, boolean> = {};
        setProducts(list);
        setEnabledMap(map);
        setLoading(false);
      } catch {
        setError('Failed to load products');
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(
    () =>
      products.map((p) => ({
        id: String(p._id ?? p.productId),
        name: String(p.productName || p.productId),
        price: Number(p.price ?? 0),
        priceDisplay: `₹${Number(p.price ?? 0)}`,
        icon: p.icon,
      })),
    [products],
  );

  function onToggle(id: string, value: boolean) {
    setEnabledMap((prev) => ({ ...prev, [id]: value }));
  }

  function onAddPress() {
    navigation.navigate('AddProduct');
  }

  return { items, loading, error, onToggle, onAddPress };
}
