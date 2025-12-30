import { useProductList } from '@/component/ProductListComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import React, { useMemo } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductListScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, onToggle, onAddPress } = useProductList();

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
      return <Text style={styles.emptyText}>No products found</Text>;
    }
    const filteredItems = items.filter((it) => it.price > 0);
    if (filteredItems.length === 0) {
      return <Text style={styles.emptyText}>No products found</Text>;
    }
    return filteredItems.map((it) => {
      return (
        <View
          key={it.id}
          style={styles.productCard}
          accessibilityLabel={`${it.name} • ${it.priceDisplay}`}
        >
          <View style={styles.productRow}>
            <Image
              source={{ uri: apiEndpoint.uploads(it.icon) }}
              style={styles.productThumb}
              resizeMode="cover"
            />

            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{it.name}</Text>
              <Text style={styles.productPrice}>{it.priceDisplay}</Text>
            </View>
          </View>
        </View>
      );
    });
  }, [items, loading, error, onToggle]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Products" />
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingTop: insets.top + 90 },
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {content}
      </ScrollView>
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 24) + 12 }, { right: 16 }]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add Product"
        onPress={onAddPress}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
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
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  productThumb: { width: 56, height: 56, borderRadius: 12 },
  productInfo: { flex: 1, backgroundColor: '#fff' },
  productTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  productPrice: { marginTop: 4, fontSize: 14, color: '#555' },
  productSwitch: {},
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 28 },
});
