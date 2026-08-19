import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUploadMedia } from "@/lib/rbac";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import type { Role } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !canUploadMedia(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Set CLOUDINARY_* env vars." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const alt = String(formData.get("alt") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cloudinary = configureCloudinary();

  const uploaded = await new Promise<{
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "blog-portal", resource_type: "image" },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve(result as typeof result & { public_id: string });
        }
      )
      .end(buffer);
  });

  return NextResponse.json({
    id: uploaded.public_id,
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    alt,
  });
}
