import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { postRequest } from '../api/apiMethods';
import apiEndpoint from '../constants/apiEndpoint';
import Colors from '../constants/Colors';
import { setItem } from '../services/storage';

export default function OtpScreen() {
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
