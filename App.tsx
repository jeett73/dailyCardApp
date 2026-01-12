import { initAuthFromStorage } from '@/api/http';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppNavigator from '@/navigation/AppNavigator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

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

  const colorScheme = useColorScheme();

  if (!loaded) {
    return null;
  }

  return (
    <>
      <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

registerRootComponent(App);

export default App;
