/// <reference path="../types/fastify.d.ts" />
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";

const createChannelSchema = z.object({
    name: z.string().min(2),
    type: z.enum(["PUBLIC", "PRIVATE", "DIRECT"]),
    workspaceId: z.string(),
    otherUserId: z.string().optional(), // For DMs
});

const channelRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.post("/", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { name, type, workspaceId } = createChannelSchema.parse(request.body);
        const userId = (request as any).user.id;

        // Check if user is a member of the workspace
        const membership = await fastify.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
        });

        if (!membership) {
            return reply.status(403).send({ message: "Not a member of this workspace" });
        }

        const channel = await fastify.prisma.channel.create({
            data: {
                name,
                type,
                workspaceId,
                members: {
                    connect: { id: userId },
                },
            },
        });

        return channel;
    });

    fastify.get("/workspace/:workspaceId", { onRequest: [fastify.authenticate] }, async (request) => {
        const { workspaceId } = request.params as { workspaceId: string };
        const userId = (request as any).user.id;

        // Check membership
        const membership = await fastify.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId },
        });

        if (!membership) {
            throw new Error("Unauthorized");
        }

        const channels = await fastify.prisma.channel.findMany({
            where: {
                workspaceId,
                OR: [
                    { type: "PUBLIC" },
                    { members: { some: { id: userId } } },
                ],
            },
        });

        return channels;
    });

    // Get single channel info
    fastify.get("/:id", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = (request as any).user.id;

        const channel = await fastify.prisma.channel.findUnique({
            where: { id },
            include: {
                members: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        if (!channel) {
            return reply.status(404).send({ message: "Channel not found" });
        }

        // Check if user has access
        if (channel.type === "PRIVATE" && !channel.members.some(m => m.id === userId)) {
            return reply.status(403).send({ message: "Access denied" });
        }

        return channel;
    });

    // Find or Create DM
    fastify.post("/direct", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { workspaceId, otherUserId } = z.object({
            workspaceId: z.string(),
            otherUserId: z.string(),
        }).parse(request.body);
        const userId = (request as any).user.id;

        // Check if DM already exists
        let channel = await fastify.prisma.channel.findFirst({
            where: {
                workspaceId,
                type: "DIRECT",
                AND: [
                    { members: { some: { id: userId } } },
                    { members: { some: { id: otherUserId } } },
                ],
            },
            include: {
                members: { select: { id: true, name: true, avatar: true } }
            }
        });

        if (!channel) {
            const otherUser = await fastify.prisma.user.findUnique({ where: { id: otherUserId } });
            if (!otherUser) throw new Error("Other user not found");

            channel = await fastify.prisma.channel.create({
                data: {
                    name: `dm-${userId}-${otherUserId}`, // Internal name
                    type: "DIRECT",
                    workspaceId,
                    members: {
                        connect: [{ id: userId }, { id: otherUserId }],
                    },
                },
                include: {
                    members: { select: { id: true, name: true, avatar: true } }
                }
            });
        }

        return channel;
    });
}

export default channelRoutes;
