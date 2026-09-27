import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket(trackingNumber, onUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!trackingNumber) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join', trackingNumber);

    socket.on('tracking:update', (payload) => {
      onUpdate(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [trackingNumber]);
}