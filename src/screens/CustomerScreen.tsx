import { useMonthlyStatement } from '@/component/MonthlyStatementComponent';
import GreetingCard from '@/components/GreetingCard';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<'home' | 'statements' | 'profile'>('home');
  const cardNo = '#007';

  const { groupedByDay, loading, refetch } = useMonthlyStatement();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const todayData = useMemo(() => {
    const today = new Date().getDate();
    return groupedByDay[today] ?? { orders: [], total: 0 };
  }, [groupedByDay]);

  const totalText = `Total ₹${todayData.total}`;

  return (
    <View style={styles.screen}>
      <HeroHeader color={Colors.light.brandPurple} showProfile={true} avatarSize={55} />
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'ios' ? 120 : insets.top + 90,
          },
        ]}
      >
        <GreetingCard
          shopName="Patel Dairy and Sweet Store"
          message="We are delighted to serve your daily dairy needs."
        />

        <View style={styles.statementCard}>
          <Text style={styles.statementTitle}>Today's Dairy Order</Text>
          <View style={styles.statementDivider} />
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : todayData.orders.length > 0 ? (
            <>
              {todayData.orders.map((it) => (
                <View key={it.id} style={styles.statementRow}>
                  <Text style={styles.itemName}>{it.item}</Text>
                  <Text style={styles.itemQty}>{it.qty}</Text>
                </View>
              ))}
              <View style={[styles.statementRow, { marginTop: 8 }]}>
                <Text style={styles.itemName}>{totalText}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.itemName}>No orders for today</Text>
          )}
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
