import Colors from '@/constants/Colors';
import { subscribeToToasts, ToastItem } from '@/services/toastService';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InfoToaster() {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setQueue((prev) => [...prev, toast]);
    });
  }, []);

  const current = queue[0];

  useEffect(() => {
    if (!current) {
      return () => {};
    }
    anim.setValue(0);

    const show = Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    });

    const hide = Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    });

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    show.start(({ finished }) => {
      if (!finished) return;
      timeoutId = setTimeout(
        () => {
          hide.start(({ finished: hideFinished }) => {
            if (!hideFinished) return;
            setQueue((prev) => prev.slice(1));
          });
        },
        Math.max(400, current.durationMs),
      );
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      show.stop();
      hide.stop();
    };
  }, [anim, current]);

  const translateY = useMemo(() => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-12, 0],
    });
  }, [anim]);

  const theme = useMemo(() => {
    if (current?.type === 'success') {
      return {
        backgroundColor: 'rgb(209 250 229)',
        borderColor: 'rgb(167 243 208)',
        textColor: 'rgb(6 95 70)',
        iconBg: 'rgb(16 185 129)',
        iconName: 'check' as const,
      };
    }
    if (current?.type === 'error') {
      return {
        backgroundColor: 'rgb(254 226 226)',
        borderColor: 'rgb(254 202 202)',
        textColor: 'rgb(185 28 28)',
        iconBg: 'rgb(239 68 68)',
        iconName: 'alert-circle' as const,
      };
    }
    return {
      backgroundColor: 'rgb(255 237 213)',
      borderColor: 'rgb(254 215 170)',
      textColor: 'rgb(154 52 18)',
      iconBg: Colors.light.orange,
      iconName: 'info' as const,
    };
  }, [current?.type]);

  if (!current) return null;

  return (
    <View pointerEvents="none" style={[styles.root, { top: insets.top + 10 }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
            opacity: anim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
          <Feather name={theme.iconName} size={14} color="#fff" />
        </View>
        <Text style={[styles.text, { color: theme.textColor }]} numberOfLines={3}>
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
  },
});
