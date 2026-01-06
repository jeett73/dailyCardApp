import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { postRequest } from '../api/apiMethods';
import apiEndpoint from '../constants/apiEndpoint';
import { getItem, setItem } from '../services/storage';

export function useMpin() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  // Initialize name from route params if available
  const [name, setName] = useState<string | undefined>(route?.params?.name);

  // Effect to load name from storage if not provided in params
  useEffect(() => {
    if (!name) {
      getItem('name').then((storedName) => {
        if (storedName) {
          setName(storedName);
        }
      });
    }
  }, [name]);

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const otp = useMemo(() => digits.join(''), [digits]);
  const isValid = useMemo(() => otp.length === 4, [otp]);
  const [focused, setFocused] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const autoVerifyFiredRef = useRef<boolean>(false);

  const r0 = useRef<TextInput>(null);
  const r1 = useRef<TextInput>(null);
  const r2 = useRef<TextInput>(null);
  const r3 = useRef<TextInput>(null);
  const inputRefs = [r0, r1, r2, r3];

  function computeInitials(n?: string) {
    const s = (n ?? '').trim();
    if (!s) return '';
    const parts = s.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts[1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }

  const initials = computeInitials(name) || 'HD';

  async function handleContinue() {
    const cleaned = otp.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setHasError(true);
      return;
    }
    setHasError(false);
    try {
      const userId = await getItem('userId');
      if (!userId) {
        Alert.alert('Missing Info', 'User ID not found');
        return;
      }
      const res = await postRequest(apiEndpoint.mpin.verify, { userId, mpin: cleaned });
      setSuccess(true);
      const entityType: string | undefined = (res?.data as any)?.entityType;
      const token: string | undefined = (res?.data as any)?.token;
      if (token) {
        Promise.all([setItem('token', token)]);
      }
      if (entityType === 'shop') {
        navigation.reset({ index: 0, routes: [{ name: 'Owner' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Failed to verify MPIN. Please try again.';
      Alert.alert('Failed to verify MPIN', String(msg));
    }
  }

  useEffect(() => {
    if (isValid && !autoVerifyFiredRef.current) {
      autoVerifyFiredRef.current = true;
      handleContinue();
    } else if (!isValid) {
      autoVerifyFiredRef.current = false;
    }
  }, [isValid]);

  function onDigit(d: string) {
    setDigits((prev) => {
      const arr = [...prev];
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i]) {
          arr[i] = d;
          break;
        }
      }
      return arr;
    });
    setHasError(false);
    setSuccess(false);
  }

  function onBackspace() {
    setSuccess(false);
    if (focusedIndex !== null) {
      if (!digits[focusedIndex] && focusedIndex > 0) {
        setDigits((prev) => {
          const arr = [...prev];
          arr[focusedIndex - 1] = '';
          return arr;
        });
        inputRefs[focusedIndex - 1].current?.focus();
        setFocusedIndex(focusedIndex - 1);
        setFocused(true);
      } else {
        setDigits((prev) => {
          const arr = [...prev];
          arr[focusedIndex] = '';
          return arr;
        });
      }
    } else {
      setDigits((prev) => {
        const arr = [...prev];
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i]) {
            arr[i] = '';
            inputRefs[i].current?.focus();
            setFocusedIndex(i);
            setFocused(true);
            break;
          }
        }
        return arr;
      });
    }
  }

  function onClear() {
    setDigits(['', '', '', '']);
    setHasError(false);
    setSuccess(false);
  }

  return {
    phone,
    name,
    digits,
    setDigits,
    focused,
    setFocused,
    focusedIndex,
    setFocusedIndex,
    hasError,
    setHasError,
    success,
    setSuccess,
    initials,
    handleContinue,
    onDigit,
    onBackspace,
    onClear,
    inputRefs,
  };
}
