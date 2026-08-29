import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (() => {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
})();

export function useChatSocket(
  convId: number | null,
  onMessage: (msg: any) => void,
) {
  const socketRef    = useRef<Socket | null>(null);
  const onMsgRef     = useRef(onMessage);
  const joinedConvRef = useRef<number | null>(null);
  onMsgRef.current = onMessage;

  // Connexion unique au montage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('message', (msg: any) => {
      onMsgRef.current(msg);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      joinedConvRef.current = null;
    };
  }, []);

  // Rejoindre la room quand convId change
  useEffect(() => {
    if (!convId || joinedConvRef.current === convId) return;
    const socket = socketRef.current;
    if (!socket) return;

    const join = () => {
      socket.emit('rejoindre', { conversationId: convId });
      joinedConvRef.current = convId;
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }
  }, [convId]);

  // Retourner une fonction pour rejoindre dynamiquement (changement de conv active)
  const joinConv = useCallback((id: number) => {
    const socket = socketRef.current;
    if (!socket || joinedConvRef.current === id) return;
    const join = () => {
      socket.emit('rejoindre', { conversationId: id });
      joinedConvRef.current = id;
    };
    if (socket.connected) join();
    else socket.once('connect', join);
  }, []);

  return { joinConv };
}
