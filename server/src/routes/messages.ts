/// <reference path="../types/fastify.d.ts" />
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";

const messageRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Get messages for a channel
    fastify.get("/channel/:channelId", { onRequest: [fastify.authenticate] }, async (request) => {
        const { channelId } = request.params as { channelId: string };
        const { limit = 50, before } = request.query as { limit?: number; before?: string };

        return await fastify.prisma.message.findMany({
            where: {
                channelId,
                parentId: null, // Only top-level messages
            },
            take: Number(limit),
            skip: before ? 1 : 0,
            cursor: before ? { id: before } : undefined,
            orderBy: { createdAt: "desc" },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                _count: { select: { replies: true } },
                files: true
            }
        });
    });

    // Get thread replies
    fastify.get("/thread/:parentId", { onRequest: [fastify.authenticate] }, async (request) => {
        const { parentId } = request.params as { parentId: string };

        const parent = await fastify.prisma.message.findUnique({
            where: { id: parentId },
            include: { sender: { select: { id: true, name: true, avatar: true } } }
        });

        const replies = await fastify.prisma.message.findMany({
            where: { parentId },
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, name: true, avatar: true } } }
        });

        return { parent, replies };
    });
};

export default messageRoutes;
