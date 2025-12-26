import { postRequest } from '@/api/apiMethods';
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

export function useCreateCustomer() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    cardNumber: '',
    depositeAmount: '',
    street1: '',
    street2: '',
    city: '',
    state: 'Gujarat',
    postalCode: '',
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

  function setField<K extends keyof FormState>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function validate(): string[] {
    const messages: string[] = [];
    if (!form.name.trim()) messages.push('Name is required');
    if (!form.phone.trim()) {
      messages.push('Phone is required');
    } else if (!(isNumeric(form.phone) && form.phone.length === 10)) {
      messages.push('Enter a valid 10 digit phone');
    }
    if (!form.cardNumber.trim()) messages.push('Card Number is required');
    if (!form.depositeAmount.trim()) {
      messages.push('Deposit Amount is required');
    } else if (!/^[0-9]+(\\.[0-9]+)?$/.test(form.depositeAmount)) {
      messages.push('Deposit must be numeric');
    }
    if (!form.street1.trim()) messages.push('Street 1 is required');
    if (!form.city.trim()) messages.push('City is required');
    // if (!form.state.trim()) messages.push('State is required');
    // if (!form.postalCode.trim()) {
    //   messages.push('Postal Code is required');
    // } else if (
    //   !(isNumeric(form.postalCode) && form.postalCode.length >= 6 && form.postalCode.length <= 10)
    // ) {
    //   messages.push('Enter a valid postal code');
    // }
    return messages;
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

  async function handleSave() {
    const errs = validate();
    if (errs.length > 0) {
      Alert.alert('Validation Errors', errs.join('\n'));
      return;
    }

    try {
      setLoading(true);
      const token = await getItem('token');
      const shopId = await getItem('userId');
      const payload = {
        name: form.name.trim(),
        address: {
          street1: form.street1.trim(),
          // street2: form.street2.trim(),
          city: form.city.trim(),
          // state: form.state.trim(),
          // postalCode: form.postalCode.trim(),
        },
        phone: form.phone.trim(),
        cardNumber: form.cardNumber.trim(),
        regularProduct: [],
        depositeAmount: Number(form.depositeAmount),
        shopId: shopId,
      };
      await postRequest(apiEndpoint.customers.add, payload, {
        headers: { authorization: token ? `Bearer ${token}` : '' },
      });
      Alert.alert('Success', 'Customer created successfully');
      navigation.navigate('CustomerList');
    } catch {
      Alert.alert('Failed', 'Unable to create customer');
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
  };
}
