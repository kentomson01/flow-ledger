import { useState, useEffect, useRef, useCallback } from "react";
import { loadPayrollRuns, updatePayrollRunStatus, type StoredPayrollRun } from "@/lib/payroll-storage";
import { getStacksApiBase } from "@/lib/constants";

const POLL_INTERVAL = 30_000;

const FAILURE_STATUSES = new Set([
  "abort_by_response",
  "abort_by_post_condition",
  "dropped_replace_by_fee",
  "dropped_replace_across_fork",
  "dropped_too_expensive",
  "dropped_stale_garbage_collect",
]);

export function usePayrollPolling(network: "testnet" | "mainnet") {
  const [runs, setRuns] = useState<StoredPayrollRun[]>(() => loadPayrollRuns(network));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => setRuns(loadPayrollRuns(network)), [network]);

  const pollPending = useCallback(async () => {
    const current = loadPayrollRuns(network);
    const pending = current.filter((r) => r.status === "pending" && r.txHash);
    if (pending.length === 0) return;

    const base = getStacksApiBase(network);
    let changed = false;

    await Promise.allSettled(
      pending.map(async (run) => {
        try {
          const res = await fetch(`${base}/extended/v1/tx/${run.txHash}`);
          if (!res.ok) return;
          const data = await res.json();
          const status = data.tx_status as string;

          if (status === "success") {
            updatePayrollRunStatus(run.id, "confirmed", run.txHash!);
            changed = true;
          } else if (FAILURE_STATUSES.has(status)) {
            updatePayrollRunStatus(run.id, "failed");
            changed = true;
          }
        } catch {
          // network error — skip this cycle
        }
      })
    );

    if (changed) refresh();
  }, [network, refresh]);

  useEffect(() => {
    refresh();
    pollPending();
    timerRef.current = setInterval(pollPending, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [network, pollPending, refresh]);

  return runs;
}
