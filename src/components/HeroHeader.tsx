import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type Props = {
  color?: string;
  height?: number;
  radius?: number;
  title?: string;
  titleColor?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
};

export default function HeroHeader({
  color = '#b3a0ff',
  height = 120,
  radius = 28,
  title,
  titleColor = '#fff',
  titleStyle,
  containerStyle,
}: Props) {
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
      {!!title && (
        <Text style={[styles.heroTitle, { color: titleColor }, titleStyle]}>{title}</Text>
      )}
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
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  heroTitle: {
    top: 30,
    fontSize: 23,
    fontWeight: '800',
  },
});
