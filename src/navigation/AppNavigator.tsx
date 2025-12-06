import MainTabs from '@/navigation/MainTabs';
import MonthWiseReportScreen from '@/screens/MonthWiseReportScreen';
import CustomerScreen from '@/screens/CustomerScreen';
import LoginScreen from '@/screens/LoginScreen';
import ModalScreen from '@/screens/ModalScreen';
import MpinScreen from '@/screens/MpinScreen';
import OtpScreen from '@/screens/OtpScreen';
import OwnerScreen from '@/screens/OwnerScreen';
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
      <Stack.Screen name="Customer" component={CustomerScreen} />
      <Stack.Screen name="Owner" component={OwnerScreen} />
      <Stack.Screen name="Modal" component={ModalScreen} />
    </Stack.Navigator>
  );
}
