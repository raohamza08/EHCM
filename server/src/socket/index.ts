import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";

export const setupSocketHandlers = (fastify: FastifyInstance) => {
    const io: Server = fastify.io;

    const onlineUsers = new Map<string, string>(); // userId -> socketId

    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("user-online", (data: { userId: string }) => {
            onlineUsers.set(data.userId, socket.id);
            (socket as any).userId = data.userId;
            io.emit("presence-update", { userId: data.userId, status: "online" });
        });

        socket.on("join-channel", (channelId: string) => {
            socket.join(`channel:${channelId}`);
            console.log(`Socket ${socket.id} joined channel ${channelId}`);
        });

        socket.on("leave-channel", (channelId: string) => {
            socket.leave(`channel:${channelId}`);
        });

        socket.on("send-message", async (data: { channelId: string; content: string; userId: string; parentId?: string; file?: { name: string, url: string, type: string, size: number } }) => {
            const { channelId, content, userId, parentId, file } = data;

            try {
                const message = await fastify.prisma.message.create({
                    data: {
                        content,
                        channelId,
                        senderId: userId,
                        parentId,
                        files: file ? {
                            create: {
                                name: file.name,
                                url: file.url,
                                type: file.type,
                                size: file.size || 0
                            }
                        } : undefined
                    },
                    include: {
                        sender: {
                            select: { id: true, name: true, avatar: true },
                        },
                        parent: true,
                        files: true
                    },
                });

                io.to(`channel:${channelId}`).emit("new-message", message);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("edit-message", async (data: { messageId: string; content: string; channelId: string }) => {
            try {
                const message = await fastify.prisma.message.update({
                    where: { id: data.messageId },
                    data: { content: data.content },
                    include: {
                        sender: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                });
                io.to(`channel:${data.channelId}`).emit("message-updated", message);
            } catch (error) {
                console.error("Error editing message:", error);
            }
        });

        socket.on("typing", (data: { channelId: string; userId: string; name: string }) => {
            socket.to(`channel:${data.channelId}`).emit("user-typing", data);
        });

        socket.on("pin-message", async (data: { messageId: string; channelId: string }) => {
            const message = await fastify.prisma.message.update({
                where: { id: data.messageId },
                data: { isPinned: true },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });
            io.to(`channel:${data.channelId}`).emit("message-updated", message);
        });

        socket.on("add-reaction", async (data: { messageId: string; channelId: string; emoji: string; userId: string }) => {
            const msg = await fastify.prisma.message.findUnique({ where: { id: data.messageId } });
            if (!msg) return;

            const reactions = JSON.parse(msg.reactions || "{}");
            if (!reactions[data.emoji]) reactions[data.emoji] = [];
            if (!reactions[data.emoji].includes(data.userId)) {
                reactions[data.emoji].push(data.userId);
            }

            const updated = await fastify.prisma.message.update({
                where: { id: data.messageId },
                data: { reactions: JSON.stringify(reactions) },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });

            io.to(`channel:${data.channelId}`).emit("message-updated", updated);
        });

        socket.on("delete-message", async (data: { messageId: string; channelId: string }) => {
            await fastify.prisma.message.delete({ where: { id: data.messageId } });
            io.to(`channel:${data.channelId}`).emit("message-deleted", { messageId: data.messageId });
        });

        // --- Video/Audio Calling ---
        socket.on("call-user", (data: { to: string; from: string; type: "video" | "audio"; signal: any }) => {
            const receiverSocketId = onlineUsers.get(data.to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incoming-call", {
                    from: data.from,
                    type: data.type,
                    signal: data.signal
                });
            }
        });

        socket.on("answer-call", (data: { to: string; signal: any }) => {
            const callerSocketId = onlineUsers.get(data.to);
            if (callerSocketId) {
                io.to(callerSocketId).emit("call-accepted", {
                    signal: data.signal
                });
            }
        });

        socket.on("reject-call", (data: { to: string }) => {
            const callerSocketId = onlineUsers.get(data.to);
            if (callerSocketId) {
                io.to(callerSocketId).emit("call-rejected");
            }
        });

        socket.on("end-call", (data: { to: string }) => {
            const socketId = onlineUsers.get(data.to);
            if (socketId) {
                io.to(socketId).emit("call-ended");
            }
        });

        socket.on("ice-candidate", (data: { to: string; candidate: any }) => {
            const socketId = onlineUsers.get(data.to);
            if (socketId) {
                io.to(socketId).emit("ice-candidate", {
                    candidate: data.candidate
                });
            }
        });

        socket.on("disconnect", () => {
            const userId = (socket as any).userId;
            if (userId) {
                onlineUsers.delete(userId);
                io.emit("presence-update", { userId, status: "offline" });
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
