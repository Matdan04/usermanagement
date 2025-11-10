import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(trueWeight = 0.8) {
  return Math.random() < trueWeight;
}

function randomDateWithin(daysBack = 120): Date {
  const now = Date.now();
  const past = now - Math.floor(Math.random() * daysBack) * 24 * 60 * 60 * 1000;
  return new Date(past);
}

function generateUsers(count = 20) {
  const roles = ["admin", "editor", "user"] as const;
  const users = Array.from({ length: count }).map((_, i) => {
    const n = i + 1;
    const first = ["Alex", "Taylor", "Jordan", "Sam", "Casey", "Jamie", "Riley", "Morgan"][n % 8];
    const last = ["Lee", "Kim", "Patel", "Garcia", "Nguyen", "Smith", "Jones", "Brown"][Math.floor(Math.random() * 8)];
    const name = `${first} ${last}`;
    const email = `user${n}@example.com`;
    const role = randomChoice([...roles]);
    const active = randomBool(0.85);
    const phoneNumber = `+1-555-01${String(n).padStart(2, "0")}${Math.floor(Math.random() * 10)}`;
    const avatar = Math.random() < 0.6 ? `https://i.pravatar.cc/100?img=${(n % 70) + 1}` : undefined;
    const bios = [
      "Enjoys building web apps and APIs.",
      "Coffee enthusiast and weekend hiker.",
      "Passionate about design systems.",
      "Loves TypeScript and DX.",
      "Fan of functional programming.",
    ];
    const bio = Math.random() < 0.7 ? randomChoice(bios) : undefined;

    return {
      name,
      email,
      role,
      active,
      phoneNumber,
      avatar,
      bio,
      createdAt: randomDateWithin(180),
    };
  });
  return users;
}

async function main() {
  const users = generateUsers(30);
  await prisma.user.createMany({ data: users, skipDuplicates: true });
  const count = await prisma.user.count();
  console.log(`Seed complete. Users in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

