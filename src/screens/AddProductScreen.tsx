import { useAddProduct } from '@/component/AddProductComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, toggle, setPriceText, saveAll, saving } = useAddProduct();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      );
    }
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    if (!items || items.length === 0) {
      return <Text style={styles.emptyText}>No products available</Text>;
    }
    return items.map((it) => {
      return (
        <View
          key={it.id}
          style={[styles.productCard, it.selected && styles.productCardSelected]}
          accessibilityLabel={`${it.name}`}
        >
          <View style={[styles.productRow, it.selected && styles.productRowSelected]}>
            <Image
              source={require('../../assets/images/bg.png')}
              style={styles.productThumb}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle, it.selected && styles.productRowSelected}>{it.name}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkbox, it.selected && styles.checkboxChecked]}
              activeOpacity={0.85}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                toggle(it.id);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: it.selected }}
            >
              {it.selected && <Feather name="check" size={14} color="#fff" />}
            </TouchableOpacity>
          </View>
          {it.selected && (
            <View style={styles.expanded}>
              <Text style={styles.expandedLabel}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                keyboardType="decimal-pad"
                autoFocus
                value={it.priceText}
                onChangeText={(t) => setPriceText(it.id, t)}
              />
            </View>
          )}
        </View>
      );
    });
  }, [items, loading, error, toggle, setPriceText]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Select Product" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            { paddingTop: insets.top + 90 },
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            { bottom: Math.max(insets.bottom, 24), position: 'absolute', left: 16, right: 16 },
          ]}
          activeOpacity={0.9}
          onPress={saveAll}
          disabled={saving || !items.some((i) => i.selected)}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  contentContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  productCard: {
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
  productCardSelected: { borderColor: Colors.light.tint, backgroundColor: '#f6fbff' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  productRowSelected: { backgroundColor: '#f6fbff' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(13,16,27,0.25)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  productThumb: { width: 56, height: 56, borderRadius: 12 },
  productInfo: { flex: 1, backgroundColor: '#fff' },
  productTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  expanded: { marginTop: 12 },
  expandedLabel: { fontSize: 13, color: '#444', marginBottom: 6 },
  input: {
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
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
});
