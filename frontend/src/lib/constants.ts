// FlowLedger Contract Error Codes (PRD-aligned)
export const CONTRACT_ERRORS: Record<string, string> = {
  u100: "Not authorized",
  u101: "Already registered",
  u102: "Not registered",
  u103: "Organization already exists",
  u104: "Insufficient funds",
  u105: "Invalid amount (must be > 0)",
  u106: "Invalid recipient list",
  u107: "STX transfer failed",
  u108: "sBTC transfer failed",
} as const;

export const CONTRACT_ADDRESS = "ST25D3KFGQ266WN5CNHTTBD8RPCQMQBTNQM1F7QAR";
export const CONTRACT_NAME = "flow-ledger";
export const APP_VERSION = "1.0.0-beta";
export const NETWORK = "testnet";
export const EXPLORER_BASE = "https://explorer.hiro.so";
export const STACKS_API_MAINNET = "https://api.hiro.so";
export const STACKS_API_TESTNET = "https://api.testnet.hiro.so";

export const getStacksApiBase = (network: "testnet" | "mainnet") =>
  network === "mainnet" ? STACKS_API_MAINNET : STACKS_API_TESTNET;
export const MAX_BATCH_SIZE = 20;

export const PAYROLL_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  FAILED: "failed",
} as const;

export type PayrollStatus = (typeof PAYROLL_STATUS)[keyof typeof PAYROLL_STATUS];
export type CurrencyType = "STX" | "sBTC";

export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/txid/${txHash}?chain=${NETWORK}`;

export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}?chain=${NETWORK}`;

export const getErrorMessage = (code: string): string =>
  CONTRACT_ERRORS[code] || `Unknown error (${code})`;
