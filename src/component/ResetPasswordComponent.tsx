import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert } from 'react-native';

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
      const userId = await getItem('userId');
      if (!userId) {
        throw new Error('User not found');
      }

      await postRequest(apiEndpoint.auth.resetPassword, {
        userId,
        password: newPassword,
      });

      Alert.alert('Success', 'Password has been reset successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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
  };
}
