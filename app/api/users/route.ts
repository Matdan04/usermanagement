import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
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

  const where: Prisma.UserWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phoneNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      role ? { role } : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: new Date(dateTo) } } : {},
    ],
  };

  const orderBy: Prisma.UserOrderByWithRelationInput = { [sortBy]: order } as any;

  const users = await prisma.user.findMany({ where, orderBy });
  // Ensure output matches zod schema (runtime guard)
  const data = users.map((u) => userSchema.parse(u));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = createUserSchema.parse(json);

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
    return NextResponse.json(userSchema.parse(created), { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
