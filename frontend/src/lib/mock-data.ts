import { PAYROLL_STATUS, type PayrollStatus, type CurrencyType } from "./constants";

export interface Recipient {
  address: string;
  displayName: string;
  lastPaid: string | null;
  totalReceived: { stx: number; sbtc: number };
}

export interface PayrollRun {
  id: string;
  type: CurrencyType;
  recipients: string[];
  totalAmount: number;
  status: PayrollStatus;
  txHash: string | null;
  blockHeight: number | null;
  period: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: CurrencyType;
  sender: string;
  recipients: string[];
  amount: number;
  period: string;
  txHash: string;
  blockHeight: number;
  timestamp: string;
  status: PayrollStatus;
}

export const mockWalletAddressMainnet = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
export const mockWalletAddressTestnet = "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM4DF2YCW";
/** @deprecated Use mockWalletAddressMainnet/Testnet with network-aware selection */
export const mockWalletAddress = mockWalletAddressMainnet;
export const mockStxBalance = 48250.75;
export const mockSbtcBalance = 1.2847;

const recipientsMainnet = [
  { address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE", displayName: "Alice Chen", lastPaid: "2024-03-01", totalReceived: { stx: 12500, sbtc: 0.15 } },
  { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", displayName: "Bob Martinez", lastPaid: "2024-03-01", totalReceived: { stx: 8750, sbtc: 0.08 } },
  { address: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE", displayName: "Carol Williams", lastPaid: "2024-02-15", totalReceived: { stx: 15000, sbtc: 0.22 } },
  { address: "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB", displayName: "Dave Johnson", lastPaid: "2024-03-01", totalReceived: { stx: 6200, sbtc: 0 } },
  { address: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR", displayName: "Eve Brown", lastPaid: null, totalReceived: { stx: 0, sbtc: 0 } },
] satisfies Recipient[];

const recipientsTestnet = recipientsMainnet.map((r) => ({
  ...r,
  address: "ST" + r.address.slice(2),
})) as Recipient[];

export const mockRecipients = recipientsMainnet;
export const getMockRecipients = (network: "testnet" | "mainnet"): Recipient[] =>
  network === "testnet" ? recipientsTestnet : recipientsMainnet;

export const getMockWalletAddress = (network: "testnet" | "mainnet") =>
  network === "testnet" ? mockWalletAddressTestnet : mockWalletAddressMainnet;

export const mockPayrollRuns: PayrollRun[] = [
  { id: "pr-001", type: "STX", recipients: ["SP3FBR...", "SP2J6Z..."], totalAmount: 5000, status: PAYROLL_STATUS.CONFIRMED, txHash: "0x8a4e2f1c9b3d7e6a5f0c8b2d4e6f8a0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f", blockHeight: 145230, period: "March 2024", createdAt: "2024-03-01T10:00:00Z" },
  { id: "pr-002", type: "sBTC", recipients: ["SP1HTB..."], totalAmount: 0.15, status: PAYROLL_STATUS.CONFIRMED, txHash: "0x2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b", blockHeight: 145228, period: "March 2024", createdAt: "2024-03-01T09:30:00Z" },
  { id: "pr-003", type: "STX", recipients: ["SP3FBR...", "SP2J6Z...", "SP3GWX..."], totalAmount: 12500, status: PAYROLL_STATUS.PENDING, txHash: null, blockHeight: null, period: "March 2024 (Bonus)", createdAt: "2024-03-05T14:00:00Z" },
  { id: "pr-004", type: "STX", recipients: ["SP1HTB..."], totalAmount: 3000, status: PAYROLL_STATUS.FAILED, txHash: "0xf1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1", blockHeight: null, period: "February 2024", createdAt: "2024-02-28T16:00:00Z" },
];

export const mockTransactions: Transaction[] = [
  { id: "tx-001", type: "STX", sender: mockWalletAddressMainnet, recipients: ["SP3FBR...", "SP2J6Z..."], amount: 5000, period: "March 2024", txHash: "0x8a4e2f1c9b3d7e6a5f0c8b2d4e6f8a0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f", blockHeight: 145230, timestamp: "2024-03-01T10:05:00Z", status: PAYROLL_STATUS.CONFIRMED },
  { id: "tx-002", type: "sBTC", sender: mockWalletAddressMainnet, recipients: ["SP1HTB..."], amount: 0.15, period: "March 2024", txHash: "0x2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b", blockHeight: 145228, timestamp: "2024-03-01T09:35:00Z", status: PAYROLL_STATUS.CONFIRMED },
  { id: "tx-003", type: "STX", sender: mockWalletAddressMainnet, recipients: ["SP3FBR...", "SP2J6Z...", "SP1HTB...", "SP3GWX..."], amount: 18000, period: "February 2024", txHash: "0x4d6e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d", blockHeight: 144500, timestamp: "2024-02-15T11:00:00Z", status: PAYROLL_STATUS.CONFIRMED },
  { id: "tx-004", type: "sBTC", sender: mockWalletAddressMainnet, recipients: ["SP1HTB...", "SP3FBR..."], amount: 0.35, period: "February 2024", txHash: "0x6e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e", blockHeight: 144498, timestamp: "2024-02-15T10:45:00Z", status: PAYROLL_STATUS.CONFIRMED },
  { id: "tx-005", type: "STX", sender: mockWalletAddressMainnet, recipients: ["SP2J6Z..."], amount: 2500, period: "January 2024", txHash: "0x8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f", blockHeight: 143800, timestamp: "2024-01-31T09:00:00Z", status: PAYROLL_STATUS.CONFIRMED },
];

export const mockMonthlySpending = [
  { month: "Oct 2023", stx: 0, sbtc: 0 },
  { month: "Nov 2023", stx: 4200, sbtc: 0.12 },
  { month: "Dec 2023", stx: 6800, sbtc: 0.18 },
  { month: "Jan 2024", stx: 2500, sbtc: 0 },
  { month: "Feb 2024", stx: 18000, sbtc: 0.35 },
  { month: "Mar 2024", stx: 5000, sbtc: 0.15 },
];

export const truncateAddress = (addr: string, start = 6, end = 4) =>
  addr.length > start + end ? `${addr.slice(0, start)}...${addr.slice(-end)}` : addr;

export const formatCurrency = (amount: number, type: CurrencyType) =>
  type === "STX" ? `${amount.toLocaleString()} STX` : `${amount.toFixed(4)} sBTC`;

export const getMockTransactions = (network: "testnet" | "mainnet"): Transaction[] =>
  network === "testnet"
    ? mockTransactions.map((tx) => ({
        ...tx,
        sender: "ST" + tx.sender.slice(2),
        recipients: tx.recipients.map((r) => "ST" + r.slice(2)),
      }))
    : mockTransactions;
