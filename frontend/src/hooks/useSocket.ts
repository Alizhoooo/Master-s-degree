import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export function useInventorySocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(`${WS_URL}/ws/inventory`);
    socketRef.current = socket;

    socket.on('stockUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
    });

    socket.on('reservationCompleted', () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['priority'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
    });

    return () => { socket.disconnect(); };
  }, [queryClient]);

  return socketRef;
}
