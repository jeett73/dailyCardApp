import { useLogin } from '@/component/LoginComponent';
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

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const {
    phone,
    password,
    loading,
    error,
    errors,
    setPhone,
    setPassword,
    handleContinue,
    // UI Props from Hook
    isTablet,
    contentWidth,
    headerHeight,
    fadeAnim,
    slideAnim,
  } = useLogin();

  const headerTitleSize = isTablet ? 36 : 30;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Curved Header Background */}
      <View style={[styles.headerBg, {
        height: headerHeight,
        backgroundColor: themeColors.brandPurple,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + (isTablet ? 60 : 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{
            width: contentWidth,
            alignSelf: 'center',
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>

            {/* Header Content */}
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Welcome</Text>
              <Text style={styles.headerSubtitle}>Sign in to your account</Text>
            </View>

            {/* Login Card */}
            <View style={[styles.card, {
              backgroundColor: themeColors.cardBackground,
              shadowColor: themeColors.shadow
            }]}>

              {/* Phone Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Mobile Number</Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: themeColors.iconBackground,
                  borderColor: errors.phone ? themeColors.destructive : themeColors.border
                }]}>
                  <Feather name="phone" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={themeColors.textSecondary}
                    style={[styles.input, { color: themeColors.text }]}
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
                {errors.phone && <Text style={[styles.errorText, { color: themeColors.destructive }]}>{errors.phone}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Card Number</Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: themeColors.iconBackground,
                  borderColor: errors.password ? themeColors.destructive : themeColors.border
                }]}>
                  <Feather name="credit-card" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter card number"
                    placeholderTextColor={themeColors.textSecondary}
                    style={[styles.input, { color: themeColors.text }]}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
                {errors.password && <Text style={[styles.errorText, { color: themeColors.destructive }]}>{errors.password}</Text>}
              </View>

              {/* API Error */}
              {!!error && <Text style={[styles.apiErrorText, { color: themeColors.destructive }]}>{error}</Text>}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={loading}
                style={[styles.button, {
                  backgroundColor: themeColors.brandPurple,
                  opacity: loading ? 0.7 : 1,
                  shadowColor: themeColors.brandPurple
                }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
                By logging in, you agree to our Terms & Conditions
              </Text>
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  apiErrorText: {
    marginTop: 0,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  }
});
