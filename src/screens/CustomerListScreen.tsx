import { useCustomerList } from '@/component/CustomerListComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerListScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, onAddPress } = useCustomerList();

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
      return <Text style={styles.emptyText}>No customers found</Text>;
    }
    return items.map((it) => {
      return (
        <TouchableOpacity
          key={it.id}
          style={styles.customerCard}
          activeOpacity={0.85}
          accessibilityLabel={`${it.name || 'Unknown'} • Card ${it.card} • Mobile ${it.mobile}`}
        >
          <View style={styles.customerRow}>
            <AvatarInitials title={it.name || 'Unknown'} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>{it.name || 'Unknown'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Card</Text>
                <Text style={styles.metaValue}>{it.card}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{it.mobile}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last Due</Text>
                <Text style={styles.metaValue}>{it.dueDisplay}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  }, [items, loading, error]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Customers" />
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
        accessibilityLabel="Add Customer"
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
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  customerInfo: { flex: 1, backgroundColor: '#fff' },
  customerTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff' },
  metaLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
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
