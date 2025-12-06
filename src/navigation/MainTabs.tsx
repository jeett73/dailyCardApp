import CustomerScreen from '@/screens/CustomerScreen';
import MonthlyStatementScreen from '@/screens/MonthlyStatementScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import Feather from '@expo/vector-icons/Feather';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarStyle: {
          backgroundColor: '#0d101b',
          height: 60,
          borderRadius: 28,
          marginHorizontal: 20,
          marginBottom: Platform.OS === 'web' ? 20 : 10,
          paddingHorizontal: 20,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CustomerScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="home" size={size ?? 22} color={focused ? '#fff' : color} />
          ),
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Statements"
        component={MonthlyStatementScreen}
        options={{
          tabBarLabel: 'Statements',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="file-text" size={size ?? 22} color={focused ? '#fff' : color} />
          ),
          tabBarAccessibilityLabel: 'Monthly Statements',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="user" size={size ?? 22} color={focused ? '#fff' : color} />
          ),
          tabBarAccessibilityLabel: 'Customer Profile',
        }}
      />
    </Tab.Navigator>
  );
}
