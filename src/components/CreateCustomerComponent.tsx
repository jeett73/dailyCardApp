import { getRequest, postRequest, putRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, ScrollView } from 'react-native';

export type FormState = {
  name: string;
  phone: string;
  cardNumber: string;
  depositeAmount: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
};

function isNumeric(str: string): boolean {
  return /^[0-9]+$/.test(str);
}

export function useCreateCustomer(params?: {
  mode?: 'edit';
  initial?: Partial<FormState> & { id?: string };
}) {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const isEdit = params?.mode === 'edit';
  const customerIdRef = useRef<string | undefined>(params?.initial?.id);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: String(params?.initial?.name ?? ''),
    phone: String(params?.initial?.phone ?? ''),
    cardNumber: String(params?.initial?.cardNumber ?? ''),
    depositeAmount: String(params?.initial?.depositeAmount ?? ''),
    street1: String(params?.initial?.street1 ?? ''),
    street2: String(params?.initial?.street2 ?? ''),
    city: String(params?.initial?.city ?? ''),
    state: String(params?.initial?.state ?? 'Gujarat'),
    postalCode: String(params?.initial?.postalCode ?? ''),
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<keyof FormState, number>>({
    name: 0,
    street1: 0,
    street2: 0,
    city: 0,
    state: 0,
    postalCode: 0,
    phone: 0,
    cardNumber: 0,
    depositeAmount: 0,
  });
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardPadding(e?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardPadding(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
        const list = arr
          .map((p: any) => ({
            id: String(p?._id),
            name: String(p?.productName),
            price: Number(p?.price || 0),
          }))
          .filter((p: { id: string; name: string }) => !!p.id && !!p.name.trim());
        setProducts(list);
        setProductsLoading(false);
      } catch {
        setProductsError('Failed to load products');
        setProductsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isEdit || !customerIdRef.current) return;
      try {
        setPrefillLoading(true);
        setPrefillError(null);
        const res = await getRequest(apiEndpoint.customers.customerById(customerIdRef.current));
        const raw = (res?.data ?? {}) as any;
        const data = raw?.customer ?? raw;
        const rp = Array.isArray(data?.regularProduct) ? data?.regularProduct : [];
        const nextSelected: Record<string, number> = {};
        for (const it of rp) {
          const pid = String(it?.productId ?? '');
          const qty = Number(it?.qty ?? it?.quantity ?? 0);
          if (pid && qty > 0) nextSelected[pid] = qty;
        }
        if (!cancelled) {
          setSelectedProducts(nextSelected);
          setForm({
            name: String(data?.name ?? ''),
            phone: String(data?.phone ?? ''),
            cardNumber: String(data?.cardNumber ?? ''),
            depositeAmount: String(data?.depositeAmount ?? ''),
            street1: String(data?.address?.street1 ?? ''),
            street2: String(data?.address?.street2 ?? ''),
            city: String(data?.address?.city ?? ''),
            state: String(data?.address?.state ?? 'Gujarat'),
            postalCode: String(data?.address?.postalCode ?? ''),
          });
        }
      } catch (e) {
        if (!cancelled) setPrefillError('Failed to load customer');
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  function setField<K extends keyof FormState>(k: K, v: string) {
    const nextForm = { ...form, [k]: v };
    setForm(nextForm);

    if (hasSubmitted) {
      setErrors(validate(nextForm));
    } else if (errors[k]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });
    }
  }

  function validate(values: FormState = form): Partial<Record<keyof FormState, string>> {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!values.name.trim()) newErrors.name = 'Name is required';
    if (!values.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!(isNumeric(values.phone) && values.phone.length === 10)) {
      newErrors.phone = 'Enter a valid 10 digit phone';
    }
    if (!values.cardNumber.trim()) newErrors.cardNumber = 'Card Number is required';
    if (!values.depositeAmount.trim()) {
      newErrors.depositeAmount = 'Deposit Amount is required';
    } else if (!/^[0-9]+(\.[0-9]+)?$/.test(values.depositeAmount)) {
      newErrors.depositeAmount = 'Deposit must be numeric';
    }
    if (!values.street1.trim()) newErrors.street1 = 'Street 1 is required';
    if (!values.city.trim()) newErrors.city = 'City is required';
    // if (!values.state.trim()) newErrors.state = 'State is required';
    // if (!values.postalCode.trim()) {
    //   newErrors.postalCode = 'Postal Code is required';
    // } else if (
    //   !(isNumeric(values.postalCode) && values.postalCode.length >= 6 && values.postalCode.length <= 10)
    // ) {
    //   newErrors.postalCode = 'Enter a valid postal code';
    // }
    return newErrors;
  }

  function scrollToField(field: keyof FormState) {
    const y = inputPositions.current[field] ?? 0;
    const offset = Math.max(0, y - 24);
    scrollRef.current?.scrollTo({ y: offset, animated: true });
  }

  function getHandlers(field: keyof FormState) {
    return {
      onFocus: () => scrollToField(field),
      onLayout: (e: any) => {
        inputPositions.current[field] = e?.nativeEvent?.layout?.y ?? 0;
      },
    };
  }

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  }

  function setProductQty(id: string, qtyText: string) {
    const t = qtyText.replace(/\D/g, '');
    const n = Number(t);
    setSelectedProducts((prev) => {
      if (!t) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: Number.isFinite(n) && n > 0 ? n : 0 };
    });
  }

  async function handleSave() {
    setHasSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstField = Object.keys(errs)[0] as keyof FormState;
      if (firstField) scrollToField(firstField);
      return;
    }

    try {
      setLoading(true);
      const token = await getItem('token');
      const shopId = await getItem('userId');
      const regularProduct = Object.entries(selectedProducts)
        .map(([productId, qty]) => ({ productId, qty }))
        .filter((p) => Number(p.qty) > 0);
      const payload = {
        name: form.name.trim(),
        address: {
          street1: form.street1.trim(),
          // street2: form?.street2?.trim() ?? '',
          // city: form?.city?.trim() ?? '',
          // state: form?.state?.trim() ?? '',
          // postalCode: form?.postalCode?.trim() ?? '',
        },
        // phone: form.phone.trim(),
        cardNumber: form.cardNumber.trim(),
        regularProduct,
        // depositeAmount: Number(form.depositeAmount),
        // shopId: shopId,
      };
      if (isEdit && customerIdRef.current) {
        await putRequest(apiEndpoint.customers.update(customerIdRef.current), payload);
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await postRequest(apiEndpoint.customers.add, payload, {
          headers: { authorization: token ? `Bearer ${token}` : '' },
        });
        Alert.alert('Success', 'Customer created successfully');
      }
      navigation.navigate('CustomerList');
    } catch (err) {
      Alert.alert(
        'Failed',
        isEdit
          ? err instanceof Error
            ? err.message
            : String(err ?? 'Unable to update customer')
          : err instanceof Error
            ? err.message
            : String(err ?? 'Unable to create customer'),
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    form,
    setField,
    loading,
    handleSave,
    scrollRef,
    inputPositions,
    keyboardPadding,
    scrollToField,
    getHandlers,
    products,
    productsLoading,
    productsError,
    selectedProducts,
    toggleProduct,
    setProductQty,
    isEdit,
    prefillLoading,
    prefillError,
    errors,
  };
}
