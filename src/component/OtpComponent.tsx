import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';
import { postRequest } from '../api/apiMethods';
import apiEndpoint from '../constants/apiEndpoint';
import { setItem } from '../services/storage';

export function useOtp() {
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
  const [loading, setLoading] = useState<boolean>(false);
  const otp = useMemo(() => digits.join(''), [digits]);
  const isValid = useMemo(() => otp.length === 4, [otp]);

  const [remaining, setRemaining] = useState<number>(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const r0 = useRef<TextInput>(null);
  const r1 = useRef<TextInput>(null);
  const r2 = useRef<TextInput>(null);
  const r3 = useRef<TextInput>(null);
  const inputRefs = [r0, r1, r2, r3];

  function startTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemaining(60);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    startTimer();
    const idx = digits.findIndex((d) => !d);
    const focusIdx = idx === -1 ? 3 : idx;
    const t = setTimeout(() => inputRefs[focusIdx].current?.focus(), 150);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearTimeout(t);
    };
  }, []);

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
      const res = await postRequest(apiEndpoint.auth.verifyOtp, { phone, otp: cleaned });
      const { token, refreshToken, userId, entityType, isMpinAlreadySet } =
        (res?.data as any) ?? {};
      await Promise.all(
        [
          token && setItem('token', token),
          refreshToken && setItem('refreshToken', refreshToken),
          userId && setItem('userId', userId),
          entityType && setItem('entityType', entityType),
          userDetails?.name && setItem('name', userDetails.name),
          userDetails?.cardNumber && setItem('cardNumber', userDetails.cardNumber),
        ].filter(Boolean),
      );
      setSuccess(true);
      if (isMpinAlreadySet === null || isMpinAlreadySet === '') {
        navigation.navigate('SetMpin', { phone });
      } else {
        if (entityType === 'shop') {
          navigation.reset({ index: 0, routes: [{ name: 'Owner' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      }
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'OTP verification failed. Please try again.';
      Alert.alert('Failed to verify OTP', String(msg));
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    startTimer();
  }

  const timerText = `00:${remaining.toString().padStart(2, '0')}`;

  return {
    phone,
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
    remaining,
    timerText,
    inputRefs,
    handleVerify,
    handleResend,
  };
}
