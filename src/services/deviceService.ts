import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getItem, setItem } from './storage';

const DEVICE_ID_KEY = 'device_id';

function generateUUID() {
  // Simple UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    await setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceInfo() {
  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
  };
}
