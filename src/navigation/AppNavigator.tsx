import CustomerScreen from '@/screens/CustomerScreen';
import LoginScreen from '@/screens/LoginScreen';
import ModalScreen from '@/screens/ModalScreen';
import NewOptScreen from '@/screens/newOptScreen';
import OtpScreen from '@/screens/OtpScreen';
import OwnerScreen from '@/screens/OwnerScreen';
import SetMpinScreen from '@/screens/SetMpinScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="NewOtp" component={NewOptScreen} />
      {/* <Stack.Screen name="Mpin" component={MpinScreen} /> */}
      <Stack.Screen name="SetMpin" component={SetMpinScreen} />
      <Stack.Screen name="Customer" component={CustomerScreen} />
      <Stack.Screen name="Owner" component={OwnerScreen} />
      <Stack.Screen name="Modal" component={ModalScreen} />
    </Stack.Navigator>
  );
}
