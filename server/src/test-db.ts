/// <reference types="node" />
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

console.log("DATABASE_URL from process.env:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.workspace.count();
        console.log("Workspace count:", count);
    } catch (e) {
        console.error("Error during prisma call:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
