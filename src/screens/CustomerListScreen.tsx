import { deleteRequest } from '@/api/apiMethods';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCustomerList } from '@/components/CustomerListComponent';
import HeroHeader, { AvatarInitials } from '@/components/HeroHeader';
import PaymentModal from '@/components/PaymentModal';
import { Text, View } from '@/components/Themed';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { getItem } from '@/services/storage';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const { items, loading, loadingMore, refreshing, error, refresh, loadMore, hasMore, onAddPress } =
    useCustomerList(query);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
    cardNumber: string;
    previousMonthDue: number;
  } | null>(null);
  const [dueOverrides, setDueOverrides] = useState<Record<string, number>>({});

  // Menu State
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Delete Modal State
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const handleDelete = async (customer: any) => {
    const hasDue = customer.previousMonthDue > 0;
    const hasDeposit = customer.deposit > 0;

    // Build message
    let message = '';
    if (hasDue || hasDeposit) {
      const issues = [];
      if (hasDue) issues.push(`₹${customer.previousMonthDue} due`);
      if (hasDeposit) issues.push(`₹${customer.deposit} deposit`);
      message = `This customer has ${issues.join(' and ')}. Are you sure you want to delete ${customer.name}?`;
    } else {
      message = `Are you sure you want to delete ${customer.name}?`;
    }

    setErrorModalTitle('Delete Customer');
    setErrorModalMessage(message);
    setCustomerToDelete(customer);
    setErrorModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const token = await getItem('token');
      await deleteRequest(apiEndpoint.customers.delete(customerToDelete.id), {
        headers: { authorization: `Bearer ${token}` },
      });
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCustomerToDelete(null);
    }
  };

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      const override = dueOverrides[item.id];
      const currentDue =
        typeof override === 'number' ? override : Number(item?.previousMonthDue ?? 0);

      const handleMenuPress = (event: any) => {
        const { pageX, pageY } = event.nativeEvent;
        const screenHeight = Dimensions.get('window').height;
        const menuHeight = 160; // Approximate menu height

        let top = pageY + 10;
        // If menu would go off screen bottom, show it above the touch point
        if (pageY + menuHeight > screenHeight - 20) {
          top = pageY - menuHeight;
        }

        setMenuPosition({ x: pageX - 130, y: top });
        setSelectedCustomer({ ...item, currentDue });
        setMenuVisible(true);
      };

      return (
        <TouchableOpacity
          style={[styles.customerCard, currentDue > 0 && styles.customerCardDue]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
          accessibilityLabel={`${item.name || 'Unknown'} • Card ${item.card} • Mobile ${item.mobile}`}
        >
          <View style={[styles.customerRow, currentDue > 0 && styles.DueBg]}>
            <AvatarInitials title={item.name || 'Unknown'} />
            <View style={currentDue > 0 ? styles.customerInfoDue : styles.customerInfo}>
              <Text style={styles.customerTitle}>
                <Text style={{ fontStyle: 'italic' }}>{item.card}</Text>{' '}
                {item.name?.length > 17 ? item.name.substring(0, 17) + '...' : item.name}
              </Text>
              <View style={currentDue > 0 ? styles.metaRowDue : styles.metaRow}>
                <Text style={styles.metaLabel}>Mobile</Text>
                <Text style={styles.metaValue}>{item.mobile}</Text>
              </View>
              <View style={currentDue > 0 ? styles.metaRowDue : styles.metaRow}>
                <Text style={styles.metaLabel}>Last Due</Text>
                <Text style={styles.metaValue}>{`₹${currentDue}`}</Text>
              </View>
              <View style={currentDue > 0 ? styles.actionsRowDue : styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.6}
                  onPress={handleMenuPress}
                  accessibilityRole="button"
                  accessibilityLabel="More options"
                >
                  <Feather name="more-vertical" size={20} color="#0d101b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [dueOverrides, navigation],
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
      return <Text style={styles.emptyText}>No customers found</Text>;
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
      <HeroHeader color={Colors.light.brandPurple} title="Customers" />
      <View style={{ paddingTop: Platform.OS === 'ios' ? 130 : insets.top + 90, flex: 1 }}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
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
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 24) + 12 }, { right: 16 }]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add Customer"
        onPress={onAddPress}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
      <PaymentModal
        visible={paymentOpen}
        customer={paymentCustomer}
        onClose={(paid) => {
          setPaymentOpen(false);
          if (paymentCustomer && typeof paid === 'number' && paid > 0) {
            const currentDue =
              typeof dueOverrides[paymentCustomer.id] === 'number'
                ? dueOverrides[paymentCustomer.id]
                : paymentCustomer.previousMonthDue;
            const next = Math.max(0, currentDue - paid);
            setDueOverrides((m) => ({ ...m, [paymentCustomer.id]: next }));
          }
          setPaymentCustomer(null);
        }}
      />

      {/* Action Menu Modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuContainer, { top: menuPosition.y, left: menuPosition.x }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('CreateCustomer', {
                    mode: 'edit',
                    initial: selectedCustomer,
                  });
                }}
              >
                <Feather name="edit-3" size={18} color="#333" />
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, selectedCustomer?.currentDue <= 0 && { opacity: 0.5 }]}
                disabled={selectedCustomer?.currentDue <= 0}
                onPress={() => {
                  setMenuVisible(false);
                  if (selectedCustomer) {
                    setPaymentCustomer({
                      id: selectedCustomer.id,
                      name: selectedCustomer.name,
                      phone: selectedCustomer.phone || selectedCustomer.mobile,
                      cardNumber: selectedCustomer.cardNumber || selectedCustomer.card,
                      previousMonthDue: Number(selectedCustomer.currentDue ?? 0),
                    });
                    setPaymentOpen(true);
                  }
                }}
              >
                <Text style={{ fontSize: 18, width: 18, textAlign: 'center', color: '#333' }}>₹</Text>
                <Text style={styles.menuItemText}>Pay Due</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 4 }} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  if (selectedCustomer) handleDelete(selectedCustomer);
                }}
              >
                <Feather name="trash-2" size={18} color="#ff3b30" />
                <Text style={[styles.menuItemText, { color: '#ff3b30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Warning/Error Modal */}
      <ConfirmationModal
        visible={errorModalVisible}
        title={errorModalTitle}
        message={errorModalMessage}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          setErrorModalVisible(false);
          // If customer is set, proceed with deletion
          if (customerToDelete) {
            confirmDelete();
          }
        }}
        onCancel={() => {
          setErrorModalVisible(false);
          setCustomerToDelete(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
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
  customerCardDue: {
    backgroundColor: '#fdecea',
    borderColor: 'rgba(229,57,53,0.24)',
  },
  DueBg: {
    backgroundColor: '#fdecea',
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
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
  metaLabelDue: { fontSize: 12, color: '#e53935', marginRight: 8 },
  metaValue: { fontSize: 12, color: Colors.light.text, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, paddingVertical: 12 },
  error: { fontSize: 14, color: '#e53935' },
  actionsRow: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },

  actionsRowDue: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fdecea',
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionIcon: { fontSize: 18, color: '#0d101b' },
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

  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
});
