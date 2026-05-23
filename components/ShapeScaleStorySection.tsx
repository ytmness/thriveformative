"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import "@/app/styles/shapescale-story.css";

const STEP_IDS = ["fullPicture", "head", "arm", "progress", "reinvented"] as const;
type StepId = (typeof STEP_IDS)[number];

const STEP_IMAGES: Record<StepId, string> = {
  fullPicture: "/shapescale/step-full.png",
  head: "/shapescale/step-head.png",
  arm: "/shapescale/step-arm.png",
  progress: "/shapescale/step-progress.png",
  reinvented: "/shapescale/step-reinvented.png",
};

/** Scroll pinneado: ~90vh de scroll por paso en desktop. */
const PIN_SCROLL_PER_STEP_VH = 90;

type StepContent = {
  id: StepId;
  image: string;
  title: string;
  lead: string;
  items: string[];
};

function ShapeScaleCheckList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="shapescale-story__list">
      {items.map((text) => (
        <li key={text} className="shapescale-story__item">
          <span className="shapescale-story__bullet" aria-hidden />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function ShapeScalePanelCopy({
  eyebrow,
  title,
  lead,
  items,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  items: string[];
}) {
  return (
    <>
      <p className="shapescale-story__eyebrow">{eyebrow}</p>
      <h2 className="shapescale-story__title">{title}</h2>
      {lead ? <p className="shapescale-story__lead">{lead}</p> : null}
      <ShapeScaleCheckList items={items} />
    </>
  );
}

export default function ShapeScaleStorySection() {
  const t = useTranslations("shapescale");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = useMemo<StepContent[]>(() => {
    return STEP_IDS.map((id) => {
      const items = t.raw(`steps.${id}.items`);
      return {
        id,
        image: STEP_IMAGES[id],
        title: t(`steps.${id}.title`),
        lead: t(`steps.${id}.lead`),
        items: Array.isArray(items) ? (items as string[]) : [],
      };
    });
  }, [t]);

  const eyebrow = t("eyebrow");
  const scrollHint = t("scrollHint");

  const goToStep = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el || typeof window === "undefined") return;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const totalScroll = (PIN_SCROLL_PER_STEP_VH / 100) * window.innerHeight * STEP_IDS.length;
    const target = sectionTop + (index / STEP_IDS.length) * totalScroll + 2;
    window.scrollTo({ top: target, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const scrollEl = scrollRef.current;
    const pinEl = pinRef.current;
    if (!scrollEl || !pinEl) return;

    const endPx = () => `+=${(PIN_SCROLL_PER_STEP_VH / 100) * window.innerHeight * STEP_IDS.length}`;

    const headerOffset = 72; /* 4.5rem — altura del header fijo */

    const trigger = ScrollTrigger.create({
      trigger: scrollEl,
      start: `top top+=${headerOffset}`,
      end: endPx,
      pin: pinEl,
      pinSpacing: true,
      scrub: 0.35,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(
          STEP_IDS.length - 1,
          Math.max(0, Math.floor(self.progress * STEP_IDS.length))
        );
        setActiveIndex(idx);
      },
    });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      trigger.kill();
    };
  }, []);

  return (
    <section className="shapescale-story" aria-label={t("storyLabel")}>
      {/* Desktop: scroll pinneado */}
      <div ref={scrollRef} className="shapescale-story__desktop-scroll shapescale-story__scroll">
        <div ref={pinRef} className="shapescale-story__pin">
          <div className="shapescale-story__grid">
            <div className="shapescale-story__visual" aria-hidden>
              <div className="shapescale-story__visual-inner">
                {steps.map((step, i) => (
                  <Image
                    key={step.id}
                    src={step.image}
                    alt=""
                    width={900}
                    height={900}
                    className={`shapescale-story__img${i === activeIndex ? " shapescale-story__img--active" : ""}`}
                    priority={i === 0}
                    sizes="(min-width: 1024px) 45vw, 90vw"
                  />
                ))}
              </div>
            </div>

            <div className="shapescale-story__copy">
              {steps.map((step, i) => (
                <article
                  key={step.id}
                  className={`shapescale-story__panel${i === activeIndex ? " shapescale-story__panel--active" : ""}`}
                  aria-hidden={i !== activeIndex}
                >
                  <ShapeScalePanelCopy
                    eyebrow={eyebrow}
                    title={step.title}
                    lead={step.lead}
                    items={step.items}
                  />
                </article>
              ))}

              <div className="shapescale-story__progress" role="tablist" aria-label={t("progressLabel")}>
                {steps.map((step, i) => (
                  <button
                    key={step.id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`${i + 1} / ${steps.length}`}
                    className={`shapescale-story__dot${i === activeIndex ? " shapescale-story__dot--active" : ""}`}
                    onClick={() => goToStep(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="shapescale-story__hint">{scrollHint}</p>
        </div>
      </div>

      {/* Móvil: bloques apilados */}
      <div className="shapescale-story__mobile">
        {steps.map((step) => (
          <article key={step.id} className="shapescale-story__mobile-block">
            <div className="shapescale-story__mobile-visual">
              <div className="shapescale-story__mobile-img-wrap">
                <Image
                  src={step.image}
                  alt=""
                  width={700}
                  height={700}
                  className="shapescale-story__mobile-img"
                  sizes="90vw"
                />
              </div>
            </div>
            <ShapeScalePanelCopy
              eyebrow={eyebrow}
              title={step.title}
              lead={step.lead}
              items={step.items}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
