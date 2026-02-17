import { initAuthFromStorage } from '@/api/http';
import InfoToaster from '@/components/InfoToaster';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppNavigator from '@/navigation/AppNavigator';
import { navigationRef } from '@/services/NavigationService';
import { installGlobalErrorHandler } from '@/services/globalErrorHandler';
import {
  handleNotificationOpenedApp,
  setupBackgroundHandler,
  setupForegroundHandler,
} from '@/services/notificationService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const GestureHandlerRootView = require('react-native-gesture-handler')
  .GestureHandlerRootView as any;

// Set up background handler outside of component
setupBackgroundHandler();

function App() {
  SplashScreen.preventAutoHideAsync();
  const [loaded, error] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    initAuthFromStorage();
    handleNotificationOpenedApp();
    const unsubscribe = setupForegroundHandler();
    return unsubscribe;
  }, []);

  useEffect(() => {
    installGlobalErrorHandler();
  }, []);

  const colorScheme = useColorScheme();

  if (!loaded) {
    return null;
  }

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer
            theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
            ref={navigationRef}
          >
            <>
              <AppNavigator />
              <InfoToaster />
            </>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}

registerRootComponent(App);

export default App;
