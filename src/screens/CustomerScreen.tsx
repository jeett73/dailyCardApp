import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
// import { LinearGradient } from 'expo-linear-gradient';
import GreetingCard from '@/components/GreetingCard';
import HeroHeader from '@/components/HeroHeader';
import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<'home' | 'statements' | 'profile'>('home');
  const cardNo = '#007';
  const items: { name: string; qty: number }[] = [
    { name: 'Amul Gold', qty: 2 },
    { name: 'Shaktii', qty: 1 },
    { name: 'Butter Milk', qty: 5 },
    { name: 'Cow 9', qty: 9 },
  ];
  const totalText = 'Total 100 Rs';

  return (
    <View style={styles.screen}>
      <HeroHeader
        color={Colors.light.brandPurple}
        showProfile={true}
        profileName="Hiren Dabhi"
        profileSubtitle="Card #007"
        avatarSize={55}
        title="Hiren Dabhi"
      />
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Image source={require('../../assets/images/bg.png')} style={styles.avatar} />

          <View style={styles.headerCenter}>
            <Text style={styles.customerName}>Jeet Patel</Text>
            <Text style={styles.balance}>{cardNo}</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        <GreetingCard
          shopName="Patel Dairy and Sweet Store"
          message="We are delighted to serve your daily dairy needs."
        />

        <View style={styles.statementCard}>
          <Text style={styles.statementTitle}>This Last Dairy Order</Text>
          <View style={styles.statementDivider} />
          {items.map((it) => (
            <View key={it.name} style={styles.statementRow}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemQty}>{it.qty}</Text>
            </View>
          ))}
          <View style={[styles.statementRow, { marginTop: 8 }]}>
            <Text style={styles.itemName}>{totalText}</Text>
          </View>
        </View>

        {/* Bottom navigation is now handled globally by MainTabs */}
      </View>
    </View>
  );
}

// GreetingCard component moved to src/components/GreetingCard.tsx

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    zIndex: 0,
    backgroundColor: Colors.light.brandPurple,
  },
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
  balance: {
    marginTop: 4,
    fontSize: 14,
    color: '#111',
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
  statementCard: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 180,
    backgroundColor: '#a69af7',
  },
  statementTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statementDivider: {
    height: 1,
    marginVertical: 12,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#a69af7',
  },
  itemName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
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
