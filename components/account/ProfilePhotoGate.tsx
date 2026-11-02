"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/components/admin/clinic/client";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { PatientAvatar } from "@/components/PatientAvatar";

export function ProfilePhotoGate({
  firstName = "Paciente",
  lastName = "",
  onDone,
}: {
  firstName?: string;
  lastName?: string;
  onDone: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCropComplete(croppedBlob: Blob) {
    setUploading(true);
    setError(null);
    setCropImage(null);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "profile.jpg");
      const uploadRes = await fetch("/api/upload-profile-photo", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || t("profilePhotoRequired"));
      }
      const { url } = await uploadRes.json();
      await api("/api/account/update-photo", { method: "POST", body: JSON.stringify({ photoUrl: url }) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profilePhotoRequired"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="booking-gate">
      {cropImage ? (
        <ImageCropDialog imageSrc={cropImage} onComplete={handleCropComplete} onCancel={() => setCropImage(null)} />
      ) : null}
      <PatientAvatar firstName={firstName} lastName={lastName} size="xlarge" />
      <p className="booking-gate__title">{t("profilePhoto")}</p>
      <p className="booking-gate__hint">{t("profilePhotoRequired")}</p>
      {error ? <p className="booking-error" role="alert">{error}</p> : null}
      <button
        type="button"
        className="btn-primary"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "..." : t("profilePhotoAdd")}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setCropImage(reader.result as string);
          reader.readAsDataURL(file);
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <p className="visit-sheet__when" style={{ marginTop: "0.75rem" }}>{locale === "en" ? "You can continue after the photo is saved." : "Puedes continuar cuando la foto esté guardada."}</p>
    </div>
  );
}
