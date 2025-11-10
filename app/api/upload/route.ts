import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const folder = process.env.CLOUDINARY_FOLDER || "user-avatars";

    const url: string = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image", fetch_format: "auto", quality: "auto" },
        (err, result) => {
          if (err || !result) return reject(err || new Error("Upload failed"));
          resolve(result.secure_url);
        }
      );
      upload.end(buffer);
    });

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

