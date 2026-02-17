import { patchRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';

export function useResetPassword() {
  const navigation = useNavigation<any>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid = newPassword.length > 0 && confirmPassword.length > 0;

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!newPassword) newErrors.newPassword = 'New password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleBlur(field: 'newPassword' | 'confirmPassword') {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (field === 'newPassword') {
        if (!newPassword) newErrors.newPassword = 'New password is required';
        else delete newErrors.newPassword;
      }
      if (field === 'confirmPassword') {
        if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
        else if (newPassword && confirmPassword !== newPassword)
          newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
      }
      return newErrors;
    });
  }

  async function handleResetPassword() {
    setError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const shopId = await getItem('userId');
      if (!shopId) {
        throw new Error('Shop ID not found');
      }

      await patchRequest(apiEndpoint.shops.resetPassword(shopId), {
        password: newPassword,
      });

      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Responsive Logic
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const contentWidth = isTablet ? 500 : '100%';
  const headerHeight = isTablet ? 300 : 250;

  // Animation Logic
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    newPassword,
    setNewPassword: (t: string) => {
      setNewPassword(t);
      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
    },
    confirmPassword,
    setConfirmPassword: (t: string) => {
      setConfirmPassword(t);
      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    },
    loading,
    error,
    errors,
    isValid,
    handleResetPassword,
    handleBlur,
    // UI Props
    isTablet,
    contentWidth,
    headerHeight,
    fadeAnim,
    slideAnim,
  };
}
