import { io, Socket } from "socket.io-client";

const getSocketUrl = () => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
            return `http://${hostname}:3005`;
        }
    }
    return "http://localhost:3005";
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    public socket: Socket | null = null;

    connect(token: string) {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket"],
        });

        this.socket.on("connect", () => {
            console.log("Connected to socket server");
        });

        this.socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinChannel(channelId: string) {
        this.socket?.emit("join-channel", channelId);
    }

    leaveChannel(channelId: string) {
        this.socket?.emit("leave-channel", channelId);
    }

    sendMessage(channelId: string, content: string, userId: string) {
        this.socket?.emit("send-message", { channelId, content, userId });
    }

    sendTyping(channelId: string, userId: string, name: string) {
        this.socket?.emit("typing", { channelId, userId, name });
    }
}

export const socketService = new SocketService();
