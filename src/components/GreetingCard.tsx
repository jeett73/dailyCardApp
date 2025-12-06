import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';

export type GreetingCardProps = {
  /** Shop display name to render in the greeting */
  shopName: string;
  /** Optional custom message shown under the greeting */
  message?: string;
};

/**
 * GreetingCard
 *
 * Displays a personalized welcome card for the customer, including the shop name
 * and an optional message. Typography scales responsively with screen width,
 * and colors adapt automatically for light and dark modes.
 */
export function GreetingCard({ shopName, message }: GreetingCardProps) {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const titleSize = Math.max(24, Math.min(32, width * 0.07));
  const subSize = Math.max(14, Math.min(16, width * 0.04));
  const cardBg = scheme === 'dark' ? Colors.light.orange : '#fff';
  const titleColor = scheme === 'dark' ? '#000' : Colors.light.text;
  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <Text style={[styles.title, { fontSize: titleSize, color: titleColor }]}>
        Welcome to {shopName}
      </Text>
      {message ? (
        <Text style={[styles.sub, { fontSize: subSize, color: titleColor }]}>{message}</Text>
      ) : null}
    </View>
  );
}

export default GreetingCard;

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  title: {
    fontWeight: '800',
    lineHeight: 32,
  },
  sub: {
    marginTop: 6,
    fontWeight: '600',
  },
});
