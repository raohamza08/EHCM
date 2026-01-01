import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";

const searchRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get("/", { onRequest: [fastify.authenticate] }, async (request) => {
        const { q, workspaceId } = z.object({
            q: z.string().min(1),
            workspaceId: z.string().optional(),
        }).parse(request.query);
        const userId = (request as any).user.id;

        const [messages, contacts, events] = await Promise.all([
            // Search Messages
            fastify.prisma.message.findMany({
                where: {
                    content: { contains: q }, // SQLite doesn't support mode: insensitive
                    channel: workspaceId ? { workspaceId } : undefined,
                    OR: [
                        { channel: { type: "PUBLIC" } },
                        { channel: { members: { some: { id: userId } } } }
                    ]
                },
                include: { sender: { select: { name: true } }, channel: { select: { name: true } } },
                take: 10,
            }),
            // Search Contacts
            fastify.prisma.contact.findMany({
                where: {
                    userId,
                    OR: [
                        { name: { contains: q } },
                        { email: { contains: q } },
                        { company: { contains: q } }
                    ]
                },
                take: 5,
            }),
            // Search Events
            fastify.prisma.event.findMany({
                where: {
                    OR: [
                        { title: { contains: q } },
                        { description: { contains: q } }
                    ],
                    AND: [ // Correctly use AND for permissions
                        {
                            OR: [
                                { userId },
                                { participants: { some: { userId } } },
                                { type: "Public" }
                            ]
                        }
                    ]
                },
                take: 5,
            })
        ]);

        return { messages, contacts, events };
    });
};

export default searchRoutes;
