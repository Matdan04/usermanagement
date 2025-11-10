import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { createUserSchema, userSchema } from "@/types/user";

const listQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z.enum(["createdAt", "name", "email", "role"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parse = listQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    sortBy: (searchParams.get("sortBy") as any) ?? undefined,
    order: (searchParams.get("order") as any) ?? undefined,
  });

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { search, role, sortBy = "createdAt", order = "desc", dateFrom, dateTo } = parse.data;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phoneNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      role ? { role } : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: new Date(dateTo) } } : {},
    ],
  };

  const orderBy = { [sortBy]: order };

  const users = await prisma.user.findMany({ where, orderBy });
  // Ensure output matches zod schema (runtime guard)
  const data = users.map((u: { id: string; name: string; email: string; phoneNumber: string | null; role: string; active: boolean; avatar: string | null; bio: string | null; createdAt: Date }) => userSchema.parse({
    ...u,
    phoneNumber: u.phoneNumber ?? "",
    avatar: u.avatar ?? "",
    bio: u.bio ?? "",
    createdAt: u.createdAt.toISOString(),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = createUserSchema.parse(json);

    // Unique email pre-check to return a clean 409 without relying on DB error
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const created = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber ?? null,
        role: payload.role,
        active: payload.active ?? true,
        avatar: payload.avatar ?? null,
        bio: payload.bio ?? null,
      },
    });
    return NextResponse.json(userSchema.parse({
      ...created,
      phoneNumber: created.phoneNumber ?? "",
      avatar: created.avatar ?? "",
      bio: created.bio ?? "",
      createdAt: created.createdAt.toISOString(),
    }), { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
