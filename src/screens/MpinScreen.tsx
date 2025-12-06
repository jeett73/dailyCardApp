import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { postRequest } from '../api/apiMethods';
import apiEndpoint from '../constants/apiEndpoint';
import { getItem } from '../services/storage';

export default function MpinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  const name: string | undefined = route?.params?.name;
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const otp = useMemo(() => digits.join(''), [digits]);
  const isValid = useMemo(() => otp.length === 4, [otp]);
  const [focused, setFocused] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const autoVerifyFiredRef = useRef<boolean>(false);

  const r0 = useRef<TextInput>(null);
  const r1 = useRef<TextInput>(null);
  const r2 = useRef<TextInput>(null);
  const r3 = useRef<TextInput>(null);
  const inputRefs = [r0, r1, r2, r3];

  function computeInitials(n?: string) {
    const s = (n ?? '').trim();
    if (!s) return '';
    const parts = s.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts[1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }

  const initials = computeInitials(name) || 'HD';

  useEffect(() => {
    if (isValid && !autoVerifyFiredRef.current) {
      autoVerifyFiredRef.current = true;
      handleContinue();
    } else if (!isValid) {
      autoVerifyFiredRef.current = false;
    }
  }, [isValid]);

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
    setSuccess(false);
    if (focusedIndex !== null) {
      if (!digits[focusedIndex] && focusedIndex > 0) {
        setDigits((prev) => {
          const arr = [...prev];
          arr[focusedIndex - 1] = '';
          return arr;
        });
        inputRefs[focusedIndex - 1].current?.focus();
        setFocusedIndex(focusedIndex - 1);
        setFocused(true);
      } else {
        setDigits((prev) => {
          const arr = [...prev];
          arr[focusedIndex] = '';
          return arr;
        });
      }
    } else {
      setDigits((prev) => {
        const arr = [...prev];
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i]) {
            arr[i] = '';
            inputRefs[i].current?.focus();
            setFocusedIndex(i);
            setFocused(true);
            break;
          }
        }
        return arr;
      });
    }
  }

  function onClear() {
    setDigits(['', '', '', '']);
    setHasError(false);
    setSuccess(false);
  }

  async function handleContinue() {
    const cleaned = otp.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setHasError(true);
      return;
    }
    setHasError(false);
    try {
      const userId = await getItem('userId');
      if (!userId) {
        Alert.alert('Missing Info', 'User ID not found');
        return;
      }
      const res = await postRequest(apiEndpoint.mpin.verify, { userId, mpin: cleaned });
      setSuccess(true);
      const entityType: string | undefined = (res?.data as any)?.entityType;
      if (entityType === 'shop') {
        navigation.replace('Owner');
      } else {
        navigation.replace('Customer');
      }
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Failed to verify MPIN. Please try again.';
      Alert.alert('Failed to verify MPIN', String(msg));
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { backgroundColor: Colors.light.brandPurple }]} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCircle} accessibilityLabel="User initials">
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <Text style={styles.title}>{name || 'Hiren Dabhi'}</Text>
        {!!phone && <Text style={styles.phone}>{phone}</Text>}
        <Text style={styles.subtitle}>Unlock using PIN</Text>
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
                returnKeyType={i === 3 ? 'done' : 'next'}
                onSubmitEditing={i === 3 ? handleContinue : undefined}
                style={[
                  styles.otpBox,
                  focusedIndex === i && styles.otpBoxFocused,
                  hasError && styles.otpBoxError,
                  success && styles.otpBoxSuccess,
                ]}
                textContentType="oneTimeCode"
                accessibilityLabel={`MPIN digit ${i + 1}`}
                accessibilityHint="Enter digit"
              />
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
          <TouchableOpacity
            style={styles.key}
            activeOpacity={0.8}
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel="Clear"
          >
            <Text style={styles.keyText}>Clear</Text>
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
            style={[styles.key]}
            activeOpacity={0.8}
            onPress={onBackspace}
            accessibilityRole="button"
            accessibilityLabel="Backspace"
          >
            <Text style={styles.utilKeyText}>⌫</Text>
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity activeOpacity={0.8} style={styles.faceIdBtn}>
          <Text style={styles.faceIdText}>USE FACE ID</Text>
        </TouchableOpacity> */}
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
    top: 40,
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
    marginBottom: 20,
    width: '80%',
    backgroundColor: 'white',
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    backgroundColor: 'white',
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
    top: 500,
    paddingHorizontal: 30,
    paddingTop: 8,
    backgroundColor: 'white',
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 10,
    backgroundColor: 'white',
  },
  key: {
    height: 60,
    width: 90,
    borderRadius: 5,
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
    fontWeight: '700',
  },
  keyText: {
    fontSize: 25,
    fontWeight: '700',
    color: Colors.light.text,
  },
  utilKey: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
  },
  utilKeyText: {
    fontSize: 25,
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
