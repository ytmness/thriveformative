"use client";

import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export type ReceiptPrinterStage = "processing" | "printing" | "complete";

type ContextValue = {
  animate: boolean;
  stage: ReceiptPrinterStage;
};

const ReceiptPrinterContext = createContext<ContextValue | null>(null);

const toothCount = 40;
const toothDepth = 4;
const toothPoints = Array.from({ length: toothCount * 2 }, (_, index) => {
  const x = 100 - ((index + 1) * 100) / (toothCount * 2);
  const y = index % 2 === 0 ? "100%" : `calc(100% - ${toothDepth}px)`;
  return `${x}% ${y}`;
}).join(", ");
const clipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${toothDepth}px), ${toothPoints})`;

function usePrinter(name: string) {
  const context = useContext(ReceiptPrinterContext);
  if (!context) throw new Error(`${name} debe usarse dentro de la impresora.`);
  return context;
}

function Root({
  stage,
  animate = true,
  children,
}: {
  stage: ReceiptPrinterStage;
  animate?: boolean;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const shouldMove = animate && !reduced;
  return (
    <ReceiptPrinterContext.Provider value={{ animate: shouldMove, stage }}>
      <section
        className="receipt-printer"
        aria-label="Impresora de recibo"
        data-feed="stepped"
        data-move={shouldMove ? "true" : "false"}
        data-stage={stage}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

function Machine({ children }: { children: ReactNode }) {
  return (
    <div className="receipt-machine">
      {children}
      <div className="receipt-slot" aria-hidden />
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return <div className="receipt-machine__header">{children}</div>;
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="receipt-screen">
      <div className="receipt-screen__body">{children}</div>
    </div>
  );
}

function Status({ label }: { label: string }) {
  const { animate, stage } = usePrinter("Status");
  const done = stage === "complete";
  return (
    <div className="receipt-status" role="status" aria-live="polite">
      <span className="receipt-status-icon" aria-hidden>
        {done ? (
          <CheckCircle2 size={18} strokeWidth={2.2} />
        ) : (
          <Loader2 className={animate ? "receipt-spin" : undefined} size={18} strokeWidth={2.2} />
        )}
      </span>
      <span className="receipt-status-copy" key={stage}>
        {label}
      </span>
    </div>
  );
}

function Output({ children }: { children: ReactNode }) {
  const { stage } = usePrinter("Output");
  return (
    <div className="receipt-output">
      {stage !== "processing" ? <div className="receipt-output__shade" aria-hidden /> : null}
      <div className="receipt-output-sheet" aria-hidden={stage !== "complete"}>
        {children}
      </div>
    </div>
  );
}

function Paper({ children, ...props }: ComponentPropsWithoutRef<"article">) {
  return (
    <article className="receipt-paper" style={{ clipPath, WebkitClipPath: clipPath }} {...props}>
      {children}
    </article>
  );
}

export const ReceiptPrinter = { Root, Machine, Header, Screen, Status, Output, Paper };
