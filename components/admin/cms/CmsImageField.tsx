"use client";

import { useId, useRef, useState } from "react";
import { uploadCmsImage, validateCmsImageFile, type CmsImageFolder } from "@/lib/cms/uploadImage";
import type { Locale } from "@/lib/cms/types";
import "@/app/styles/cms-image-field.css";

type Props = {
  locale: Locale;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  uploadFolder?: CmsImageFolder;
};

export default function CmsImageField({
  locale,
  value,
  onChange,
  label = "Imagen",
  uploadFolder = "articles",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    const validation = validateCmsImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadCmsImage(file, locale, uploadFolder);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="cms-image-field">
      <span className="cms-image-field__label">{label}</span>

      {value?.trim() ? (
        <div className="cms-image-field__preview-wrap">
          <img src={value} alt="" className="cms-image-field__preview" />
        </div>
      ) : null}

      <div className="cms-image-field__actions">
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="cms-image-field__file-input"
          disabled={uploading}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <label htmlFor={inputId} className="cms-image-field__btn">
          {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Adjuntar imagen"}
        </label>
        {value ? (
          <button
            type="button"
            className="cms-image-field__btn cms-image-field__btn--ghost"
            disabled={uploading}
            onClick={() => onChange(null)}
          >
            Quitar
          </button>
        ) : null}
      </div>

      <p className="cms-image-field__hint">JPG, PNG, WebP o GIF · máx. 5 MB</p>

      {error ? <p className="cms-image-field__error">{error}</p> : null}

      <button
        type="button"
        className="cms-image-field__url-toggle"
        onClick={() => setShowUrl((v) => !v)}
      >
        {showUrl ? "Ocultar URL manual" : "Usar URL en su lugar"}
      </button>

      {showUrl ? (
        <div className="cms-image-field__url-row">
          <input
            type="url"
            value={value ?? ""}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value.trim() || null)}
          />
        </div>
      ) : null}
    </div>
  );
}
