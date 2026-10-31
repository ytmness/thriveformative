import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }
    
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes JPEG, PNG o WebP" }, { status: 400 });
    }
    
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Máximo 5 MB" }, { status: 400 });
    }
    
    const ext = file.name.split(".").pop()?.toLowerCase() === "jpeg" ? "jpg" : 
                file.name.split(".").pop()?.toLowerCase() || "jpg";
    
    const relDir = path.join("uploads", "profiles");
    const absDir = path.join(process.cwd(), "public", relDir);
    await mkdir(absDir, { recursive: true });
    
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const absPath = path.join(absDir, filename);
    
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(absPath, buf);
    
    const publicUrl = `/${relDir.replace(/\\/g, "/")}/${filename}`;
    
    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error subiendo" },
      { status: 500 }
    );
  }
}
