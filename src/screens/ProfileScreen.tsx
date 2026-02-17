import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useProfile } from '@/component/ProfileComponent';

interface MenuOptionProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  isLast?: boolean;
  loading?: boolean;
  destructive?: boolean;
  themeColors: typeof Colors.light;
}

const MenuOption = ({ label, icon, onPress, isLast, loading, destructive, themeColors }: MenuOptionProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          borderBottomWidth: !isLast ? 1 : 0,
          borderBottomColor: themeColors.border,
        },
        pressed && {
          opacity: 0.7,
          backgroundColor: themeColors.menuPressed,
          marginHorizontal: -20,
          paddingHorizontal: 20,
        },
      ]}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: themeColors.iconBackground }]}>
        <Feather
          name={icon}
          size={20}
          color={destructive ? themeColors.destructive : themeColors.brandPurple}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color: themeColors.text }, destructive && { color: themeColors.destructive }]}>
          {label}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={destructive ? themeColors.destructive : themeColors.brandPurple} />
      ) : (
        <Feather name="chevron-right" size={20} color={themeColors.textSecondary} />
      )}
    </Pressable>
  );
};

const SummaryRow = ({
  label,
  value,
  icon,
  isLast,
  onPress,
  themeColors
}: {
  label: string,
  value: string,
  icon: keyof typeof Feather.glyphMap,
  isLast?: boolean,
  onPress?: () => void,
  themeColors: typeof Colors.light
}) => (
  <View style={[
    {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: !isLast ? 1 : 0,
      borderBottomColor: themeColors.border,
    }
  ]}>
    <View style={[styles.summaryIcon, { backgroundColor: themeColors.iconBackground }]}>
      <Feather name={icon} size={16} color={themeColors.brandPurple} />
    </View>
    <View style={styles.summaryContent}>
      <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.summaryValue, { color: themeColors.brandPurple, textDecorationLine: 'underline' }]}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.summaryValue, { color: themeColors.text }]}>{value}</Text>
      )}
    </View>
  </View>
);

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const contentWidth = isTablet ? 600 : '100%';

  const {
    insets,
    entityType,
    customerDetails,
    shopDetails,
    logoutLoading,
    menuItems,
    handleLogout,
    handleCall,
  } = useProfile();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header Section */}
      <View style={[styles.header, {
        paddingTop: insets.top + (isTablet ? 40 : 20),
        paddingBottom: isTablet ? 40 : 25,
        backgroundColor: themeColors.brandPurple,
        shadowColor: themeColors.brandPurple
      }]}>
        <View style={styles.headerContent}>
          {entityType === 'shop' && shopDetails?.name && (
            <Text style={[styles.shopName, isTablet && { fontSize: 32 }]} numberOfLines={1}>{shopDetails.name}</Text>
          )}
          {entityType === 'customer' && customerDetails?.cardNumber && (
            <Text style={[styles.shopName, isTablet && { fontSize: 32 }]}>{customerDetails.cardNumber}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 20,
            alignItems: 'center'
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentWidth, alignSelf: 'center' }}>
          {/* Info Card */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {entityType === 'shop' ? 'Shop Details' : 'My Details'}
            </Text>

            {entityType === 'shop' && shopDetails && (
              <>
                <SummaryRow label="Owner Name" value={shopDetails.ownerName || 'Not Set'} icon="user" themeColors={themeColors} />
                <SummaryRow label="Mobile Number" value={shopDetails.phone || 'Not Set'} icon="phone" onPress={handleCall} isLast themeColors={themeColors} />
              </>
            )}

            {entityType === 'customer' && customerDetails && (
              <>
                <SummaryRow label="Deposit Amount" value={`₹${customerDetails.depositeAmount}`} icon="credit-card" themeColors={themeColors} />
                <SummaryRow label="Mobile Number" value={customerDetails.phone || 'Not Set'} icon="phone" onPress={handleCall} isLast themeColors={themeColors} />
              </>
            )}

            {(!shopDetails && !customerDetails) && (
              <ActivityIndicator color={themeColors.brandPurple} />
            )}
          </View>

          {/* Menu Options */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Options</Text>
            <View style={[styles.card, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.shadow }]}>
              {menuItems.map((item, index) => (
                <MenuOption
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  onPress={item.onPress}
                  isLast={false}
                  themeColors={themeColors}
                />
              ))}
              <MenuOption
                label="Logout"
                icon="log-out"
                onPress={handleLogout}
                loading={logoutLoading}
                destructive
                isLast
                themeColors={themeColors}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>App Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 24,
    color: '#fff', // Keep white on purple background
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666', // This might need to be dynamic if background is dark, but usually headers are fine or separate style.
    // Actually, sectionHeader is outside card, on background. 
    // Let's make it inline dynamic style in render to be safe or use textSecondary.
    marginLeft: 12,
    textTransform: 'uppercase',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    color: '#C7C7CC',
    fontSize: 12,
  },
});
