import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../constants/Colors';
import { useOtp } from '@/component/OtpComponent';

export default function OtpScreen() {
  const {
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
  } = useOtp();

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <ImageBackground
          source={require('../../assets/images/bg.png')}
          style={styles.heroImage}
          imageStyle={styles.heroImageInner}
          resizeMode="cover"
          blurRadius={focused ? 10 : 0}
        >
          {focused && <View style={styles.heroOverlay} pointerEvents="none" />}
        </ImageBackground>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, focused && styles.cardFloating]}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            {phone ? `Sent to +91 ${phone}` : 'Enter the OTP to continue'}
          </Text>
          <View style={styles.inputWrapper}>
            <View style={styles.otpRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={inputRefs[i]}
                  value={digits[i]}
                  onChangeText={(t) => {
                    const v = t.replace(/\D/g, '').slice(0, 1);
                    setDigits((prev) => {
                      const arr = [...prev];
                      arr[i] = v;
                      return arr;
                    });
                    setHasError(false);
                    if (v && i < 3) {
                      inputRefs[i + 1].current?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      if (!digits[i] && i > 0) {
                        setDigits((prev) => {
                          const arr = [...prev];
                          arr[i - 1] = '';
                          return arr;
                        });
                        inputRefs[i - 1].current?.focus();
                      } else {
                        setDigits((prev) => {
                          const arr = [...prev];
                          arr[i] = '';
                          return arr;
                        });
                      }
                    }
                  }}
                  onFocus={() => {
                    setFocused(true);
                    setFocusedIndex(i);
                  }}
                  onBlur={() => {
                    setFocused(false);
                    setFocusedIndex(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  onSubmitEditing={i === 3 ? handleVerify : undefined}
                  style={[
                    styles.otpBox,
                    focusedIndex === i && styles.otpBoxFocused,
                    hasError && styles.otpBoxError,
                    success && styles.otpBoxSuccess,
                  ]}
                  textContentType="oneTimeCode"
                  accessibilityLabel={`OTP digit ${i + 1}`}
                  accessibilityHint="Enter digit"
                />
              ))}
            </View>
          </View>

          {remaining !== 0 && (
            <Text style={styles.subtitle} testID="otp-timer">
              Resend OTP After {timerText} Seconds
            </Text>
          )}

          {remaining === 0 && (
            <TouchableOpacity
              onPress={handleResend}
              activeOpacity={0.8}
              style={styles.resendLink}
              testID="otp-resend-button"
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleVerify}
            activeOpacity={0.9}
            disabled={!isValid || loading}
            style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
            testID="otp-verify-button"
          >
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#fff' },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 550,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#f6f6f6',
    zIndex: 0,
  },
  heroImage: { flex: 1 },
  heroImageInner: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 500,
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    minHeight: 250,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardFloating: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 210,
    zIndex: 10000,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.light.text,
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(248,248,248,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    fontSize: 16,
    color: Colors.light.text,
  },
  otpBox: {
    height: 50,
    width: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    backgroundColor: '#f8f8f8',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  otpBoxFocused: {
    borderColor: Colors.light.tint,
    backgroundColor: '#eaf4ff',
  },
  otpBoxError: {
    borderColor: '#e53935',
  },
  otpBoxSuccess: {
    borderColor: Colors.light.tint,
    backgroundColor: '#a0c6ff',
  },
  resendLink: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
