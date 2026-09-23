import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedLocales() {
  for (const loc of [
    { code: "en", label: "English" },
    { code: "nl", label: "Nederlands" },
  ]) {
    await prisma.localePack.upsert({
      where: { code: loc.code },
      create: { ...loc, enabled: true },
      update: { label: loc.label, enabled: true },
    });
  }
}

async function seedDemoGroup() {
  return prisma.group.upsert({
    where: { slug: "demo-cohort" },
    create: {
      name: "Demo Cohort",
      slug: "demo-cohort",
      locale: "en",
      availableLocales: ["en", "nl"],
      inviteCode: "OMNI-DEMO",
    },
    update: {},
  });
}

async function seedUser(
  email: string,
  password: string,
  role: "player" | "admin",
  opts?: { groupId?: string; groupRole?: string; preferredLocale?: string },
) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role,
      preferredLocale: opts?.preferredLocale ?? "en",
      groupId: opts?.groupId,
      groupRole: opts?.groupRole ?? "member",
    },
    update: {
      passwordHash,
      role,
      preferredLocale: opts?.preferredLocale ?? "en",
      groupId: opts?.groupId,
      groupRole: opts?.groupRole ?? "member",
    },
  });

  if (role === "admin") {
    for (const missionId of ["m1", "m2", "m3", "m4", "m5"]) {
      await prisma.userProgress.upsert({
        where: { userId_missionId: { userId: user.id, missionId } },
        create: { userId: user.id, missionId, status: "completed", checkpoint: "completed" },
        update: { status: "completed", checkpoint: "completed" },
      });
    }
  } else {
    await prisma.userProgress.upsert({
      where: { userId_missionId: { userId: user.id, missionId: "m1" } },
      create: { userId: user.id, missionId: "m1", status: "in_progress", checkpoint: "start" },
      update: {},
    });
  }

  return user;
}

async function main() {
  await seedLocales();
  console.log("Seeded locale packs: en, nl");

  const demo = await seedDemoGroup();
  console.log(`Seeded group: ${demo.name} (${demo.slug}) locale=${demo.locale}`);

  await seedUser("playtest@omni.local", "playtest12", "player", {
    groupId: demo.id,
    groupRole: "member",
    preferredLocale: "en",
  });
  console.log("Seeded playtest user: playtest@omni.local / playtest12");

  await seedUser("admin@maverxtest.com", "test123.com", "admin", {
    groupId: demo.id,
    groupRole: "owner",
    preferredLocale: "en",
  });
  console.log("Seeded admin user: admin@maverxtest.com / test123.com (group owner)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
