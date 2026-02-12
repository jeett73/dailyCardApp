import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const navigation = {
    navigate: (name: string, params?: any) => {
        if (navigationRef.isReady()) {
            navigationRef.navigate(name, params);
        }
    },
};
