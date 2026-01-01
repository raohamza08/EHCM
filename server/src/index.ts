import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import socketio from "fastify-socket.io";
import { PrismaClient } from "@prisma/client";
import authPlugin from "./plugins/auth";
import authRoutes from "./routes/auth";
import workspaceRoutes from "./routes/workspaces";
import channelRoutes from "./routes/channels";
import messageRoutes from "./routes/messages";
import searchRoutes from "./routes/search";
import aiRoutes from "./routes/ai";
import contactRoutes from "./routes/contacts";
import eventRoutes from "./routes/events";
import notificationRoutes from "./routes/notifications";
import { setupSocketHandlers } from "./socket";

const prisma = new PrismaClient();
const fastify = Fastify({
    logger: true,
    ignoreTrailingSlash: true,
});

// Plugins
fastify.register(cors, {
    origin: true,
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    strictPreflight: false,
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-key-change-me-in-prod",
});

fastify.get("/api", async () => {
    return { status: "EuroCom API is operational", version: "1.0.0" };
});

fastify.register(authPlugin);

fastify.register(socketio, {
    cors: {
        origin: "*",
    },
});

// Decorate fastify with prisma
fastify.decorate("prisma", prisma);

// Health check
fastify.get("/health", async () => {
    return { status: "ok" };
});

// Routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(workspaceRoutes, { prefix: "/api/workspaces" });
fastify.register(channelRoutes, { prefix: "/api/channels" });
fastify.register(messageRoutes, { prefix: "/api/messages" });
fastify.register(searchRoutes, { prefix: "/api/search" });
fastify.register(aiRoutes, { prefix: "/api/ai" });
fastify.register(contactRoutes, { prefix: "/api/contacts" });
fastify.register(eventRoutes, { prefix: "/api/events" });
fastify.register(notificationRoutes, { prefix: "/api/notifications" });

// Start server
const start = async () => {
    try {
        await fastify.ready();
        setupSocketHandlers(fastify);

        const port = Number(process.env.PORT) || 3005;
        await fastify.listen({ port, host: "0.0.0.0" });
        console.log(`Server listening on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
