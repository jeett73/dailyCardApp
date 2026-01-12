import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

interface ShowToastParams {
  type: ToastType;
  text1: string;
  text2?: string;
  position?: 'top' | 'bottom';
  visibilityTime?: number;
}

/**
 * Common utility to handle toast messages throughout the app.
 */
export const showToast = (type: ToastType, text1: string, text2?: string) => {
  Toast.show({
    type,
    text1,
    text2,
    position: 'top',
    visibilityTime: 2000,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 40,
  });
};

export const showSuccessToast = (message: string, description?: string) => {
  showToast('success', message, description);
};

export const showErrorToast = (message: string, description?: string) => {
  showToast('error', message, description);
};

export const showInfoToast = (message: string, description?: string) => {
  showToast('info', message, description);
};
