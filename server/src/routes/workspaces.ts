/// <reference path="../types/fastify.d.ts" />
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import crypto from "crypto";

const createWorkspaceSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
});

const updateWorkspaceSchema = z.object({
    name: z.string().min(2).optional(),
    logo: z.string().optional(),
});

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

const workspaceRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Create Workspace
    fastify.post("/", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { name, slug } = createWorkspaceSchema.parse(request.body);
        const userId = (request as any).user.id;

        const existing = await fastify.prisma.workspace.findUnique({
            where: { slug },
        });

        if (existing) {
            return reply.status(400).send({ message: "Slug already taken" });
        }

        const workspace = await fastify.prisma.$transaction(async (tx) => {
            const ws = await tx.workspace.create({
                data: { name, slug },
            });

            await tx.workspaceMember.create({
                data: {
                    workspaceId: ws.id,
                    userId,
                    role: "OWNER",
                },
            });

            await tx.channel.create({
                data: {
                    name: "general",
                    type: "PUBLIC",
                    workspaceId: ws.id,
                    members: { connect: { id: userId } },
                },
            });

            return ws;
        });

        return workspace;
    });

    // List Workspaces
    fastify.get("/", { onRequest: [fastify.authenticate] }, async (request) => {
        const userId = (request as any).user.id;

        // Find all memberships for this user
        const memberships = await fastify.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: {
                    include: {
                        channels: true,
                        _count: {
                            select: { members: true }
                        }
                    }
                }
            }
        });

        // Flatten the structure to return workspace details + the user's role in it
        return memberships.map(m => ({
            ...m.workspace,
            role: m.role
        }));
    });

    // Get Workspace Members
    fastify.get("/:id/members", { onRequest: [fastify.authenticate] }, async (request) => {
        const { id } = request.params as { id: string };
        return await fastify.prisma.workspaceMember.findMany({
            where: { workspaceId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true, status: true }
                }
            }
        });
    });

    // Update Workspace Settings
    fastify.patch("/:id", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = (request as any).user.id;
        const updates = updateWorkspaceSchema.parse(request.body);

        // Check if user is OWNER or ADMIN
        const member = await fastify.prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId, workspaceId: id } }
        });

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return reply.status(403).send({ message: "Permission denied" });
        }

        return await fastify.prisma.workspace.update({
            where: { id },
            data: updates,
        });
    });

    // Invite User
    fastify.post("/:id/invite", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const userId = (request as any).user.id;
        const { email, role } = inviteSchema.parse(request.body);

        const member = await fastify.prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId, workspaceId: id } }
        });

        if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
            return reply.status(403).send({ message: "Permission denied" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await fastify.prisma.invitation.create({
            data: {
                email,
                role,
                token,
                workspaceId: id,
                invitedById: userId,
                expiresAt,
            }
        });

        // In a real app, send email here. For now, return the link.
        const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/join?token=${token}`;

        return { message: "Invitation created", inviteLink };
    });

    // Verify/Get Invitation
    fastify.get("/invitations/:token", async (request, reply) => {
        const { token } = request.params as { token: string };

        const invitation = await fastify.prisma.invitation.findUnique({
            where: { token },
            include: { workspace: true }
        });

        if (!invitation || invitation.expiresAt < new Date() || invitation.acceptedAt) {
            return reply.status(404).send({ message: "Invitation invalid or expired" });
        }

        return invitation;
    });

    // Accept Invitation (Logged in users)
    fastify.post("/invitations/:token/accept", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { token } = request.params as { token: string };
        const userId = (request as any).user.id;

        const invitation = await fastify.prisma.invitation.findUnique({
            where: { token }
        });

        if (!invitation || invitation.expiresAt < new Date()) {
            return reply.status(400).send({ message: "Invitation expired or invalid" });
        }

        // Check if already member
        const existing = await fastify.prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } }
        });

        if (existing) {
            return { workspaceId: invitation.workspaceId, message: "Already a member" };
        }

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
            fastify.prisma.channel.update({
                where: {
                    workspaceId_name: {
                        workspaceId: invitation.workspaceId,
                        name: "general"
                    }
                },
                data: { members: { connect: { id: userId } } }
            })
        ]);

        return { workspaceId: invitation.workspaceId, message: "Joined workspace successfully" };
    });

    // Manage Member Role
    fastify.patch("/:id/members/:memberId", { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const { id, memberId } = request.params as { id: string, memberId: string };
        const userId = (request as any).user.id;
        const { role } = z.object({ role: z.enum(["ADMIN", "MEMBER", "GUEST"]) }).parse(request.body);

        const currentMember = await fastify.prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId, workspaceId: id } }
        });

        if (!currentMember || currentMember.role !== "OWNER") {
            return reply.status(403).send({ message: "Only owners can manage roles" });
        }

        return await fastify.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role }
        });
    });
};

export default workspaceRoutes;
