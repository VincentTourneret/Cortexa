import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
    url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users in DB:");
    users.forEach(u => {
        console.log(`- ${u.email}: Verified=${u.emailVerified}, Token=${u.verificationToken}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
