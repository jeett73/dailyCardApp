import { useResetPassword } from '@/component/ResetPasswordComponent';
import HeroHeader from '@/components/HeroHeader';
import Colors from '@/constants/Colors';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    errors,
    isValid,
    handleResetPassword,
    handleBlur,
  } = useResetPassword();

  return (
    <View style={styles.container}>
      <HeroHeader color={Colors.light.brandPurple} title="Reset Password" />

      <View style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: Platform.OS === 'ios' ? 80 : insets.top + 90 },
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={[styles.input, errors.newPassword && styles.inputError]}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              onBlur={() => handleBlur('newPassword')}
              secureTextEntry
            />
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => handleBlur('confirmPassword')}
              secureTextEntry
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {error && <Text style={styles.mainErrorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.saveButton, (!isValid || loading) && styles.saveButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleResetPassword}
              disabled={!isValid || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardSpacer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  card: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: { marginTop: 12, fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  input: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    fontSize: 12,
    color: '#e53935',
    marginTop: 4,
    marginLeft: 4,
  },
  mainErrorText: {
    fontSize: 14,
    color: '#e53935',
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  keyboardSpacer: { height: 0 },
});
