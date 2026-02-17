import { useMpin } from '@/component/MpinComponent';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function MpinScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 768;
  const contentWidth = isTablet ? 480 : '100%';

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
    loading,
    initials,
    handleContinue,
    onDigit,
    onBackspace,
    onClear,
    inputRefs,
    setFocused,
  } = useMpin();

  // Tablet: Dynamic sizing
  const headerTitleSize = isTablet ? 32 : 24;
  const avatarSize = isTablet ? 100 : 80;
  const avatarInitialsSize = isTablet ? 36 : 28;
  const keyHeight = isTablet ? 80 : 60;
  const keyWidth = isTablet ? 110 : 90;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header Background */}
      <View style={[styles.headerBg, {
        height: isTablet ? 300 : 260,
        backgroundColor: themeColors.brandPurple,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      }]}
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentWidth, alignSelf: 'center', alignItems: 'center' }}>

          {/* Header Content */}
          <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Enter MPIN to continue</Text>

          {/* Profile Card */}
          <View style={[styles.card, {
            backgroundColor: themeColors.cardBackground,
            shadowColor: themeColors.shadow
          }]}>
            <View style={[styles.profileCircle, {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: themeColors.iconBackground
            }]}>
              <Text style={[styles.profileInitials, { fontSize: avatarInitialsSize, color: themeColors.brandPurple }]}>{initials}</Text>
            </View>

            <Text style={[styles.userName, { color: themeColors.text }]}>{name || 'User'}</Text>

            {!!phone && (
              <View style={styles.phoneRow}>
                <Feather name="phone" size={14} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.phoneText, { color: themeColors.textSecondary }]}>{phone}</Text>
              </View>
            )}
          </View>

          {/* MPIN Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.otpRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={inputRefs[i]}
                  value={digits[i]}
                  editable={!loading}
                  showSoftInputOnFocus={false} // Custom keypad
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: themeColors.otpBoxBackground,
                      borderColor: themeColors.otpBoxBorder,
                      color: themeColors.text
                    },
                    focusedIndex === i && { borderColor: themeColors.brandPurple, backgroundColor: themeColors.menuPressed }, // focused state
                    hasError && { borderColor: themeColors.destructive },
                    success && { borderColor: themeColors.brandPurple, backgroundColor: themeColors.iconBackground },
                  ]}
                  // Event handlers passed from hook mostly, but we need to ensure focus logic works with custom keypad
                  onFocus={() => {
                    setFocused(true);
                    setFocusedIndex(i);
                  }}
                />
              ))}
            </View>
            {hasError && <Text style={[styles.errorText, { color: themeColors.destructive }]}>Invalid MPIN. Please try again.</Text>}
            {loading && <ActivityIndicator color={themeColors.brandPurple} style={{ marginTop: 10 }} />}
          </View>

        </View>
      </ScrollView>

      {/* Keypad */}
      <View style={[styles.keypadWrapper, { backgroundColor: themeColors.keypadBackground, paddingBottom: insets.bottom }]}>
        <View style={{ width: contentWidth, alignSelf: 'center' }}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.key,
                    {
                      width: keyWidth,
                      height: keyHeight,
                      backgroundColor: themeColors.keypadPressed,
                      shadowColor: themeColors.shadow
                    }
                  ]}
                  activeOpacity={0.7}
                  disabled={loading}
                  onPress={() => onDigit(d)}
                >
                  <Text style={[styles.keyText, { color: themeColors.keypadText }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={[styles.key, { width: keyWidth, height: keyHeight, backgroundColor: 'transparent', elevation: 0 }]}
              onPress={onClear}
              disabled={loading}
            >
              <Text style={[styles.keyText, { fontSize: 16, color: themeColors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.key,
                {
                  width: keyWidth,
                  height: keyHeight,
                  backgroundColor: themeColors.keypadPressed,
                  shadowColor: themeColors.shadow
                }
              ]}
              onPress={() => onDigit('0')}
              disabled={loading}
            >
              <Text style={[styles.keyText, { color: themeColors.keypadText }]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.key, { width: keyWidth, height: keyHeight, backgroundColor: 'transparent', elevation: 0 }]}
              onPress={onBackspace}
              disabled={loading}
            >
              <Feather name="delete" size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 30,
  },
  profileCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInitials: {
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  keypadWrapper: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
