import { useCreateCustomer } from '@/components/CreateCustomerComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateCustomerScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const {
    form,
    setField,
    loading,
    handleSave,
    scrollRef,
    keyboardPadding,
    getHandlers,
    setFormContainerOffsetY,
    products,
    productsLoading,
    productsError,
    selectedProducts,
    toggleProduct,
    setProductQty,
    isEdit,
    prefillLoading,
    prefillError,
    errors,
  } = useCreateCustomer(route?.params);

  const footerBottomPadding = Math.max(insets.bottom, 16);
  const footerHeight = 12 + 50 + footerBottomPadding;

  return (
    <View style={[styles.container]}>
      <HeroHeader
        color={Colors.light.brandPurple}
        title={isEdit ? 'Update Customer' : 'Create Customer'}
      />

      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          style={styles.flex}
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: Platform.OS === 'ios' ? 80 : insets.top + 90 },
            { paddingBottom: footerHeight + 24 + keyboardPadding },
          ]}
        >
          <View
            style={styles.card}
            onLayout={(e) => setFormContainerOffsetY(e?.nativeEvent?.layout?.y ?? 0)}
          >
            {prefillLoading ? (
              <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
              </View>
            ) : null}
            {prefillError ? <Text style={styles.error}>{prefillError}</Text> : null}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(t) => setField('name', t)}
              {...getHandlers('name')}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="9876543210"
              keyboardType="number-pad"
              maxLength={10}
              value={form.phone}
              onChangeText={(t) => setField('phone', t.replace(/[^0-9]/g, ''))}
              {...getHandlers('phone')}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={[styles.input, errors.cardNumber && styles.inputError]}
              placeholder="CARD-000123"
              autoCapitalize="characters"
              value={form.cardNumber}
              onChangeText={(t) => setField('cardNumber', t)}
              {...getHandlers('cardNumber')}
            />
            {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}

            <Text style={styles.label}>Deposit Amount</Text>
            <TextInput
              style={[
                styles.input,
                isEdit && styles.inputDisabled,
                errors.depositeAmount && styles.inputError,
              ]}
              placeholder="100"
              keyboardType="decimal-pad"
              value={form.depositeAmount}
              onChangeText={(t) => setField('depositeAmount', t)}
              {...getHandlers('depositeAmount')}
              editable={!isEdit}
            />
            {errors.depositeAmount && <Text style={styles.errorText}>{errors.depositeAmount}</Text>}

            <Text style={styles.label}>Street 1</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.street1 && styles.inputError]}
              placeholder="12 Baker Street"
              value={form.street1}
              onChangeText={(t) => setField('street1', t)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              {...getHandlers('street1')}
            />
            {errors.street1 && <Text style={styles.errorText}>{errors.street1}</Text>}

            {/* <Text style={styles.label}>Street 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Apt 4B"
              value={form.street2}
              onChangeText={(t) => setField('street2', t)}
            /> */}

            <Text style={styles.label}>City</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Ahmedabad"
              value={form.city}
              onChangeText={(t) => setField('city', t)}
              {...getHandlers('city')}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

            {/* <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Gujarat"
              value={form.state}
              onChangeText={(t) => setField('state', t)}
            /> */}

            {/* <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="380015"
              keyboardType="number-pad"
              value={form.postalCode}
              onChangeText={(t) => setField('postalCode', t)}
            /> */}

            <TouchableOpacity style={[styles.dropdownHeader]} activeOpacity={0.8}>
              <Text style={styles.label}>Regular Products</Text>
            </TouchableOpacity>

            <View style={styles.dropdownBody}>
              {productsLoading ? (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.light.tint} />
                </View>
              ) : productsError ? (
                <Text style={styles.error}>{productsError}</Text>
              ) : products.length === 0 ? (
                <Text style={styles.emptyText}>No products found</Text>
              ) : (
                products
                  ?.filter((p) => p.price)
                  .map((p) => {
                    const qty = selectedProducts[p.id] ?? 0;
                    const selected = qty > 0;
                    return (
                      <View key={p.id} style={styles.productRow}>
                        <TouchableOpacity
                          style={[styles.checkbox, selected && styles.checkboxChecked]}
                          onPress={() => toggleProduct(p.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.checkboxIcon}>{selected ? '✓' : ''}</Text>
                        </TouchableOpacity>
                        <Text style={styles.productName}>{p.name}</Text>
                        <TextInput
                          style={styles.qtyInput}
                          placeholder="Qty"
                          placeholderTextColor="#999"
                          keyboardType="number-pad"
                          value={qty ? String(qty) : ''}
                          onChangeText={(t) => setProductQty(p.id, t)}
                          onFocus={() => {
                            scrollRef.current?.scrollToEnd({ animated: true });
                            setTimeout(() => {
                              scrollRef.current?.scrollToEnd({ animated: true });
                            }, 250);
                          }}
                        />
                      </View>
                    );
                  })
              )}
            </View>
          </View>
        </ScrollView>
        <View
          style={[styles.footer, { paddingBottom: footerBottomPadding, bottom: keyboardPadding }]}
        >
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving…' : isEdit ? 'Update Customer' : 'Save Customer'}
            </Text>
          </TouchableOpacity>
        </View>
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
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: 'rgba(13,16,27,0.06)',
    color: '#9e9e9e',
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    fontSize: 12,
    color: '#e53935',
    marginTop: 4,
    marginLeft: 4,
  },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
  dropdownHeader: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownChevron: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  dropdownBody: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    padding: 8,
    backgroundColor: '#fff',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxIcon: {
    fontSize: 14,
    color: '#fff',
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  qtyInput: {
    width: 70,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  textArea: {
    height: 80,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
  },
  saveButton: {
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
