import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

export function useLogin() {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const isValid = useMemo(() => phone.length === 10, [phone]);

  async function handleContinue() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return;
    Keyboard.dismiss();
    try {
      setLoading(true);
      await postRequest(apiEndpoint.auth.sendOtp, { phone: cleaned });
      navigation.navigate('Otp', { phone: cleaned });
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Unable to send OTP. Please try again.';
      Alert.alert('Failed to send OTP', String(msg));
    } finally {
      setLoading(false);
    }
  }

  function onPhoneChange(t: string) {
    setPhone(t.replace(/\D/g, '').slice(0, 10));
  }

  return {
    phone,
    focused,
    loading,
    isValid,
    setPhone: onPhoneChange,
    setFocused,
    handleContinue,
  };
}
