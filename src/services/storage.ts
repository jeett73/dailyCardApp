import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItem = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value;
};

export const setItem = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

export const clear = async () => {
  await AsyncStorage.clear();
};

export default { getItem, setItem, removeItem, clear };
