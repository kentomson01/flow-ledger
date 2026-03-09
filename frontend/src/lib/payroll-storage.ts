import type { PayrollStatus, CurrencyType } from "./constants";

export interface StoredPayrollRun {
  id: string;
  type: CurrencyType;
  recipients: { address: string; name: string; amount: number }[];
  totalAmount: number;
  status: PayrollStatus;
  txHash: string | null;
  errorCode: string | null;
  period: string;
  network: "testnet" | "mainnet";
  createdAt: string;
}

const STORAGE_KEY = "flowledger-payroll-runs";

function readAll(): StoredPayrollRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(runs: StoredPayrollRun[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

export function savePayrollRun(run: StoredPayrollRun): void {
  const runs = readAll();
  runs.unshift(run);
  writeAll(runs);
}

export function loadPayrollRuns(network: "testnet" | "mainnet"): StoredPayrollRun[] {
  return readAll().filter((r) => r.network === network);
}

export function updatePayrollRunStatus(
  id: string,
  status: PayrollStatus,
  txHash?: string
): void {
  const runs = readAll();
  const idx = runs.findIndex((r) => r.id === id);
  if (idx !== -1) {
    runs[idx].status = status;
    if (txHash !== undefined) runs[idx].txHash = txHash;
    writeAll(runs);
  }
}

export function generatePayrollId(): string {
  return `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
