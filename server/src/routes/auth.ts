/// <reference path="../types/fastify.d.ts" />
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    jobTitle: z.string().optional(),
    inviteToken: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    inviteToken: z.string().optional(),
});

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Helper to process invitation
    const processInvitation = async (userId: string, userName: string, token: string) => {
        const invitation = await fastify.prisma.invitation.findUnique({
            where: { token }
        });

        if (!invitation || invitation.expiresAt < new Date()) {
            return null;
        }

        // Check if already a member
        const existingMember = await fastify.prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId: invitation.workspaceId
                }
            }
        });

        if (existingMember) {
            return invitation.workspaceId;
        }

        if (invitation.acceptedAt) {
            return invitation.workspaceId; // Already accepted but maybe system failed to add member? Just return ID.
        }

        // Add to workspace
        await fastify.prisma.$transaction([
            fastify.prisma.workspaceMember.create({
                data: {
                    userId,
                    workspaceId: invitation.workspaceId,
                    role: invitation.role,
                }
            }),
            fastify.prisma.invitation.update({
                where: { id: invitation.id },
                data: { acceptedAt: new Date() }
            }),
            // Join general channel
            fastify.prisma.channel.update({
                where: {
                    workspaceId_name: {
                        workspaceId: invitation.workspaceId,
                        name: "general"
                    }
                },
                data: {
                    members: { connect: { id: userId } }
                }
            })
        ]);

        // Notify workspace members that a new user has joined
        fastify.io.to(invitation.workspaceId).emit("member-joined", {
            workspaceId: invitation.workspaceId,
            userId: userId,
            name: userName
        });

        return invitation.workspaceId;
    };

    fastify.post("/register", async (request, reply) => {
        const { email, password, name, jobTitle, inviteToken } = registerSchema.parse(request.body);

        const existingUser = await fastify.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return reply.status(400).send({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await fastify.prisma.user.create({
            data: { email, password: hashedPassword, name, jobTitle, status: "Online" },
        });

        const token = fastify.jwt.sign({ id: user.id, email: user.email });
        let workspaceId = null;

        if (inviteToken) {
            workspaceId = await processInvitation(user.id, user.name, inviteToken);
        }

        // If no invite processed (invalid or missing), create default workspace
        if (!workspaceId) {
            const workspace = await fastify.prisma.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
                    members: {
                        create: {
                            userId: user.id,
                            role: "OWNER",
                        },
                    },
                    channels: {
                        create: {
                            name: "general",
                            members: { connect: { id: user.id } }
                        },
                    },
                },
                include: { channels: true },
            });

            workspaceId = workspace.id;

            const generalChannel = workspace.channels.find(c => c.name === "general");
            if (generalChannel) {
                await fastify.prisma.message.create({
                    data: {
                        content: `Welcome to your new workspace, ${name}! 🚀 This is your #general channel.`,
                        senderId: user.id,
                        channelId: generalChannel.id,
                    },
                });
            }
        }

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, jobTitle: user.jobTitle },
            workspaceId
        };
    });

    fastify.post("/login", async (request, reply) => {
        const { email, password, inviteToken } = loginSchema.parse(request.body);

        const user = await fastify.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return reply.status(401).send({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return reply.status(401).send({ message: "Invalid credentials" });
        }

        const token = fastify.jwt.sign({ id: user.id, email: user.email });
        let workspaceId = null;

        if (inviteToken) {
            workspaceId = await processInvitation(user.id, user.name, inviteToken);
        }

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name },
            workspaceId
        };
    });

    fastify.get("/me", { onRequest: [(fastify as any).authenticate] }, async (request) => {
        const userId = (request as any).user.id;
        return await fastify.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, avatar: true, status: true, jobTitle: true, bio: true }
        });
    });

    fastify.get("/users/:id", { onRequest: [(fastify as any).authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = await fastify.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, avatar: true, status: true, jobTitle: true, bio: true }
        });
        if (!user) return reply.status(404).send({ message: "User not found" });
        return user;
    });

    fastify.patch("/me", { onRequest: [(fastify as any).authenticate] }, async (request) => {
        const userId = (request as any).user.id;
        const updates = z.object({
            name: z.string().min(2).optional(),
            avatar: z.string().optional(),
            jobTitle: z.string().optional(),
            bio: z.string().optional(),
            status: z.string().optional(),
        }).parse(request.body);

        const user = await fastify.prisma.user.update({
            where: { id: userId },
            data: updates,
            select: { id: true, email: true, name: true, avatar: true, status: true, jobTitle: true, bio: true }
        });

        // Broadcast presence/profile update
        fastify.io.emit("presence-update", {
            userId: user.id,
            status: user.status,
            name: user.name,
            avatar: user.avatar
        });

        return user;
    });
}

export default authRoutes;
