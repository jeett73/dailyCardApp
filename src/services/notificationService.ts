import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestUserPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Permission denied")
      return false
    }
    return true
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
}

export async function registerForPushNotificationsAsync() {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.log('User declined permission or permissions not granted');
      return undefined;
    }

    // Get the token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return undefined;
  }
}

// Handler for foreground messages
export function setupForegroundHandler() {
  return messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    // You can show a local notification here if needed using a library like notifee or keeping expo-notifications for generic alerts
    // For now, just logging it as per the request to switch to firebase logic
  });
}

// Handler for background/quit state messages
export function setupBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });
}

// Handle notification opening
export function handleNotificationOpenedApp() {
  // When the application is running, but in the background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification,
    );
    // Navigation logic can go here
  });

  // Check whether an initial notification is available
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
        // Navigation logic can go here
      }
    });
}

