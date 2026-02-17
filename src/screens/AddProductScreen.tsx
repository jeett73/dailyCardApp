import { useAddProduct } from '@/component/AddProductComponent';
import apiEndpoint from '@/constants/apiEndpoint';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddProductScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const {
    items,
    loading,
    error,
    toggle,
    setPriceText,
    saveAll,
    saving,
    setOrderIds,
    // UI Props from Hook
    listRef,
    keyboardPadding,
    dragging,
    isTablet,
    contentWidth,
    headerHeight,
    fadeAnim,
    slideAnim,
    // Handlers
    handleLayoutList,
    handleScroll,
    handleDragBegin,
    handleDragEnd,
    handleInputFocus,
    handleInputLayout,
    handleCardLayout,
    setInputRef,
  } = useAddProduct();

  const headerTitleSize = isTablet ? 32 : 24;
  const footerBottomPadding = Math.max(insets.bottom, 16);

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeColors.brandPurple} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Feather name="alert-circle" size={32} color={themeColors.destructive} />
          <Text style={[styles.errorText, { color: themeColors.destructive, marginTop: 8 }]}>{error}</Text>
        </View>
      );
    }
    if (!items || items.length === 0) {
      return (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Feather name="box" size={40} color={themeColors.textSecondary} />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No products available</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.flex} onLayout={handleLayoutList}>

          {/* Header Content (Static for correct zIndex over list) */}
          <Animated.View style={{
            position: 'absolute',
            top: insets.top + (isTablet ? 30 : 20),
            width: contentWidth,
            alignSelf: 'center',
            zIndex: 20, // Increase zIndex
            paddingHorizontal: 24,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>
            <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Select Product</Text>
          </Animated.View>

          {loading || error || items.length === 0 ? (
            <View style={{ marginTop: headerHeight }}>
              {renderContent()}
            </View>
          ) : (
            <DraggableFlatList
              ref={listRef}
              data={items}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item) => item.id}
              containerStyle={styles.flex}
              scrollEnabled={!dragging}
              contentContainerStyle={[
                styles.listContent,
                { paddingTop: headerHeight - 20, paddingBottom: 100 + keyboardPadding }
              ]}
              keyboardShouldPersistTaps="always"
              onDragBegin={handleDragBegin}
              onDragEnd={handleDragEnd}
              renderItem={({ item, drag, isActive }: RenderItemParams<any>) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    style={[
                      styles.productCard,
                      {
                        width: isTablet ? '48%' : '100%',
                        backgroundColor: themeColors.cardBackground,
                        borderColor: item.selected ? themeColors.brandPurple : themeColors.border,
                        shadowColor: themeColors.shadow
                      },
                      isActive && { opacity: 0.9, transform: [{ scale: 1.02 }] }
                    ]}
                    onLongPress={drag}
                    delayLongPress={200}
                    activeOpacity={0.9}
                    onLayout={(e) => handleCardLayout(item.id, e)}
                  >
                    <View style={styles.productRow}>
                      <Image
                        source={{ uri: apiEndpoint.uploads(item.icon) }}
                        style={[styles.productThumb, { backgroundColor: themeColors.iconBackground }]}
                        resizeMode="cover"
                      />

                      <View style={styles.productInfo}>
                        <Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>

                        {item.selected && (
                          <Animated.View style={styles.inputWrapper}>
                            <Text style={[styles.currencyPrefix, { color: themeColors.textSecondary }]}>₹</Text>
                            <TextInput
                              ref={(r) => setInputRef(item.id, r)}
                              style={[styles.priceInput, { color: themeColors.text }]}
                              placeholder="0"
                              placeholderTextColor={themeColors.textSecondary}
                              keyboardType="decimal-pad"
                              value={item.priceText}
                              onChangeText={(t) => setPriceText(item.id, t)}
                              onLayout={(e) => handleInputLayout(item.id, e)}
                              onFocus={() => handleInputFocus(item.id)}
                            />
                          </Animated.View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          item.selected
                            ? { backgroundColor: themeColors.brandPurple, borderColor: themeColors.brandPurple }
                            : { backgroundColor: 'transparent', borderColor: themeColors.textSecondary }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => toggle(item.id)}
                      >
                        {item.selected && <Feather name="check" size={14} color="#fff" />}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />
          )}

          {/* Footer */}
          <View style={[
            styles.footer,
            {
              paddingBottom: footerBottomPadding,
              bottom: keyboardPadding,
              backgroundColor: themeColors.background,
              borderTopColor: themeColors.border,
              zIndex: 30 // Ensure footer is above everything
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: themeColors.brandPurple },
                saving && { opacity: 0.7 }
              ]}
              activeOpacity={0.8}
              onPress={saveAll}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Products</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>

      {/* Curved Header Background (Moved AFTER content for zIndex) */}
      <View style={[styles.headerBg, {
        height: headerHeight,
        backgroundColor: themeColors.brandPurple,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        zIndex: 10, // Ensure it's above list but below specific overlays if any
      }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    marginTop: 30,
  },
  productCard: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignSelf: 'center', // for grid logic if needed
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  priceInput: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 80,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  saveButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});
