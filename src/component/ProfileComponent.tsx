import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
import { getDeviceId } from '@/services/deviceService';
import { clear, getItem } from '@/services/storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useProfile() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();

  const avatarSize = width >= 768 ? 64 : 56;
  const [entityType, setEntityType] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<{
    phone: string;
    depositeAmount: string;
    cardNumber: string;
  } | null>(null);
  const [shopDetails, setShopDetails] = useState<{
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    shopId: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getItem('entityType');
      setEntityType(t);
      if (t === 'customer') {
        const phone = await getItem('phone');
        const depositeAmount = await getItem('depositeAmount');
        const cardNumber = await getItem('cardNumber');
        setCustomerDetails({
          phone: phone || '',
          depositeAmount: depositeAmount || '0',
          cardNumber: `#${String(cardNumber).padStart(3, '0')}` || '',
        });
      }
    })();
  }, []);

  function gotoStatements() {
    navigation.navigate('MonthWiseReport');
  }

  function gotoCustomers() {
    navigation.navigate('CustomerList');
  }

  function gotoProducts() {
    navigation.navigate('ProductList');
  }

  async function handleLogout() {
    try {
      const userId = await getItem('userId');
      if (userId) {
        const deviceId = await getDeviceId();
        await postRequest(apiEndpoint.auth.logoutUser(userId), { deviceId });
      }
    } catch (e) {
      // noop: proceed to clear storage and navigate regardless
    } finally {
      await clear();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }

  function handleCall() {
    const num = (entityType === 'shop' ? shopDetails?.phone : null) || '7600924242';
    Linking.openURL(`tel:${num}`).catch(() => {
      Alert.alert('Call failed', 'Unable to initiate call');
    });
  }

  function resetPassword() {
    navigation.navigate('ResetPassword');
  }

  const baseMenuItems = [
    { label: 'Past Statements', onPress: gotoStatements, isFor: 'customer' },
    { label: 'Recent Order', onPress: gotoRecentOrder, isFor: 'shop' },
    { label: 'Customers', onPress: gotoCustomers, isFor: 'shop' },
    { label: 'Products', onPress: gotoProducts, isFor: 'shop' },
    { label: 'Reset Password', onPress: resetPassword, isFor: 'shop' },
    { label: 'Logout', onPress: handleLogout, isFor: 'both' },
  ] as const;

  const menuItems = useMemo(() => {
    return baseMenuItems.filter((item) => item.isFor === 'both' || item.isFor === entityType);
  }, [entityType]);

  function gotoRecentOrder() {
    navigation.navigate('RecentOrder');
  }

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return {
    insets,
    width,
    avatarSize,
    menuItems,
    handleCall,
    entityType,
    shopDetails,
    customerDetails,
  };
}
