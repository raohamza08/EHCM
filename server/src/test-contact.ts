import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function test() {
    try {
        const contact = await prisma.contact.findFirst();
        console.log("Contact found:", contact);
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
