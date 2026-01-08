import OrderSheet from '@/component/OrderSheet';
import { Customer, useOwner } from '@/component/OwnerComponent';
import HeroHeader, { AvatarInitials, toTitleCase } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const brandPurple = '#b3a0ff';

export default function OwnerScreen() {
  const insets = useSafeAreaInsets();
  const ownerData = useOwner();
  const {
    input,
    filtered,
    onDigit,
    onBackspace,
    onClear,
    formatCardNumber,
    formatMobile,
    openSheet,
  } = ownerData;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <HeroHeader color={brandPurple} showHomeIcon={true} />
      <View style={[styles.container, { paddingTop: insets.top + 90 }]}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter card number..."
            placeholderTextColor="#aaa"
            value={input}
            maxLength={10}
            autoFocus={true}
            showSoftInputOnFocus={false}
            inputView={<View />}
          />
          <View style={styles.searchIconWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {input && filtered.length === 0 && (
            <Text style={styles.emptyText}>No customers found</Text>
          )}
          {filtered.map((c) => {
            const name = toTitleCase(String(c.name || '').trim());
            const cardFormatted = formatCardNumber(c.cardNumber);
            const mobileFormatted = formatMobile(c.phone);
            const dueAmount = Number(c.previousMonthDue || 0);
            return (
              <TouchableOpacity
                key={String(c._id ?? `${c.name}-${c.cardNumber ?? ''}`)}
                style={[styles.customerCard, dueAmount > 0 && styles.dueCard]}
                activeOpacity={0.85}
                onPress={() => {
                  openSheet(c || ({} as Customer));
                }}
                accessibilityLabel={`${name || 'Unknown'} • Card ${cardFormatted} • Mobile ${mobileFormatted}`}
              >
                <View style={[styles.customerRow, dueAmount > 0 && styles.customerRowDue]}>
                  <AvatarInitials title={name || 'Unknown'} />
                  <View style={[styles.customerInfo, dueAmount > 0 && styles.customerInfoDue]}>
                    <Text style={styles.customerTitle}>
                      <Text style={{ fontStyle: 'italic' }}>#{cardFormatted}</Text>{' '}
                      {name || 'Hiren Dabhi'}
                    </Text>
                    <View style={[styles.metaRow, dueAmount > 0 && styles.metaRowDue]}>
                      <Text style={styles.metaLabel}>Mobile</Text>
                      <Text style={styles.metaValue}>{mobileFormatted}</Text>
                    </View>
                    {dueAmount > 0 ? (
                      <View style={[styles.metaRow, dueAmount > 0 && styles.metaRowDue]}>
                        <Text style={styles.metaLabel}>Due Amount</Text>
                        <Text style={styles.metaValue}>₹ {dueAmount}</Text>
                      </View>
                    ) : (
                      <></>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.keypadWrapper,
            {
              bottom: 0,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.key}
                activeOpacity={0.8}
                onPress={() => onDigit(d)}
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
            >
              <Text style={styles.utilKeyText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} activeOpacity={0.8} onPress={() => onDigit('0')}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.key, styles.utilKey]}
              activeOpacity={0.8}
              onPress={onBackspace}
            >
              <Text style={styles.utilKeyText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
        <OrderSheet {...ownerData} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    height: 55,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    paddingLeft: 16,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    width: '90%',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  searchIconWrap: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 16,
    color: '#0d101b',
  },
  listContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    paddingVertical: 12,
  },
  customerCard: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dueCard: {
    backgroundColor: '#fdecea',
    borderColor: 'rgba(229,57,53,0.24)',
  },

  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  customerRowDue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fdecea',
  },
  customerInfo: { flex: 1, backgroundColor: '#fff' },
  customerInfoDue: { flex: 1, backgroundColor: '#fdecea' },
  customerTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff' },
  metaRowDue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#fdecea',
  },
  metaLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardItemLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  cardItemBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#0d101b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  keypadWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 320,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  key: {
    flex: 1,
    height: 68,
    marginHorizontal: 6,
    borderRadius: 18,
    backgroundColor: '#a0c6ff',
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
