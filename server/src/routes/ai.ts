import { FastifyInstance, FastifyPluginAsync } from "fastify";

const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.post("/summarize", { onRequest: [fastify.authenticate] }, async (request) => {
        const { channelId } = request.body as { channelId: string };

        const messages = await fastify.prisma.message.findMany({
            where: { channelId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        if (messages.length === 0) return { summary: "No messages to summarize." };

        const textToSummarize = messages.reverse().map(m => m.content).join("\n");

        // In a real production app, we would call an LLM (like Gemini) here.
        // For now, we simulate a smart summary.
        const summary = `This channel is discussing "${messages[0].content.slice(0, 50)}...". Key points include ${messages.length} recent messages focusing on group coordination and real-time updates.`;

        return { summary };
    });
};

export default aiRoutes;
