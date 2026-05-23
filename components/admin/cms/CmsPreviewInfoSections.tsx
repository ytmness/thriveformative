"use client";

import CmsEditableZone from "@/components/admin/cms/CmsEditableZone";
import type { CmsEditTarget } from "@/components/admin/cms/CmsEditDrawer";

type SectionProps = {
  txt: (key: string) => string;
  onEdit: (target: CmsEditTarget) => void;
};

export function CmsPreviewDoctorSection({ txt, onEdit }: SectionProps) {
  return (
    <section id="doctor" className="cms-preview-info__section" aria-labelledby="cms-preview-doctor-title">
      <CmsEditableZone
        label="Página info — Doctor"
        onEdit={() =>
          onEdit({
            kind: "texts",
            title: "Doctor (página info)",
            keys: [
              { key: "doctor.title", label: "Título sección" },
              { key: "doctor.subtitle", label: "Subtítulo" },
              { key: "doctor.name", label: "Nombre" },
              { key: "doctor.bio", label: "Biografía" },
            ],
          })
        }
      >
        <header className="cms-preview-info__header">
          <h2 id="cms-preview-doctor-title" className="cms-preview-info__title">
            {txt("doctor.title")}
          </h2>
          <p className="cms-preview-info__subtitle">{txt("doctor.subtitle")}</p>
        </header>
        <div className="cms-preview-info__card">
          <h3 className="cms-preview-info__name">{txt("doctor.name")}</h3>
          <p className="cms-preview-info__body">{txt("doctor.bio")}</p>
        </div>
      </CmsEditableZone>
    </section>
  );
}

export function CmsPreviewFaqSection({ txt, onEdit }: SectionProps) {
  return (
    <section id="faq" className="cms-preview-info__section" aria-labelledby="cms-preview-faq-title">
      <CmsEditableZone
        label="Página info — FAQ"
        onEdit={() =>
          onEdit({
            kind: "texts",
            title: "FAQ (página info)",
            keys: [
              { key: "faq.title", label: "Título sección" },
              { key: "faq.subtitle", label: "Subtítulo" },
              { key: "faq.q1", label: "Pregunta 1" },
              { key: "faq.a1", label: "Respuesta 1" },
              { key: "faq.q2", label: "Pregunta 2" },
              { key: "faq.a2", label: "Respuesta 2" },
              { key: "faq.q3", label: "Pregunta 3" },
              { key: "faq.a3", label: "Respuesta 3" },
              { key: "faq.q4", label: "Pregunta 4" },
              { key: "faq.a4", label: "Respuesta 4" },
            ],
          })
        }
      >
        <header className="cms-preview-info__header">
          <h2 id="cms-preview-faq-title" className="cms-preview-info__title">
            {txt("faq.title")}
          </h2>
          <p className="cms-preview-info__subtitle">{txt("faq.subtitle")}</p>
        </header>
        <dl className="cms-preview-info__faq">
          {([1, 2, 3, 4] as const).map((n) => (
            <div key={n} className="cms-preview-info__faq-item">
              <dt>{txt(`faq.q${n}`)}</dt>
              <dd>{txt(`faq.a${n}`)}</dd>
            </div>
          ))}
        </dl>
      </CmsEditableZone>
    </section>
  );
}
