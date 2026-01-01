import { FastifyInstance } from "fastify";

export default async function notificationsRoutes(fastify: FastifyInstance) {
    // Get notifications for current user
    fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;

        const notifications = await fastify.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return notifications;
    });

    // Mark as read
    fastify.patch("/:id/read", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const notification = await fastify.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        return notification;
    });

    // Mark all as read
    fastify.post("/read-all", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        await fastify.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        return { success: true };
    });
}
