import MainTabs from '@/navigation/MainTabs';
import AddProductScreen from '@/screens/AddProductScreen';
import CreateCustomerScreen from '@/screens/CreateCustomerScreen';
import CustomerListScreen from '@/screens/CustomerListScreen';
import CustomerScreen from '@/screens/CustomerScreen';
import LoginScreen from '@/screens/LoginScreen';
import ModalScreen from '@/screens/ModalScreen';
import MonthWiseReportScreen from '@/screens/MonthWiseReportScreen';
import MpinScreen from '@/screens/MpinScreen';
import OtpScreen from '@/screens/OtpScreen';
import OwnerScreen from '@/screens/OwnerScreen';
import ProductListScreen from '@/screens/ProductListScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import RecentOrderScreen from '@/screens/RecentOrderScreen';
import SetMpinScreen from '@/screens/SetMpinScreen';
import { getItem } from '@/services/storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Mpin' | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getItem('token');
      setInitialRoute(token ? 'Mpin' : 'Login');
    })();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Mpin" component={MpinScreen} />
      <Stack.Screen name="SetMpin" component={SetMpinScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="MonthWiseReport" component={MonthWiseReportScreen} />
      <Stack.Screen
        name="Customer"
        component={CustomerScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="CustomerList" component={CustomerListScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="RecentOrder" component={RecentOrderScreen} />
      <Stack.Screen name="CreateCustomer" component={CreateCustomerScreen} />
      <Stack.Screen name="Owner" component={OwnerScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Modal" component={ModalScreen} />
    </Stack.Navigator>
  );
}
