import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getDeviceId } from '@/services/deviceService';
import { clear, getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// Types
export interface CustomerDetails {
  phone: string;
  depositeAmount: string;
  cardNumber: string;
}

export interface ShopDetails {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  shopId: string;
}

export interface MenuOptionItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isFor: 'customer' | 'shop' | 'both';
}

export function useProfile() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();

  // State
  const [entityType, setEntityType] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Effects
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const type = await getItem('entityType');
      setEntityType(type);

      if (type === 'customer') {
        const [phone, depositeAmount, cardNumber] = await Promise.all([
          getItem('phone'),
          getItem('depositeAmount'),
          getItem('cardNumber')
        ]);
        setCustomerDetails({
          phone: phone || '',
          depositeAmount: depositeAmount || '0',
          cardNumber: cardNumber ? `#${String(cardNumber).padStart(3, '0')}` : '',
        });
      }

      // Always load shop details
      const [name, shopId, ownerName, phone, address] = await Promise.all([
        getItem('name'),
        getItem('shopId'),
        getItem('ownerName'),
        getItem('phone'),
        getItem('address'),
      ]);

      setShopDetails({
        name: String(name || ''),
        ownerName: String(ownerName || ''),
        phone: String(phone || ''),
        address: String(address || ''),
        shopId: String(shopId || ''),
      });

    } catch (error) {
      console.error('Failed to load profile data', error);
    }
  };

  // Actions
  function gotoStatements() {
    navigation.navigate('MonthWiseReport');
  }

  function gotoCustomers() {
    navigation.navigate('CustomerList');
  }

  function gotoProducts() {
    navigation.navigate('ProductList');
  }

  function gotoRecentOrder() {
    navigation.navigate('RecentOrder');
  }

  function resetPassword() {
    navigation.navigate('ResetPassword');
  }

  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              const userId = await getItem('userId');
              if (userId) {
                const deviceId = await getDeviceId();
                await postRequest(apiEndpoint.auth.logoutUser(userId), { deviceId });
              }
            } catch (e) {
              console.log('Logout error', e);
            } finally {
              await clear();
              setLogoutLoading(false);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          }
        }
      ]
    );
  }

  function handleCall() {
    const num = (entityType === 'shop' ? shopDetails?.phone : customerDetails?.phone) || '7600924242';
    Linking.openURL(`tel:${num}`).catch(() => {
      Alert.alert('Call failed', 'Unable to initiate call');
    });
  }

  // Menu Configuration
  const menuItems = useMemo(() => {
    const baseItems: MenuOptionItem[] = [
      { label: 'Past Statements', onPress: gotoStatements, isFor: 'customer', icon: 'file-text' },
      { label: 'Recent Order', onPress: gotoRecentOrder, isFor: 'shop', icon: 'clock' },
      { label: 'Customers', onPress: gotoCustomers, isFor: 'shop', icon: 'users' },
      { label: 'Products', onPress: gotoProducts, isFor: 'shop', icon: 'shopping-bag' },
      { label: 'Reset Password', onPress: resetPassword, isFor: 'shop', icon: 'lock' },
    ];

    return baseItems.filter((item) => item.isFor === 'both' || item.isFor === entityType);
  }, [entityType]);

  return {
    insets,
    width,
    entityType,
    customerDetails,
    shopDetails,
    logoutLoading,
    menuItems,
    handleLogout,
    handleCall,
  };
}
