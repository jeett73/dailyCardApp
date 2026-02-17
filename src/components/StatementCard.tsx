import { Txn } from '@/components/CustomerDetailComponent';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { formatToKolkataTime } from '@/utils/dateUtils';
import React, { memo, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

type TimeGroup = { time: number; orders: Txn[] };

export const StatementCard = memo(function StatementCard({
    dayLabel,
    orders,
    total,
    scale = 1,
    style,
}: {
    dayLabel: string;
    orders: Txn[];
    total: number;
    scale?: number;
    style?: ViewStyle;
}) {


    const hasOrders = orders && orders.length > 0;

    function formatTime(timestamp: number) {
        if (!timestamp) return '';
        return formatToKolkataTime(timestamp);
    }

    // Group orders by time locally
    const timeGroups = useMemo(() => {
        if (!orders) return [];
        const groups: TimeGroup[] = [];
        orders.forEach((ord) => {
            let group = groups.find((g) => g.time === ord.time);
            if (!group) {
                group = { time: ord.time, orders: [] };
                groups.push(group);
            }
            group.orders.push(ord);
        });
        // Sort by time descending
        groups.sort((a, b) => a.time - b.time);
        return groups;
    }, [orders]);

    return (
        <View style={[styles.statementCard, style]} accessibilityRole="summary">
            <Text style={[styles.statementTitle, { fontSize: Math.round(20 * scale) }]}>{dayLabel}</Text>
            <View style={styles.statementDivider} />
            {hasOrders ? (
                <>
                    {timeGroups.map((group, groupIdx) => (
                        <View
                            key={`group-${groupIdx}`}
                            style={{ marginBottom: 12, backgroundColor: 'transparent' }}
                        >
                            <Text style={[styles.timeHeader, { fontSize: 16 * scale }]}>
                                [ {formatTime(group.time)} ]
                            </Text>
                            {group.orders.map((ord) => (
                                <View key={ord.id} style={styles.statementRow}>
                                    {ord.item === 'Others' ? (
                                        <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
                                            Others
                                        </Text>
                                    ) : (
                                        <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>
                                            {ord.item} ×{ord.qty}
                                        </Text>
                                    )}
                                    <Text style={[styles.itemQty, { fontSize: Math.round(18 * scale) }]}>
                                        ₹{ord.amount}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}

                    <View style={styles.statementDivider} />
                    <View style={styles.statementRow}>
                        <Text style={[styles.totalAmount, { fontSize: Math.round(18 * scale) }]}>Total</Text>
                        <Text style={[styles.totalAmount, { fontSize: Math.round(18 * scale) }]}>₹{total}</Text>
                    </View>
                </>
            ) : (
                <View style={styles.statementRow}>
                    <Text style={[styles.itemName, { fontSize: Math.round(18 * scale) }]}>No Orders</Text>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    statementCard: {
        marginTop: 12,
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 16,
        backgroundColor: Colors.light.orange,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        minHeight: 120,
    },
    statementTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
    statementDivider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 12,
        backgroundColor: 'rgba(0,0,0)',
    },
    statementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        backgroundColor: 'transparent',
    },
    timeHeader: { fontSize: 16, color: '#000', fontWeight: '800', marginBottom: 4, marginTop: 8 },
    itemName: { fontSize: 18, color: '#000', fontWeight: '300' },
    itemQty: { fontSize: 18, color: '#000', fontWeight: '300' },
    totalAmount: { fontSize: 18, color: '#000', fontWeight: '800' },
});
