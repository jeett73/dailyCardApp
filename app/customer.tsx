import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerDashboard() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const dateText = today.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const [active, setActive] = useState<'home' | 'icons' | 'profile'>('home');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <Image
          source={require('../ChatGPT Image Nov 29, 2025, 10_16_18 PM.png')}
          style={styles.avatar}
        />

        <View style={styles.headerCenter}>
          <Text style={styles.customerName}>Jeet Patel</Text>
          <Text style={styles.date}>{dateText}</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amul Gold 2</Text>
        <Text style={styles.cardTitle}>Shaktii 1</Text>
        <Text style={styles.cardTitle}>Butter Milk 5</Text>
        <Text style={styles.cardTitle}>Cow 9</Text>
      </View>

      <View style={[styles.bottomNavWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActive('home')}
          >
            <View style={[styles.activeBubble, active !== 'home' && styles.inactiveBubble]}>
              <FontAwesome name="home" size={25} color={active === 'home' ? '#0d101b' : '#fff'} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActive('icons')}
          >
            <FontAwesome name="th-large" size={25} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActive('profile')}
          >
            <FontAwesome name="user" size={25} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: 'cover',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRightSpacer: {
    width: 56,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  date: {
    marginTop: 2,
    fontSize: 12,
    color: '#555',
  },
  card: {
    marginTop: 35,
    marginHorizontal: 16,
    borderRadius: 17,
    padding: 16,
    backgroundColor: '#b3a0ff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 180,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#e8d9f2',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#f3e8ff',
  },
  bottomNavWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 35,
    paddingTop: 8,
    paddingBottom: 25,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d101b',
    height: 60,
    borderRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  activeBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBubble: {
    backgroundColor: 'transparent',
    width: 40,
    height: 40,
  },
});
