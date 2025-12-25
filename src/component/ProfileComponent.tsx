import { postRequest } from '@/api/apiMethods';
import apiEndpoint from '@/constants/apiEndpoint';
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

  useEffect(() => {
    (async () => {
      const t = await getItem('entityType');
      setEntityType(t);
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
        await postRequest(apiEndpoint.auth.logoutUser(userId), {});
      }
    } catch (e) {
      // noop: proceed to clear storage and navigate regardless
    } finally {
      await clear();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }

  function handleCall() {
    Linking.openURL('tel:7600924242').catch(() => {
      Alert.alert('Call failed', 'Unable to initiate call');
    });
  }

  const baseMenuItems = [
    { label: 'Past Statements', onPress: gotoStatements },
    { label: 'Customers', onPress: gotoCustomers },
    { label: 'Products', onPress: gotoProducts },
    { label: 'Logout', onPress: handleLogout },
  ] as const;
  const menuItems = useMemo(() => {
    if (entityType === 'shop') {
      return baseMenuItems.filter((item) => item.label !== 'Past Statements');
    }
    if (entityType === 'customer') {
      return baseMenuItems.filter(
        (item) => item.label !== 'Products' && item.label !== 'Customers',
      );
    }
    return baseMenuItems;
  }, [entityType, baseMenuItems]);

  return { insets, width, avatarSize, menuItems, handleCall, entityType };
}
