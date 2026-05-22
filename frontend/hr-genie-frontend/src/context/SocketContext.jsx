/**
 * SocketContext — manages a single authenticated Socket.IO connection
 * for the entire app lifetime. Provides `socket` and `connected` state.
 *
 * Usage:
 *   const { socket, connected } = useSocket();
 *   useEffect(() => {
 *     socket?.on('notification:new', handler);
 *     return () => socket?.off('notification:new', handler);
 *   }, [socket]);
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            // Disconnect if logged out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        // Connect (or reconnect with fresh token)
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('connect_error', (err) => {
            // Silent fail — real-time is a progressive enhancement
            console.warn('[Socket] Connection error:', err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, token]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
