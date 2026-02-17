import { useMonthWiseReport } from '@/component/MonthWiseReportComponent';
import HeroHeader from '@/components/HeroHeader';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import React, { useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, Text as RNText, View as RNView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MonthWiseReportScreen() {
  const insets = useSafeAreaInsets();
  const { loading, error, months, navLoading, cardWidth, handleNavigate } = useMonthWiseReport();

  const content = useMemo(() => {
    if (loading) {
      return <Text style={styles.loading}>Loading...</Text>;
    }
    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }
    if (months.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>No past month statements found</Text>
        </View>
      );
    }
    return months.map((m) => (
      <Pressable
        onPress={() => handleNavigate(m)}
        key={`${m.year}-${m.month}`}
        style={({ pressed }) =>
          StyleSheet.flatten([
            styles.statementCard,
            { width: cardWidth },
            pressed && styles.cardPressed,
          ])
        }
        accessibilityRole="button"
        accessibilityLabel={`Open ${m.label}`}
        accessibilityHint="Shows monthly statement for selected month"
      >
        <RNView style={styles.headerRow}>
          <RNText style={styles.statementTitle}>{m.label}</RNText>
          <RNView
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  !m.receivedAmount || m.receivedAmount === 0
                    ? '#F44336' // UnPaid - Red
                    : m.total - m.receivedAmount === 0
                      ? '#4CAF50' // Paid - Green
                      : m.total - m.receivedAmount > 0
                        ? '#FFC107' // Partial - Amber
                        : '#4CAF50', // Overpaid - Green
              },
            ]}
          >
            <RNText style={styles.statusText}>
              {!m.receivedAmount || m.receivedAmount === 0
                ? 'UnPaid'
                : m.total - m.receivedAmount === 0
                  ? 'Paid'
                  : m.total - m.receivedAmount > 0
                    ? `Partial Paid ₹${m.receivedAmount}`
                    : 'Paid'}
            </RNText>
          </RNView>
        </RNView>
        <RNView style={styles.statementDivider} />
        <RNView style={styles.statementRow}>
          <RNText style={styles.itemName}>Total</RNText>
          <RNText style={styles.itemQty}>₹{m.total}</RNText>
        </RNView>
      </Pressable>
    ));
  }, [months, loading, error, cardWidth, handleNavigate]);

  return (
    <View style={[styles.container]}>
      <HeroHeader color={Colors.light.brandPurple} title={`Past Statements`} />
      <ScrollView
        contentContainerStyle={[
          styles.listContainer,
          { paddingTop: Platform.OS === 'ios' ? 110 : insets.top + 90 },
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.grid}>{content}</View>
        {navLoading && (
          <View style={styles.navOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.navOverlayText}>Navigating…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  listContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  grid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statementCard: {
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 120,
    backgroundColor: '#a69af7',
  },
  cardPressed: { opacity: 0.85 },
  statementTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statementDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#a69af7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 250,
    width: '100%',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  itemName: { fontSize: 18, color: '#fff', fontWeight: '600' },
  itemQty: { fontSize: 18, color: '#fff', fontWeight: '600' },
  loading: { fontSize: 14, color: Colors.light.text },
  error: { fontSize: 14, color: '#e53935' },
  navOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  navOverlayText: { marginTop: 8, fontSize: 14, color: Colors.light.text, fontWeight: '700' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
