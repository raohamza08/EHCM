import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";
import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
        io: Server;
        authenticate: any;
    }
}
