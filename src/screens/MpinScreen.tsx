import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useMpin } from '@/component/MpinComponent';

const brandPurple = '#b3a0ff';

export default function MpinScreen() {
  const {
    phone,
    name,
    digits,
    setDigits,
    focusedIndex,
    setFocusedIndex,
    hasError,
    setHasError,
    success,
    initials,
    handleContinue,
    onDigit,
    onBackspace,
    onClear,
    inputRefs,
    setFocused,
  } = useMpin();

  return (
    <View style={styles.screen}>
      <HeroHeader color={brandPurple} title="" />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#fff' },
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
