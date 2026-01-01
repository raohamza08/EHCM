import { FastifyInstance } from "fastify";

export default async function eventsRoutes(fastify: FastifyInstance) {
    // Get all events for the current user (owned or participating)
    fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        const { type } = request.query as { type?: string };

        const where: any = {
            OR: [
                { userId },
                { participants: { some: { userId } } },
                { type: "Public" }
            ]
        };

        if (type && type !== "All") {
            where.type = type;
        }

        const events = await fastify.prisma.event.findMany({
            where,
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                }
            },
            orderBy: { startTime: "asc" },
        });

        return events;
    });

    // Schedule a new event
    fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        const { participants, ...eventData } = request.body as any;

        const event = await fastify.prisma.event.create({
            data: {
                ...eventData,
                userId,
                participants: {
                    create: participants?.map((pId: string) => ({
                        userId: pId,
                        status: "PENDING"
                    })) || []
                }
            },
            include: {
                participants: true
            }
        });

        return event;
    });

    // Update event RSVP status
    fastify.patch("/:id/rsvp", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        const rsvp = await fastify.prisma.eventParticipant.upsert({
            where: {
                eventId_userId: { eventId: id, userId }
            },
            update: { status },
            create: { eventId: id, userId, status }
        });

        return rsvp;
    });

    // Delete event
    fastify.delete("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await fastify.prisma.event.delete({ where: { id } });
        return { success: true };
    });
}
