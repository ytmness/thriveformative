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
  layout?: "inline" | "drop";
};

export default function CmsImageField({
  locale,
  value,
  onChange,
  label = "Imagen",
  uploadFolder = "articles",
  layout = "inline",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  if (layout === "drop") {
    return (
      <div className="cms-image-field">
        <div
          className={`cms-image-field__drop${dragOver ? " is-over" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void handleFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          {value?.trim() ? <img src={value} alt="" className="cms-image-field__drop-preview" /> : (
            <span className="cms-image-field__drop-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.4" /><path d="m21 15-4.5-4.5L7 19" /></svg>
            </span>
          )}
          <p>
            {uploading ? "Subiendo…" : "Arrastrar la imagen aquí, "}
            {uploading ? null : (
              <label htmlFor={inputId}>buscar archivo</label>
            )}
          </p>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cms-image-field__file-input"
            disabled={uploading}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <p className="cms-image-field__hint">JPG, PNG, WebP o GIF · máx. 5 MB</p>
        {value ? (
          <button type="button" className="cms-image-field__url-toggle" disabled={uploading} onClick={() => onChange(null)}>
            Quitar imagen
          </button>
        ) : null}
        {error ? <p className="cms-image-field__error">{error}</p> : null}
        <button type="button" className="cms-image-field__url-toggle" onClick={() => setShowUrl((open) => !open)}>
          {showUrl ? "Ocultar URL" : "Usar URL"}
        </button>
        {showUrl ? (
          <div className="cms-image-field__url-row">
            <input type="url" value={value ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value.trim() || null)} />
          </div>
        ) : null}
      </div>
    );
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
