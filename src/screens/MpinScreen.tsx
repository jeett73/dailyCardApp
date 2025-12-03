import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
  const brandPurple = '#b3a0ff';

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
      <View style={[styles.hero, { backgroundColor: brandPurple }]} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCircle} accessibilityLabel="User initials">
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <Text style={styles.title}>{name || 'Enter MPIN'}</Text>
        {!!phone && <Text style={styles.phone}>{phone}</Text>}
        <Text style={styles.subtitle}>Unlock using PIN</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.otpRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpDot,
                  hasError && styles.otpDotError,
                  success && styles.otpDotSuccess,
                ]}
                accessibilityLabel={`MPIN digit ${i + 1}`}
                accessibilityHint="Filled by keypad"
              >
                <Text style={styles.otpDotText}>{digits[i] ? '•' : ''}</Text>
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.8}>
          <Text style={styles.forgot}>Forgot Login PIN?</Text>
        </TouchableOpacity>
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
          <View style={styles.placeholderKey} />
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
        <TouchableOpacity activeOpacity={0.8} style={styles.faceIdBtn}>
          <Text style={styles.faceIdText}>USE FACE ID</Text>
        </TouchableOpacity>
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
    height: 120,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    zIndex: 0,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 150,
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    minHeight: 250,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.06)',
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
    backgroundColor: '#f3d7dc',
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
    color: '#e53935',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    color: Colors.light.text,
  },
  phone: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.light.text,
    marginBottom: 2,
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
  otpDot: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(13,16,27,0.15)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDotText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  otpDotError: {
    borderColor: '#e53935',
  },
  otpDotSuccess: {
    borderColor: Colors.light.tint,
  },
  keypadWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 400,
    paddingHorizontal: 30,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  key: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  placeholderKey: {
    width: '30%',
    aspectRatio: 1,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  utilKey: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
  },
  utilKeyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  forgot: {
    color: Colors.light.tint,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  faceIdBtn: {
    alignSelf: 'center',
    marginTop: 6,
  },
  faceIdText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '700',
  },
});
