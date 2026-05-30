import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const WS_URL = API_URL.replace('/api/v1', '');

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
