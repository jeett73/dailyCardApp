import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function MpinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  const name: string | undefined = route?.params?.name;
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const otp = useMemo(() => digits.join(''), [digits]);
  const isValid = useMemo(() => otp.length === 4, [otp]);
  const focused = true;
  const [hasError, setHasError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  function computeInitials(n?: string) {
    const s = (n ?? '').trim();
    if (!s) return '';
    const parts = s.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts[1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }

  const initials = computeInitials(name) || 'GU';

  function onDigit(d: string) {
    setDigits((prev) => {
      const arr = [...prev];
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i]) {
          arr[i] = d;
          break;
        }
      }
      return arr;
    });
    setHasError(false);
    setSuccess(false);
  }

  function onBackspace() {
    setDigits((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]) {
          arr[i] = '';
          break;
        }
      }
      return arr;
    });
    setSuccess(false);
  }

  function onClear() {
    setDigits(['', '', '', '']);
    setHasError(false);
    setSuccess(false);
  }

  function handleContinue() {
    const cleaned = otp.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setSuccess(true);
    navigation.replace('Owner');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <ImageBackground
          source={require('../../assets/images/bg.png')}
          style={styles.heroImage}
          imageStyle={styles.heroImageInner}
          resizeMode="cover"
          blurRadius={focused ? 10 : 0}
        />
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, focused && styles.cardFloating]}>
          <View style={styles.profileCircle} accessibilityLabel="User initials">
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <Text style={styles.title}>Enter MPIN</Text>
          <Text style={styles.subtitle}>
            {phone ? `For +91 ${phone}` : 'Secure access to your account'}
          </Text>
          <View style={styles.inputWrapper}>
            <View style={styles.otpRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    hasError && styles.otpBoxError,
                    success && styles.otpBoxSuccess,
                  ]}
                  accessibilityLabel={`MPIN digit ${i + 1}`}
                  accessibilityHint="Filled by keypad"
                >
                  <Text style={styles.otpText}>{digits[i] ? '•' : ''}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={!isValid}
            style={[styles.button, !isValid && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            testID="mpin-verify-button"
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.keypadWrapper}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((d) => (
            <TouchableOpacity
              key={d}
              style={styles.key}
              activeOpacity={0.8}
              onPress={() => onDigit(d)}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
            >
              <Text style={styles.keyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((d) => (
            <TouchableOpacity
              key={d}
              style={styles.key}
              activeOpacity={0.8}
              onPress={() => onDigit(d)}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
            >
              <Text style={styles.keyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((d) => (
            <TouchableOpacity
              key={d}
              style={styles.key}
              activeOpacity={0.8}
              onPress={() => onDigit(d)}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${d}`}
            >
              <Text style={styles.keyText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={[styles.key, styles.utilKey]}
            activeOpacity={0.8}
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear MPIN"
          >
            <Text style={styles.utilKeyText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            activeOpacity={0.8}
            onPress={() => onDigit('0')}
            accessibilityRole="button"
            accessibilityLabel="Digit 0"
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.key, styles.utilKey]}
            activeOpacity={0.8}
            onPress={onBackspace}
            accessibilityRole="button"
            accessibilityLabel="Backspace"
          >
            <Text style={styles.utilKeyText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  profileCircle: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
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
  otpBox: {
    height: 50,
    width: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  otpBoxError: {
    borderColor: '#e53935',
  },
  otpBoxSuccess: {
    borderColor: Colors.light.tint,
    backgroundColor: '#a0c6ff',
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
  keypadWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 25,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  key: {
    flex: 1,
    height: 56,
    marginHorizontal: 6,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  utilKey: {
    backgroundColor: '#0d101b',
  },
  utilKeyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
