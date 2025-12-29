import Colors from '@/constants/Colors';
import { getItem } from '@/services/storage';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

/**
 * HeroHeader props
 */
type Props = {
  color?: string;
  height?: number;
  radius?: number;
  title?: string;
  titleColor?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  showProfile?: boolean;
  profileName?: string | null;
  profileSubtitle?: string;
  avatarSize?: number;
  avatarBg?: string;
  avatarTextColor?: string;
  showHomeIcon?: boolean;
};

export default function HeroHeader({
  color = '#b3a0ff',
  height = 110,
  radius = 28,
  title,
  titleColor = '#fff',
  titleStyle,
  containerStyle,
  showProfile,
  profileName,
  profileSubtitle,
  avatarSize = 48,
  avatarBg = '#fff',
  avatarTextColor = Colors.light.text,
  showHomeIcon = false,
}: Props) {
  const navigation = useNavigation<any>();
  const [storedName, setStoredName] = useState<string | null>(null);
  const [storedCardNumber, setStoredCardNumber] = useState<string | null>(null);
  const [storedEntityType, setStoredEntityType] = useState<string | null>(null);

  useEffect(() => {
    getItem('name').then(setStoredName);
    getItem('cardNumber').then(setStoredCardNumber);
    getItem('entityType').then(setStoredEntityType);
  }, []);

  const name = title ? title : storedName;
  const displayName = name ? toTitleCase(name) : undefined;
  let subtitle = profileSubtitle;
  if (!subtitle && storedEntityType === 'customer' && storedCardNumber) {
    subtitle = storedCardNumber;
  }

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: color,
          height,
          borderBottomLeftRadius: radius,
          borderBottomRightRadius: radius,
        },
        containerStyle,
      ]}
    >
      {showProfile && !!displayName && (
        <View
          style={styles.profileRow}
          accessibilityRole="summary"
          accessibilityLabel="Profile header"
        >
          <AvatarInitials title={displayName} />
          <View style={styles.nameBlock}>
            <Text style={styles.nameText}>{displayName}</Text>
            {!!subtitle && (
              <Text
                style={styles.subtitleText}
              >{`Card #${String(subtitle).padStart(3, '0')}`}</Text>
            )}
          </View>
        </View>
      )}
      {!showProfile && !!displayName && (
        <View style={styles.titleRow}>
          <Text style={[styles.heroTitle, { color: titleColor, textAlign: 'center' }, titleStyle]}>
            {displayName}
          </Text>
          {showHomeIcon && (
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Go to Profile"
              hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
            >
              <Feather name="home" size={22} color={titleColor} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export function getInitials(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function toTitleCase(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Circular profile avatar displaying initials computed from a full name.
 */
export function AvatarInitials({ title }: { title: string }) {
  const safeTitle = typeof title === 'string' ? title : '';
  const initials = getInitials(safeTitle) || '?';
  return (
    <View
      style={styles.initialsCircle}
      accessibilityRole="image"
      accessibilityLabel={safeTitle ? `Avatar for ${safeTitle}` : 'Avatar'}
    >
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 30,
    overflow: 'hidden',
    zIndex: 1,
  },
  profileRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    top: 20,
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  nameBlock: { flex: 1 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitleText: { marginTop: 1, fontSize: 16, color: '#555' },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6E8EC',
  },
  initialsText: { fontSize: 18, fontWeight: '700', color: '#111' },
  titleRow: { width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  heroTitle: {
    top: 30,
    fontSize: 22,
    fontWeight: '800',
  },
  homeButton: {
    position: 'absolute',
    right: 16,
    top: 25,
    padding: 8,
  },
});
