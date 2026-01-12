import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';

export function useSetMpin() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  const initialOtp = (route?.params?.otp ?? '').replace(/\D/g, '').slice(0, 4);
  const [digits, setDigits] = useState<string[]>([
    initialOtp[0] ?? '',
    initialOtp[1] ?? '',
    initialOtp[2] ?? '',
    initialOtp[3] ?? '',
  ]);
  const [focused, setFocused] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const otp = useMemo(() => digits.join(''), [digits]);
  const isValid = useMemo(() => otp.length === 4, [otp]);
  const [loading, setLoading] = useState<boolean>(false);

  const r0 = useRef<TextInput>(null);
  const r1 = useRef<TextInput>(null);
  const r2 = useRef<TextInput>(null);
  const r3 = useRef<TextInput>(null);
  const inputRefs = [r0, r1, r2, r3];

  async function handleVerify() {
    const cleaned = otp.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setHasError(true);
      return;
    }
    setHasError(false);
    Keyboard.dismiss();
    try {
      setLoading(true);
      const userId = await getItem('userId');
      if (!userId) {
        return;
      }
      await postRequest(apiEndpoint.mpin.set, { userId, mpin: cleaned });
      setSuccess(true);
      const entityType = (await getItem('entityType')) || 'customer';
      if (entityType === 'shop') {
        navigation.reset({ index: 0, routes: [{ name: 'Owner' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Failed to set MPIN. Please try again.';
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(text: string, i: number) {
    const v = text.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const arr = [...prev];
      arr[i] = v;
      return arr;
    });
    setHasError(false);
    if (v && i < 3) {
      inputRefs[i + 1].current?.focus();
    }
  }

  function handleKeyPress(e: any, i: number) {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        setDigits((prev) => {
          const arr = [...prev];
          arr[i - 1] = '';
          return arr;
        });
        inputRefs[i - 1].current?.focus();
      } else {
        setDigits((prev) => {
          const arr = [...prev];
          arr[i] = '';
          return arr;
        });
      }
    }
  }

  function handleFocus(i: number) {
    setFocused(true);
    setFocusedIndex(i);
  }

  function handleBlur() {
    setFocused(false);
    setFocusedIndex(null);
  }

  return {
    digits,
    setDigits,
    focused,
    setFocused,
    focusedIndex,
    setFocusedIndex,
    hasError,
    setHasError,
    success,
    loading,
    isValid,
    inputRefs,
    handleVerify,
    handleDigitChange,
    handleKeyPress,
    handleFocus,
    handleBlur,
  };
}
