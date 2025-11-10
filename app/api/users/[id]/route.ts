import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { userSchema } from "@/types/user";

const idParamSchema = z.object({ id: z.string().cuid() });

// Body for updates: allow partial updates of user fields (except id/createdAt)
const updateBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    role: z.string().min(1).optional(),
    active: z.boolean().optional(),
    avatar: z.string().url().optional().or(z.literal("")),
    bio: z.string().optional(),
  })
  .strict();

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const parse = idParamSchema.safeParse(ctx.params);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const { id } = parse.data;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(userSchema.parse({
    ...user,
    phoneNumber: user.phoneNumber ?? "",
    avatar: user.avatar ?? "",
    bio: user.bio ?? "",
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const idParse = idParamSchema.safeParse(ctx.params);
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const { id } = idParse.data;

    const json = await req.json();
    const payload = updateBodySchema.parse(json);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...payload,
        phoneNumber: payload.phoneNumber ?? undefined,
        avatar: payload.avatar ?? undefined,
        bio: payload.bio ?? undefined,
      },
    });
    return NextResponse.json(userSchema.parse({
      ...updated,
      phoneNumber: updated.phoneNumber ?? "",
      avatar: updated.avatar ?? "",
      bio: updated.bio ?? "",
      createdAt: updated.createdAt.toISOString(),
    }));
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const parse = idParamSchema.safeParse(ctx.params);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const { id } = parse.data;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
