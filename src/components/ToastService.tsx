import { useToast } from 'native-base';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useAppToast = () => {
  const toast = useToast();

  const showToast = (message: string, type: ToastType = 'info') => {
    toast.show({
      title: message,
      variant: 'solid',
      colorScheme: getColorScheme(type),
      duration: 3000,
    });
  };

  const getColorScheme = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return {
    showSuccess: (message: string) => showToast(message, 'success'),
    showError: (message: string) => showToast(message, 'error'),
    showWarning: (message: string) => showToast(message, 'warning'),
    showInfo: (message: string) => showToast(message, 'info'),
  };
};
