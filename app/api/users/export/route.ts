import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Parser } from "json2csv";

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

    const rows = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phoneNumber: u.phoneNumber ?? "",
      role: u.role,
      active: u.active,
      avatar: u.avatar ?? "",
      bio: u.bio ?? "",
      createdAt: u.createdAt.toISOString(),
    }));

    const fields = [
      { label: "ID", value: "id" },
      { label: "Name", value: "name" },
      { label: "Email", value: "email" },
      { label: "Phone Number", value: "phoneNumber" },
      { label: "Role", value: "role" },
      { label: "Active", value: "active" },
      { label: "Avatar", value: "avatar" },
      { label: "Bio", value: "bio" },
      { label: "Created At", value: "createdAt" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    const filename = `users_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export users" }, { status: 500 });
  }
}
