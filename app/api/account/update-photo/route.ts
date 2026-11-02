import { currentPatient } from "@/lib/auth/patientAccess";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const patient = await currentPatient().catch(() => null);
  if (!patient) {
    return Response.json({ error: "Inicia sesión para actualizar tu foto." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const photoUrl = String(body.photoUrl || "").trim();
    if (!photoUrl) {
      return Response.json({ error: "Agrega una foto de perfil para continuar." }, { status: 400 });
    }

    await query(
      `UPDATE patients SET profile_photo_url = $1, updated_at = now() WHERE id = $2`,
      [photoUrl, patient.id]
    );

    return Response.json({ ok: true, profilePhotoUrl: photoUrl });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error actualizando foto" },
      { status: 500 }
    );
  }
}
