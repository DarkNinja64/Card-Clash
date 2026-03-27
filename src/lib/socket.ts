import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (!socket) {
        const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
        const url = `${baseUrl}/party`;
        socket = io(url, {
            path: '/socket.io',
            transports: ['websocket'],
            auth: { token },
        });
    }
    return socket;
}
