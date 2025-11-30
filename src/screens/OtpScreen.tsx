import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OtpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const canVerify = useMemo(() => code.length === 4, [code]);
  const insets = useSafeAreaInsets();
  const keyboardOffset = insets.top;

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }, []),
  );

  function focusInput() {
    inputRef.current?.focus();
  }

  function onVerify() {
    if (!canVerify) return;
    navigation.replace('Owner');
  }

  return (
    <ImageBackground
      source={require('../../assets/images/bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
      blurRadius={10}
      resizeMode="cover"
    >
      <View style={styles.overlay} pointerEvents="none" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>Sent to {phone ? `+91 ${phone}` : 'your phone'}</Text>

            <TouchableWithoutFeedback onPress={focusInput}>
              <View style={styles.otpRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={[styles.otpCell, code[i] && styles.otpCellFilled]}>
                    <Text style={styles.otpText}>{code[i] || ''}</Text>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              maxLength={4}
            />

            <TouchableOpacity
              onPress={onVerify}
              disabled={!canVerify}
              activeOpacity={0.9}
              style={[styles.button, !canVerify && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1 },
  bgImage: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    minHeight: 300,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
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
    marginBottom: 24,
  },
  otpRow: {
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpCell: {
    height: 56,
    width: 55,
    borderRadius: 12,
    backgroundColor: '#e0cde6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFilled: {
    backgroundColor: '#a0c6ff',
  },
  otpText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  hiddenInput: {
    position: 'absolute',
    height: 0,
    width: 0,
    opacity: 0,
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
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
