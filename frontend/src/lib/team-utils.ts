import { getMockRecipients, type Recipient } from "./mock-data";


const STORAGE_KEY = "flowledger-team";

export function loadTeam(network: "testnet" | "mainnet"): Recipient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getMockRecipients(network);
}

export function saveTeam(team: Recipient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
}

/** Validates a Stacks address format */
export function isValidStxAddress(address: string): boolean {
  return /^S[PTMN][A-Z0-9]{38,40}$/.test(address);
}

/** Returns the expected address prefix for the current network */
export function getAddressPrefix(network: "testnet" | "mainnet"): string {
  return network === "testnet" ? "ST" : "SP";
}
