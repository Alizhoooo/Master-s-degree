import { showNotification } from '@mantine/notifications';

export const notifications = {
  show: (opts: { title?: string; message: string; color?: string; autoClose?: number }) => {
    showNotification({
      title: opts.title,
      message: opts.message,
      color: opts.color || 'blue',
      autoClose: opts.autoClose ?? 3000,
    });
  },
  success: (title: string, message: string) => {
    showNotification({ title, message, color: 'green', autoClose: 3000 });
  },
  error: (title: string, message: string) => {
    showNotification({ title, message, color: 'red', autoClose: 5000 });
  },
};
