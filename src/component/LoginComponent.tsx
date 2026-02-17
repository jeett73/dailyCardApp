import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getDeviceId } from '@/services/deviceService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { setItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useLogin() {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fcmToken, setFcmToken] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setFcmToken(token);
      }
    });
  }, []);

  function validate(currentPhone: string, currentPassword: string) {
    const newErrors: Record<string, string> = {};
    if (!currentPhone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (currentPhone.length !== 10) {
      newErrors.phone = 'Enter a valid 10 digit phone';
    }

    if (!currentPassword.trim()) {
      newErrors.password = 'Card Number is required';
    }
    return newErrors;
  }

  async function handleContinue() {
    setHasSubmitted(true);
    const cleaned = phone.replace(/\D/g, '');
    const currentErrors = validate(cleaned, password);

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    Keyboard.dismiss();
    try {
      setLoading(true);
      setError(null);

      let tokenToSend = fcmToken;
      if (!tokenToSend) {
        tokenToSend = await registerForPushNotificationsAsync();
        setFcmToken(tokenToSend);
      }

      const deviceId = await getDeviceId();

      const payload = {
        phone: cleaned,
        password,
        deviceId,
        fcmToken: tokenToSend,
      };

      const res = await postRequest(apiEndpoint.auth.login, payload);

      const {
        token,
        refreshToken,
        userId,
        entityType,
        isMpinAlreadySet,
        userDetails,
        shopId,
        shopName,
      } = res?.data ?? {};

      await Promise.all(
        [
          token && setItem('token', token),
          refreshToken && setItem('refreshToken', refreshToken),
          userId && setItem('userId', userId),
          entityType && setItem('entityType', entityType),
          userDetails?.name && setItem('name', userDetails.name),
          userDetails?.cardNumber && setItem('cardNumber', userDetails.cardNumber),
          shopId && setItem('shopId', shopId),
          userDetails?.phone && setItem('phone', userDetails?.phone),
          userDetails?.depositeAmount &&
          setItem('depositeAmount', userDetails?.depositeAmount.toString()),
          shopName && setItem('shopName', shopName),
        ].filter(Boolean),
      );

      if (!isMpinAlreadySet && entityType === 'shop') {
        navigation.navigate('SetMpin', { phone: cleaned });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: entityType === 'shop' ? 'Owner' : 'MainTabs' }],
        });
      }
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onPhoneChange(t: string) {
    const cleaned = t.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (hasSubmitted) {
      setErrors(validate(cleaned, password));
    } else if (errors.phone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  }

  function onPasswordChange(t: string) {
    setPassword(t);
    if (hasSubmitted) {
      setErrors(validate(phone, t));
    } else if (errors.password) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  }

  return {
    phone,
    password,
    focused,
    loading,
    error,
    errors,
    setPhone: onPhoneChange,
    setPassword: onPasswordChange,
    setFocused,
    handleContinue,
  };
}
