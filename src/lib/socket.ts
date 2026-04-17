import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (!socket) {
        const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
        socket = io(`${baseUrl}/party`, {
            path: '/socket.io',
            transports: ['websocket'],
            auth: { token },
        });
    }
    return socket;
}

/** Disconnect and clear the singleton — call this when a player leaves a game. */
export function disconnectSocket(): void {
    socket?.disconnect();
    socket = null;
}
