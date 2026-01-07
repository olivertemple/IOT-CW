
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../constants';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
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
