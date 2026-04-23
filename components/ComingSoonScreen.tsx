"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ComingSoonLogo3D from "./ComingSoonLogo3D";

export default function ComingSoonScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/coming-soon-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al verificar");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-page__inner">
        <div className="coming-soon-page__panel">
          <div className="coming-soon-page__logo-wrap">
            <ComingSoonLogo3D />
          </div>
          <p className="coming-soon-page__eyebrow">Acceso privado</p>
          <h1 className="coming-soon-page__title">Próximamente</h1>
          <p className="coming-soon-page__subtitle">
            Estamos preparando algo especial. Introduce la contraseña para acceder.
          </p>
          <div className="coming-soon-page__divider" aria-hidden />
          <form onSubmit={handleSubmit} className="coming-soon-page__form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="coming-soon-page__input"
              autoComplete="current-password"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="coming-soon-page__btn"
              disabled={loading}
            >
              {loading ? "Comprobando..." : "Acceder"}
            </button>
            {error && <p className="coming-soon-page__error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
