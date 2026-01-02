import { useOrder } from '@/component/OrderComponent';
import { useRecentOrder } from '@/component/RecentOrderComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderScreen from './OrderScreen';

export default function RecentOrderScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { items, loading, error, refresh } = useRecentOrder();
  
  // Initialize order logic
  const orderLogic = useOrder();
  const { openSheet, editMode, save } = orderLogic;

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
      return <Text style={styles.emptyText}>No recent orders found</Text>;
    }

    return items.map((it) => {
      function handleEdit() {
        // Construct a customer object for display
        const customer = {
            name: it.name,
            // Add other fields if necessary for OrderScreen display or logic
        };
        // Open sheet in edit mode
        openSheet(customer, it.raw);
      }

      return (
        <View
          key={it.id}
          style={styles.customerCard}
          accessibilityLabel={`${it.name} • Order Amount ${it.amountDisplay}`}
        >
          <View style={styles.customerRow}>
            <AvatarInitials title={it.name} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerTitle}>{it.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Card</Text>
                <Text style={styles.metaValue}>{it.card}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{it.mobile}</Text>
              </View>
               <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{it.dateDisplay}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Amount</Text>
                <Text style={styles.metaValue}>{it.amountDisplay}</Text>
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
    });
  }, [items, loading, error, openSheet]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title="Recent Orders" />
      <View style={{ paddingTop: insets.top + 90, flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {content}
        </ScrollView>
      </View>

      <OrderScreen
        {...orderLogic}
        saveLabel={editMode ? 'Update Order' : 'Order'}
        save={() => save(refresh)} // Pass refresh callback to update list after save
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
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
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  customerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0d101b',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
