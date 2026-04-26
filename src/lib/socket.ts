import { io, type Socket } from 'socket.io-client';

export function createPartySocket(token?: string | null): Socket {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';

    return io(`${baseUrl}/party`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
    });
}
