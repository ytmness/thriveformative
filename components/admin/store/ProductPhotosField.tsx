"use client";

import { useId, useRef, useState } from "react";
import { uploadCmsImage, validateCmsImageFile } from "@/lib/cms/uploadImage";
import type { Locale } from "@/lib/cms/types";

const MAX_PHOTOS = 8;

export default function ProductPhotosField({
  locale,
  urls,
  onChange,
}: {
  locale: Locale;
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  function addUrls(next: string[]) {
    const merged = [...urls];
    for (const url of next) {
      const clean = url.trim();
      if (!clean || merged.includes(clean)) continue;
      if (merged.length >= MAX_PHOTOS) break;
      merged.push(clean);
    }
    onChange(merged);
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setError(null);
    const room = MAX_PHOTOS - urls.length;
    if (room <= 0) {
      setError(`Puedes agregar hasta ${MAX_PHOTOS} fotos.`);
      return;
    }
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of files.slice(0, room)) {
        const validation = validateCmsImageFile(file);
        if (validation) {
          setError(validation);
          continue;
        }
        added.push(await uploadCmsImage(file, locale, "products"));
      }
      if (added.length) addUrls(added);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addManual() {
    const clean = manualUrl.trim();
    if (!clean) return;
    if (!clean.startsWith("/") && !/^https?:\/\//i.test(clean)) {
      setError("La URL debe empezar con https:// o ser una ruta del sitio.");
      return;
    }
    setError(null);
    addUrls([clean]);
    setManualUrl("");
  }

  return (
    <div className="store-field">
      <span>Fotos</span>
      <p className="store-photos__hint">La primera es la portada. Puedes agregar hasta {MAX_PHOTOS}.</p>
      {urls.length ? (
        <ul className="store-photos">
          {urls.map((url, index) => (
            <li key={`${url}-${index}`} className="store-photos__item">
              <img src={url} alt="" />
              <div className="store-photos__tools">
                {index > 0 ? (
                  <button type="button" onClick={() => {
                    const next = [...urls];
                    const [item] = next.splice(index, 1);
                    next.splice(index - 1, 0, item);
                    onChange(next);
                  }}>
                    ←
                  </button>
                ) : (
                  <span className="store-photos__cover">Portada</span>
                )}
                <button type="button" onClick={() => onChange(urls.filter((_, i) => i !== index))}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className={`store-photos__drop${dragOver ? " is-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handleFiles(Array.from(event.dataTransfer.files || []));
        }}
      >
        <p>
          {uploading ? "Subiendo…" : "Arrastra fotos aquí o "}
          {uploading ? null : <label htmlFor={inputId}>busca archivos</label>}
        </p>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploading || urls.length >= MAX_PHOTOS}
          onChange={(event) => void handleFiles(Array.from(event.target.files || []))}
        />
      </div>
      {error ? <p className="store-photos__error">{error}</p> : null}
      <button type="button" className="store-photos__url" onClick={() => setShowUrl((open) => !open)}>
        {showUrl ? "Ocultar URL" : "Agregar por URL"}
      </button>
      {showUrl ? (
        <div className="store-photos__url-row">
          <input
            type="url"
            value={manualUrl}
            placeholder="https://…"
            onChange={(event) => setManualUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addManual();
              }
            }}
          />
          <button type="button" onClick={addManual}>Agregar</button>
        </div>
      ) : null}
    </div>
  );
}
