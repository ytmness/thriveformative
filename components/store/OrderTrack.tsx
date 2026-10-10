"use client";

export type OrderStage = "paid" | "ready" | "completed" | "cancelled";

const FLOW: OrderStage[] = ["paid", "ready", "completed"];

export type OrderTrackLabels = {
  title: string;
  paid: string;
  readyPickup: string;
  readyShip: string;
  completed: string;
  cancelled: string;
  paidNote: string;
  readyPickupNote: string;
  readyShipNote: string;
  completedNote: string;
  cancelledNote: string;
  cancel: string;
  close: string;
  hint: string;
};

export function OrderTrack({
  status,
  fulfillment,
  onSelect,
  onClose,
  labels,
}: {
  status: string;
  fulfillment: "pickup" | "shipping";
  onSelect?: (status: OrderStage) => void;
  onClose?: () => void;
  labels: OrderTrackLabels;
}) {
  const current = FLOW.indexOf(status as OrderStage);
  const cancelled = status === "cancelled";
  const steps = FLOW.map((id, index) => {
    const name = id === "ready" ? (fulfillment === "shipping" ? labels.readyShip : labels.readyPickup) : id === "completed" ? labels.completed : labels.paid;
    const note = id === "ready" ? (fulfillment === "shipping" ? labels.readyShipNote : labels.readyPickupNote) : id === "completed" ? labels.completedNote : labels.paidNote;
    const state = cancelled ? "wait" : index < current ? "done" : index === current ? "now" : "wait";
    return { id, name, note, state, index };
  });

  return (
    <section className="order-track" aria-label={labels.title}>
      <header className="order-track__head">
        <h2>{labels.title}</h2>
        {onClose ? (
          <button className="order-track__close" type="button" onClick={onClose}>{labels.close}</button>
        ) : null}
      </header>
      <ol className="order-track__steps">
        {steps.map((step, index) => {
          const body = (
            <>
              <span className="order-track__rail" aria-hidden="true">
                <span className="order-track__dot" />
                {index < steps.length - 1 ? <span className="order-track__line" /> : null}
              </span>
              <span className="order-track__copy">
                <span className="order-track__name">{step.name}</span>
                {step.state === "now" || (cancelled && index === 0) ? <span className="order-track__note">{cancelled ? labels.cancelledNote : step.note}</span> : null}
              </span>
            </>
          );
          return (
            <li key={step.id} className={`order-track__step is-${step.state}${cancelled ? " is-off" : ""}`}>
              {onSelect ? (
                <button type="button" aria-current={step.state === "now" ? "step" : undefined} disabled={step.state === "now"} onClick={() => onSelect(step.id)}>
                  {body}
                </button>
              ) : (
                <div aria-current={step.state === "now" ? "step" : undefined}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
      {cancelled ? <p className="order-track__banner" role="status">{labels.cancelled}</p> : null}
      {onSelect ? <p className="order-track__hint">{labels.hint}</p> : null}
      {onSelect && !cancelled ? (
        <button className="order-track__cancel" type="button" onClick={() => onSelect("cancelled")}>{labels.cancel}</button>
      ) : null}
    </section>
  );
}
