import OrderSheet from '@/component/OrderSheet';
import { Customer, useOwner } from '@/component/OwnerComponent';
import { AvatarInitials, toTitleCase } from '@/components/HeroHeader';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OwnerScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const ownerData = useOwner();
  const {
    input,
    filtered,
    customersLoading,
    onDigit,
    onBackspace,
    onClear,
    formatCardNumber,
    formatMobile,
    openSheet,
    // UI Props from Hook
    isTablet,
    contentWidth,
    headerHeight,
    cardWidth,
    fadeAnim,
    slideAnim,
  } = ownerData;

  const headerTitleSize = isTablet ? 28 : 22;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>

      {/* Curved Header Background */}
      <View style={[styles.headerBg, {
        height: headerHeight,
        backgroundColor: themeColors.brandPurple,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.container, { paddingTop: insets.top + (isTablet ? 30 : 20) }]}>

          {/* Header Content */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 24,
            marginBottom: 20,
          }}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Shop Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage customers & orders</Text>
              </View>
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.7}
              >
                <Feather name="grid" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, {
              backgroundColor: themeColors.cardBackground,
              shadowColor: themeColors.shadow
            }]}>
              <Feather name="search" size={18} color={themeColors.textSecondary} style={{ marginLeft: 16 }} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Search by card number..."
                placeholderTextColor={themeColors.textSecondary}
                value={input}
                maxLength={10}
                showSoftInputOnFocus={false} // Custom keypad
                editable={false} // Driven by keypad
              />
              {!!input && (
                <TouchableOpacity onPress={onClear} style={{ padding: 8 }}>
                  <Feather name="x-circle" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Customer List */}
          <Animated.ScrollView
            contentContainerStyle={[styles.listContainer, { width: contentWidth, alignSelf: 'center' }]}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim }}
          >
            {input && customersLoading && (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={themeColors.brandPurple} />
                <Text style={{ marginTop: 12, color: themeColors.textSecondary, fontWeight: '500' }}>Searching...</Text>
              </View>
            )}

            {input && !customersLoading && filtered.length === 0 && (
              <View style={{ paddingVertical: 60, alignItems: 'center', opacity: 0.7 }}>
                <Feather name="users" size={48} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.textSecondary, marginTop: 16 }]}>No customers found</Text>
              </View>
            )}

            <View style={[styles.grid, isTablet && { justifyContent: 'space-between' }]}>
              {filtered.map((c) => {
                const name = toTitleCase(String(c.name || '').trim());
                const cardFormatted = formatCardNumber(c.cardNumber);
                const mobileFormatted = formatMobile(c.phone);
                const dueAmount = Number(c.previousMonthDue || 0);
                const hasDue = dueAmount > 0;

                return (
                  <TouchableOpacity
                    key={String(c._id ?? `${c.name}-${c.cardNumber ?? ''}`)}
                    style={[
                      styles.customerCard,
                      {
                        width: cardWidth,
                        backgroundColor: themeColors.cardBackground,
                        borderColor: hasDue ? themeColors.destructiveBorder : themeColors.border,
                        shadowColor: themeColors.shadow
                      }
                    ]}
                    activeOpacity={0.7}
                    onPress={() => openSheet(c || ({} as Customer))}
                  >
                    <View style={styles.customerHeader}>
                      <AvatarInitials title={name || 'Un'} size={40} fontSize={14} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.customerName, { color: themeColors.text }]} numberOfLines={1}>{name || 'Unknown'}</Text>
                        <Text style={[styles.customerCardNo, { color: themeColors.textSecondary }]}>#{cardFormatted}</Text>
                      </View>
                      {hasDue && <Feather name="alert-circle" size={18} color={themeColors.destructive} />}
                    </View>

                    <View style={[styles.divider, { backgroundColor: hasDue ? 'rgba(229,57,53,0.1)' : themeColors.border }]} />

                    <View style={styles.customerMeta}>
                      <View style={styles.metaItem}>
                        <Feather name="phone" size={12} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{mobileFormatted}</Text>
                      </View>
                      {hasDue && (
                        <View style={styles.metaItem}>
                          <Text style={[styles.dueLabel, { color: themeColors.destructive }]}>Due:</Text>
                          <Text style={[styles.dueValue, { color: themeColors.destructive }]}>₹{dueAmount}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Spacer for Keypad */}
            <View style={{ height: 340 }} />
          </Animated.ScrollView>

          {/* Keypad */}
          <Animated.View
            style={[
              styles.keypadWrapper,
              {
                backgroundColor: themeColors.keypadBackground,
                paddingBottom: Math.max(insets.bottom, 12),
                transform: [{ translateY: slideAnim }]
              },
            ]}
          >
            <View style={{ width: isTablet ? 480 : '100%', alignSelf: 'center' }}>
              {/* Keypad Rows usually handled by loop, explicit here for custom keys */}
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
              ].map((row, rowIndex) => (
                <View key={rowIndex} style={styles.keypadRow}>
                  {row.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.key, { backgroundColor: themeColors.keypadPressed, shadowColor: themeColors.shadow }]}
                      activeOpacity={0.7}
                      onPress={() => onDigit(d)}
                    >
                      <Text style={[styles.keyText, { color: themeColors.keypadText }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={styles.keypadRow}>
                <TouchableOpacity
                  style={[styles.key, { backgroundColor: themeColors.keypadBackground, elevation: 0 }]}
                  onPress={onClear}
                >
                  <Text style={[styles.utilKeyText, { color: themeColors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.key, { backgroundColor: themeColors.keypadPressed, shadowColor: themeColors.shadow }]}
                  onPress={() => onDigit('0')}
                >
                  <Text style={[styles.keyText, { color: themeColors.keypadText }]}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.key, { backgroundColor: themeColors.keypadBackground, elevation: 0 }]}
                  onPress={onBackspace}
                >
                  <Feather name="delete" size={24} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <OrderSheet {...ownerData} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  container: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent', // controlled by theme
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // centered for mobile list
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    flexShrink: 1, // Prevent text overflow
  },
  customerCardNo: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  customerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dueLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  dueValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  keypadWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
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
    width: 60, // approximate, flex handled in parent mostly or fixed logic
    flex: 1,
    maxWidth: 90,
    height: 60,
    marginHorizontal: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
  utilKeyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
