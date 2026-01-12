import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getDeviceId } from '@/services/deviceService';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { setItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

export function useLogin() {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | undefined>(undefined);
  const isValid = useMemo(() => phone.length === 10, [phone]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setFcmToken(token);
      }
    });
  }, []);

  async function handleContinue() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return;
    Keyboard.dismiss();
    try {
      setLoading(true);

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

      const { token, refreshToken, userId, entityType, isMpinAlreadySet, userDetails, shopId } =
        res?.data ?? {};

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
      Alert.alert('Login Failed', String(msg));
    } finally {
      setLoading(false);
    }
  }

  function onPhoneChange(t: string) {
    setPhone(t.replace(/\D/g, '').slice(0, 10));
  }

  return {
    phone,
    password,
    focused,
    loading,
    isValid,
    setPhone: onPhoneChange,
    setPassword,
    setFocused,
    handleContinue,
  };
}
