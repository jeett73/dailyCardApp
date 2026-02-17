import { useResetPassword } from '@/component/ResetPasswordComponent';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
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
    // UI Props
    isTablet,
    contentWidth,
    headerHeight,
    fadeAnim,
    slideAnim,
  } = useResetPassword();

  const headerTitleSize = isTablet ? 32 : 28;

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    field: 'newPassword' | 'confirmPassword',
    placeholder: string,
    errorMsg?: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: themeColors.background,
          borderColor: errorMsg ? themeColors.destructive : themeColors.border
        }
      ]}>
        <Feather name="lock" size={20} color={themeColors.textSecondary} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          placeholder={placeholder}
          placeholderTextColor={themeColors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => handleBlur(field)}
          secureTextEntry
        />
      </View>
      {errorMsg && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={themeColors.destructive} />
          <Text style={[styles.errorText, { color: themeColors.destructive }]}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Curved Header Background */}
      <View style={[styles.headerBg, {
        height: headerHeight,
        backgroundColor: themeColors.brandPurple,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{
            width: contentWidth,
            alignSelf: 'center',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>

            {/* Header Title */}
            <View style={styles.headerContainer}>
              <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Reset Password</Text>
              <Text style={styles.headerSubtitle}>Create a new secure password</Text>
            </View>

            {/* Form Card */}
            <View style={[styles.card, {
              backgroundColor: themeColors.cardBackground,
              shadowColor: themeColors.shadow
            }]}>

              {renderInput(
                "New Password",
                newPassword,
                setNewPassword,
                'newPassword',
                "Enter new password",
                errors.newPassword
              )}

              {renderInput(
                "Confirm Password",
                confirmPassword,
                setConfirmPassword,
                'confirmPassword',
                "Confirm new password",
                errors.confirmPassword
              )}

              {error && (
                <View style={[styles.mainErrorContainer, { backgroundColor: themeColors.destructiveBackground }]}>
                  <Feather name="alert-triangle" size={16} color={themeColors.destructive} />
                  <Text style={[styles.mainErrorText, { color: themeColors.destructive }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: themeColors.brandPurple },
                  (!isValid || loading) && { opacity: 0.7, backgroundColor: themeColors.textSecondary }
                ]}
                activeOpacity={0.8}
                onPress={handleResetPassword}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mainErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  mainErrorText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
