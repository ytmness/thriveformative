import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", "profiles", filename);
    
    const file = await readFile(filePath);
    
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" 
                      : ext === "png" ? "image/png"
                      : ext === "webp" ? "image/webp"
                      : "image/jpeg";
    
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving profile photo:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
