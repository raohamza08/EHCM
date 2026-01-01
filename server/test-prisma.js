const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});

async function test() {
    console.log("Starting Prisma test...");
    try {
        await prisma.$connect();
        console.log("Successfully connected to Prisma!");
        const users = await prisma.user.findMany();
        console.log("Users count:", users.length);
    } catch (err) {
        console.error("Prisma test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
