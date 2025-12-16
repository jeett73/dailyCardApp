import { useProfile } from '@/component/ProfileComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

type MenuLabel = 'Past Statements' | 'Logout' | 'Customers' | 'Products';

type MenuOptionProps = {
  label: MenuLabel | string;
  onPress: () => void;
};

function MenuOption({ label, onPress }: MenuOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <Text style={styles.menuLabel}>{label}</Text>
      <Feather name="chevron-right" size={18} color={Colors.light.text} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { insets, handleCall, menuItems } = useProfile();

  return (
    <View style={[styles.container]}>
      <HeroHeader
        color={Colors.light.brandPurple}
        showProfile={true}
        profileName="Hiren Dabhi"
        profileSubtitle="Card #007"
        avatarSize={55}
        title="Hiren Dabhi"
      />
      <View style={[styles.container, { paddingTop: insets.top + 90 }]}>
        <View
          style={styles.summaryCard}
          accessibilityRole="summary"
          accessibilityLabel="Profile summary"
        >
          <Text style={styles.summaryTitle}>Profile Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Card Number</Text>
            <Text style={styles.summaryValue}>#15</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Deposit</Text>
            <Text style={styles.summaryValue}>₹5000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mobile Number</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Call mobile number"
              onPress={handleCall}
              style={({ pressed }) => [styles.callRow, pressed && styles.callRowPressed]}
            >
              <Text style={[styles.summaryValue, styles.infoLink]}>7600924242</Text>
            </Pressable>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Address</Text>
            <Text style={styles.summaryValue}>Gujarat</Text>
          </View>
        </View>

        <View style={styles.menuCard} accessibilityRole="menu">
          {menuItems.map((m) => (
            <MenuOption key={m.label} label={m.label} onPress={m.onPress} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

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
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.brandPurple,
  },

  avatar: { resizeMode: 'cover' },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.light.brandPurple,
  },

  customerName: { fontSize: 18, fontWeight: '800', color: Colors.light.text },

  balance: { marginTop: 4, fontSize: 14, color: '#111' },

  headerRightSpacer: { width: 56 },

  menuCard: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  menuItem: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  menuItemPressed: { backgroundColor: '#f2f4f7' },

  menuLabel: { fontSize: 16, color: Colors.light.text, fontWeight: '700' },

  summaryCard: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,16,27,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  callRow: { minHeight: 32, justifyContent: 'center' },
  callRowPressed: { opacity: 0.7 },
  infoLink: { color: Colors.light.tint },
});
