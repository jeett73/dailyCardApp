// import { Text, View } from '@/components/Themed';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
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

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const isValid = useMemo(() => phone.length === 10, [phone]);

  async function handleContinue() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return;
    Keyboard.dismiss();
    try {
      setLoading(true);
      await postRequest(apiEndpoint.auth.sendOtp, { phone: cleaned });
      navigation.navigate('Otp', { phone: cleaned });
    } catch (e) {
      const msg =
        (e as any)?.response?.data?.message ||
        (e as any)?.message ||
        'Unable to send OTP. Please try again.';
      Alert.alert('Failed to send OTP', String(msg));
    } finally {
      setLoading(false);
    }
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
        >
          {focused && <View style={styles.heroOverlay} pointerEvents="none" />}
        </ImageBackground>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, focused && styles.cardFloating]}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor="#0d101b"
              style={styles.input}
              maxLength={10}
            />
          </View>
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={!isValid || loading}
            style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Send OTP</Text>
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
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 24,
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
