import { FastifyInstance } from "fastify";

export default async function contactsRoutes(fastify: FastifyInstance) {
    // Get all contacts for the current user
    fastify.get("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        const { category, search } = request.query as { category?: string; search?: string };

        const where: any = { userId };
        if (category && category !== "All") {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { company: { contains: search } },
            ];
        }

        const contacts = await fastify.prisma.contact.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return contacts;
    });

    // Add a new contact
    fastify.post("/", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = (request.user as any).id;
        const data = request.body as any;

        const contact = await fastify.prisma.contact.create({
            data: {
                ...data,
                userId,
            },
        });

        return contact;
    });

    // Update favorite status
    fastify.patch("/:id/favorite", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { isFavorite } = request.body as { isFavorite: boolean };

        const contact = await fastify.prisma.contact.update({
            where: { id },
            data: { isFavorite },
        });

        return contact;
    });

    // Delete contact
    fastify.delete("/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await fastify.prisma.contact.delete({ where: { id } });
        return { success: true };
    });
}
