import { useOrder } from '@/component/OrderComponent';
import OrderSheet from '@/component/OrderSheet';
import { useRecentOrder } from '@/component/RecentOrderComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecentOrderScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const { items, loading, loadingMore, refreshing, error, refresh, loadMore, hasMore } =
    useRecentOrder(query);

  // Initialize order logic
  const orderLogic = useOrder();
  const { openSheet, editMode, save } = orderLogic;

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      function handleEdit() {
        // Construct a customer object for display
        // Open sheet in edit mode
        openSheet({ ...item.raw.customer, name: item.name }, item.raw);
      }

      return (
        <View
          style={styles.customerCard}
          accessibilityLabel={`${item.name} • Order Amount ${item.amountDisplay}`}
        >
          <View style={styles.customerRow}>
            <AvatarInitials title={item.name} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>
                <Text style={{ fontStyle: 'italic' }}>{item.card}</Text>{' '}
                {item.name || 'Hiren Dabhi'}
              </Text>
              {/* <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{item.dateDisplay.toUpperCase()}</Text>
              </View> */}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{item.mobile}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={handleEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Edit order"
                >
                  <Feather name="edit-3" size={18} color="#0d101b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [openSheet],
  );

  const ListEmptyComponent = React.useCallback(() => {
    if (loading && !refreshing) {
      return (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      );
    }
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    if (!loading && items.length === 0) {
      return <Text style={styles.emptyText}>No recent orders found</Text>;
    }
    return null;
  }, [loading, refreshing, error, items.length]);

  const ListFooterComponent = React.useCallback(() => {
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.light.tint} />
        </View>
      );
    }
    return <View style={{ height: insets.bottom + 16 }} />;
  }, [loadingMore, insets.bottom]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Recent Orders" />
      <View style={{ paddingTop: Platform.OS === 'ios' ? 130 : insets.top + 90, flex: 1 }}>
        <View style={styles.searchBar}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
          />
          <View style={styles.searchIconWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          onRefresh={refresh}
          refreshing={refreshing}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
        />
      </View>
      <OrderSheet
        {...orderLogic}
        saveLabel={editMode ? 'Update Order' : 'Order'}
        save={() => save(refresh)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  customerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  customerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0d101b',
    marginBottom: 6,
    letterSpacing: -0.3,
    paddingRight: 40, // Avoid overlap with edit button
    backgroundColor: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  metaLabel: {
    fontSize: 13,
    color: '#888',
    width: 60,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsContainer: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  productDetails: {
    fontSize: 13,
    color: '#666',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    paddingLeft: 16,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
});
