import { initAuthFromStorage } from '@/api/http';
import InfoToaster from '@/components/InfoToaster';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppNavigator from '@/navigation/AppNavigator';
import { installGlobalErrorHandler } from '@/services/globalErrorHandler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <SafeAreaProvider>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <>
            <AppNavigator />
            <InfoToaster />
          </>
        </NavigationContainer>
      </SafeAreaProvider>
    </>
  );
}

registerRootComponent(App);

export default App;
