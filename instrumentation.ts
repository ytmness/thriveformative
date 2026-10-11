export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const globalPump = globalThis as typeof globalThis & { __tfMessagePump?: boolean };
  if (globalPump.__tfMessagePump) return;
  globalPump.__tfMessagePump = true;

  const pump = async () => {
    const { dispatchDueMessages } = await import("@/lib/messaging/queue");
    await dispatchDueMessages().catch(() => undefined);
  };
  setTimeout(() => {
    void pump();
  }, 20_000);
  setInterval(() => {
    void pump();
  }, 10 * 60 * 1000);
}
