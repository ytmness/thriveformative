"use client";

import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/store/ReceiptPrinter";
import { formatStorePrice } from "@/lib/store/formatPrice";
import { minorToMajor } from "@/lib/square/money";
import type { StoreReceiptData } from "@/lib/store/orderTypes";
import { Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PAPER_LOGO = "/logos/Black-Gradient-Logo-02.png";

type Labels = {
  receiptTitle: string;
  totalPaid: string;
  thanksOrder: string;
  processingOrder: string;
  printingReceipt: string;
  orderComplete: string;
  pickup: string;
  shipping: string;
  home: string;
};

export default function StoreReceipt({
  data,
  animate = true,
  labels,
  homeHref,
}: {
  data: StoreReceiptData;
  animate?: boolean;
  labels: Labels;
  homeHref: string;
}) {
  const [stage, setStage] = useState<ReceiptPrinterStage>(animate ? "processing" : "complete");

  useEffect(() => {
    if (!animate) {
      setStage("complete");
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setStage("complete");
      return;
    }
    const printing = window.setTimeout(() => setStage("printing"), 700);
    const done = window.setTimeout(() => setStage("complete"), 2450);
    return () => {
      window.clearTimeout(printing);
      window.clearTimeout(done);
    };
  }, [animate]);

  const status =
    stage === "processing" ? labels.processingOrder : stage === "printing" ? labels.printingReceipt : labels.orderComplete;
  const paidLabel = new Intl.DateTimeFormat(data.locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.paidAt));
  const place = data.fulfillment === "pickup" ? data.locationName : data.address;
  const total = formatStorePrice(minorToMajor(data.totalAmount, data.currency), data.currency, data.locale);

  return (
    <div className="store-receipt">
      <ReceiptPrinter.Root stage={stage} animate={animate}>
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <img className="receipt-machine__logo" src={PAPER_LOGO} alt="Thrive Formative" />
            <Link className="receipt-machine__home" href={homeHref}>
              <Home size={14} aria-hidden />
              {labels.home}
            </Link>
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <div className="receipt-screen__row">
              <div>
                <p className="receipt-screen__title">{data.recipientName}</p>
                <p className="receipt-screen__meta">{place || (data.fulfillment === "pickup" ? labels.pickup : labels.shipping)}</p>
              </div>
              <strong>{total}</strong>
            </div>
            <ReceiptPrinter.Status label={status} />
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>
        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <header className="receipt-paper__head">
              <img src={PAPER_LOGO} alt="" />
              <h2>{labels.receiptTitle}</h2>
              <p>Folio {data.folio}</p>
            </header>
            <hr />
            <p className="receipt-paper__place">{data.fulfillment === "pickup" ? labels.pickup : labels.shipping}</p>
            {place ? <p className="receipt-paper__muted">{place}</p> : null}
            <dl className="receipt-paper__lines">
              {data.lines.map((line) => (
                <div key={`${line.name}:${line.variationName ?? ""}`}>
                  <dt>
                    {line.name}
                    {line.variationName ? ` · ${line.variationName}` : ""}
                  </dt>
                  <dd>
                    x{line.quantity}
                    <span>
                      {formatStorePrice(minorToMajor(line.unitAmount, line.currency) * line.quantity, line.currency, data.locale)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <hr className="receipt-paper__dash" />
            <p className="receipt-paper__total">
              <span>{labels.totalPaid}</span>
              <span>{total}</span>
            </p>
            <div className="receipt-paper__who">
              <p>{data.recipientName}</p>
              <p>{paidLabel}</p>
            </div>
            <p className="receipt-paper__thanks">{labels.thanksOrder}</p>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>
    </div>
  );
}
