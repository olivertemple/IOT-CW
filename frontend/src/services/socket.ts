
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../constants';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    // If BACKEND_URL is absolute (http://localhost:3001), point the
    // socket client at that url so it connects directly. Otherwise
    // leave the host undefined so it uses the same origin and the
    // dev proxy can forward `/socket.io` correctly.
    const backendIsAbsolute = typeof BACKEND_URL === 'string' && /^https?:\/\//.test(BACKEND_URL);
    const socketUrl = backendIsAbsolute ? BACKEND_URL : undefined;
    socket = io(socketUrl as any, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    console.log('Socket Initialized');
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
};
