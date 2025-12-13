import { useCreateCustomer } from '@/component/CreateCustomerComponent';
import HeroHeader from '@/components/HeroHeader';
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

export default function CreateCustomerScreen() {
  const insets = useSafeAreaInsets();
  const { form, setField, loading, handleSave, scrollRef, keyboardPadding, getHandlers } =
    useCreateCustomer();

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Create Customer" />
      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: insets.top + 90 },
            { paddingBottom: Math.max(insets.bottom, 24) + keyboardPadding },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(t) => setField('name', t)}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => setField('phone', t)}
              {...getHandlers('phone')}
            />

            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="CARD-000123"
              autoCapitalize="characters"
              value={form.cardNumber}
              onChangeText={(t) => setField('cardNumber', t)}
              {...getHandlers('cardNumber')}
            />

            <Text style={styles.label}>Deposit Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              keyboardType="decimal-pad"
              value={form.depositeAmount}
              onChangeText={(t) => setField('depositeAmount', t)}
              {...getHandlers('depositeAmount')}
            />

            <Text style={styles.label}>Street 1</Text>
            <TextInput
              style={styles.input}
              placeholder="12 Baker Street"
              value={form.street1}
              onChangeText={(t) => setField('street1', t)}
            />

            <Text style={styles.label}>Street 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Apt 4B"
              value={form.street2}
              onChangeText={(t) => setField('street2', t)}
            />

            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Ahmedabad"
              value={form.city}
              onChangeText={(t) => setField('city', t)}
            />

            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Gujarat"
              value={form.state}
              onChangeText={(t) => setField('state', t)}
            />

            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="380015"
              keyboardType="number-pad"
              value={form.postalCode}
              onChangeText={(t) => setField('postalCode', t)}
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving…' : 'Save Customer'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardSpacer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  card: {
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
  label: { marginTop: 12, fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  input: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
  },
  saveButton: {
    marginTop: 16,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  keyboardSpacer: { height: 0 },
});
