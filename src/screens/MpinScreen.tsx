import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ImageBackground,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

export default function MpinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone: string | undefined = route?.params?.phone;
  const [pin, setPin] = useState('');
  const inputRef = useRef<TextInput>(null);
  const canContinue = useMemo(() => pin.length === 4, [pin]);
  const insets = useSafeAreaInsets();
  const keyboardOffset = insets.top;
  const { height: winH } = useWindowDimensions();
  const heroHeight = Math.max(420, Math.min(600, Math.round(winH * 0.62)));
  const overlap = 90;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }, []),
  );

  function focusInput() {
    inputRef.current?.focus();
  }

  function onForgot() {
    navigation.navigate('Login');
  }

  function onContinue() {
    if (!canContinue) return;
    navigation.replace('Owner');
  }

  const onFocus = () => {
    Animated.timing(overlayAnim, {
      toValue: 0.25,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const onBlur = () => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <ImageBackground
          source={require('../../assets/images/bg.png')}
          style={styles.heroImage}
          imageStyle={styles.heroImageInner}
          resizeMode="cover"
        >
          <Animated.View style={[styles.heroOverlay, { opacity: overlayAnim }]} pointerEvents="none" />
        </ImageBackground>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: heroHeight - overlap }]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Enter MPIN</Text>
            <Text style={styles.subtitle}>{phone ? `For +91 ${phone}` : 'Secure access to your account'}</Text>

            <TouchableWithoutFeedback onPress={focusInput}>
              <View style={styles.otpRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={[styles.otpCell, pin[i] && styles.otpCellFilled]}>
                    <Text style={styles.otpText}>{pin[i] ? '•' : ''}</Text>
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>

            <TextInput
              ref={inputRef}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              onFocus={onFocus}
              onBlur={onBlur}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              maxLength={4}
              secureTextEntry
              accessibilityLabel="Enter 4-digit MPIN"
            />

            <TouchableOpacity onPress={onForgot} activeOpacity={0.8} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot MPIN?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onContinue}
              disabled={!canContinue}
              activeOpacity={0.9}
              style={[styles.button, !canContinue && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  hiddenInput: {
    position: 'absolute',
    height: 0,
    width: 0,
    opacity: 0,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    marginTop: 8,
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
