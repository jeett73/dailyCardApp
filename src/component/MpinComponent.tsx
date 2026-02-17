import { log } from '@/services/logger';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, TextInput, useWindowDimensions } from 'react-native';
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
  const [loading, setLoading] = useState<boolean>(false);

  const autoVerifyFiredRef = useRef<boolean>(false);
  const verifyInFlightRef = useRef<boolean>(false);

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

  function resetMpin() {
    autoVerifyFiredRef.current = false;
    setDigits(['', '', '', '']);
    setFocused(true);
    setFocusedIndex(0);
    inputRefs[0].current?.focus();
  }

  async function handleContinue() {
    if (verifyInFlightRef.current) return;
    const cleaned = otp.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setSuccess(false);
    try {
      verifyInFlightRef.current = true;
      setLoading(true);
      const userId = await getItem('userId');
      if (!userId) {
        return;
      }
      const res = await postRequest(apiEndpoint.mpin.verify, { userId, mpin: cleaned });
      setSuccess(true);
      setLoading(false);
      const entityType: string | undefined = (res?.data as any)?.entityType;
      const token: string | undefined = (res?.data as any)?.token;
      if (token) {
        await Promise.all([setItem('token', token)]);
      }
      if (entityType === 'shop') {
        navigation.reset({ index: 0, routes: [{ name: 'Owner' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e) {
      setHasError(true);
      setSuccess(false);
      resetMpin();
    } finally {
      setLoading(false);
      verifyInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (isValid && !autoVerifyFiredRef.current && !loading) {
      autoVerifyFiredRef.current = true;
      handleContinue();
    } else if (!isValid) {
      autoVerifyFiredRef.current = false;
    }
  }, [isValid, loading]);

  function onDigit(d: string) {
    if (loading) return;
    setDigits((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((x) => !x);
      if (idx === -1) {
        return arr;
      }
      arr[idx] = d;
      const nextIdx = Math.min(idx + 1, 3);
      setFocused(true);
      setFocusedIndex(nextIdx);
      inputRefs[nextIdx].current?.focus();
      return arr;
    });
    setHasError(false);
    setSuccess(false);
  }

  function onBackspace() {
    if (loading) return;
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
        inputRefs[focusedIndex].current?.focus();
        setFocusedIndex(focusedIndex);
        setFocused(true);
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
    if (loading) return;
    setDigits(['', '', '', '']);
    setHasError(false);
    setSuccess(false);
    autoVerifyFiredRef.current = false;
    setFocused(true);
    setFocusedIndex(0);
    inputRefs[0].current?.focus();
  }

  // Responsive Logic
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const contentWidth = isTablet ? 480 : '100%';
  const headerTitleSize = isTablet ? 32 : 24;
  const avatarSize = isTablet ? 100 : 80;
  const avatarInitialsSize = isTablet ? 36 : 28;
  const keyHeight = isTablet ? 80 : 60;
  const keyWidth = isTablet ? 110 : 90;
  const headerHeight = isTablet ? 300 : 260;

  // Animation Logic
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    loading,
    initials,
    handleContinue,
    onDigit,
    onBackspace,
    onClear,
    inputRefs,
    // UI/Responsive Props
    isTablet,
    contentWidth,
    headerTitleSize,
    avatarSize,
    avatarInitialsSize,
    keyHeight,
    keyWidth,
    headerHeight,
    // Animation Props
    fadeAnim,
    slideAnim,
  };
}
