import { request } from "@stacks/connect";
import {
  Pc,
  uintCV,
  standardPrincipalCV,
  listCV,
  stringAsciiCV,
  tupleCV,
} from "@stacks/transactions";
import { CONTRACT_ADDRESS, CONTRACT_NAME } from "@/lib/constants";
import type { CurrencyType } from "@/lib/constants";

const CONTRACT = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;
const SBTC_CONTRACT = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token";
const SBTC_ASSET = "sbtc-token";

// STX uses 6 decimals (micro-STX), sBTC uses 8 decimals (satoshis)
const STX_DECIMALS = 1_000_000;
const SBTC_DECIMALS = 100_000_000;

export function toOnChainAmount(amount: number, currency: CurrencyType): number {
  return Math.round(amount * (currency === "STX" ? STX_DECIMALS : SBTC_DECIMALS));
}

interface PayrollRecipient {
  address: string;
  amount: number; // human-readable (e.g. 1.5 STX)
}

interface PayrollParams {
  sender: string;
  recipients: PayrollRecipient[];
  currency: CurrencyType;
  periodRef: string;
  network: "testnet" | "mainnet";
}

export interface PayrollResult {
  success: boolean;
  txId?: string;
  errorCode?: string;
  userRejected?: boolean;
}

/**
 * Execute a payroll transaction via Stacks wallet.
 * Routes to the correct contract function based on mode (single/batch) and currency.
 */
export async function executePayrollContract(
  params: PayrollParams
): Promise<PayrollResult> {
  const { sender, recipients, currency, periodRef, network } = params;
  const isBatch = recipients.length > 1;

  try {
    if (isBatch) {
      return await executeBatch(sender, recipients, currency, periodRef, network);
    } else {
      return await executeSingle(sender, recipients[0], currency, network);
    }
  } catch (err: unknown) {
    // User closed the wallet popup
    if (err instanceof Error && (err.message.includes("User rejected") || err.message.includes("cancelled"))) {
      return { success: false, userRejected: true };
    }
    // Contract error codes come back as string like "u104"
    const errStr = String(err);
    const codeMatch = errStr.match(/u\d{3}/);
    if (codeMatch) {
      return { success: false, errorCode: codeMatch[0] };
    }
    throw err;
  }
}

async function executeSingle(
  sender: string,
  recipient: PayrollRecipient,
  currency: CurrencyType,
  network: "testnet" | "mainnet"
): Promise<PayrollResult> {
  const microAmount = toOnChainAmount(recipient.amount, currency);
  const functionName = currency === "STX" ? "execute-payroll" : "execute-sbtc-payroll";

  const postConditions =
    currency === "STX"
      ? [Pc.principal(sender).willSendEq(microAmount).ustx()]
      : [
          Pc.principal(sender)
            .willSendEq(microAmount)
            .ft(SBTC_CONTRACT, SBTC_ASSET),
        ];

  const result = await request("stx_callContract", {
    contract: CONTRACT,
    functionName,
    functionArgs: [
      standardPrincipalCV(recipient.address),
      uintCV(microAmount),
    ],
    postConditions,
    postConditionMode: "deny",
    network,
  });

  return { success: true, txId: result.txid };
}

async function executeBatch(
  sender: string,
  recipients: PayrollRecipient[],
  currency: CurrencyType,
  periodRef: string,
  network: "testnet" | "mainnet"
): Promise<PayrollResult> {
  const functionName =
    currency === "STX" ? "execute-batch-payroll" : "execute-batch-sbtc-payroll";

  const totalMicro = recipients.reduce(
    (sum, r) => sum + toOnChainAmount(r.amount, currency),
    0
  );

  const postConditions =
    currency === "STX"
      ? [Pc.principal(sender).willSendEq(totalMicro).ustx()]
      : [
          Pc.principal(sender)
            .willSendEq(totalMicro)
            .ft(SBTC_CONTRACT, SBTC_ASSET),
        ];

  const amountKey = currency === "STX" ? "ustx" : "amount";
  const recipientsList = listCV(
    recipients.map((r) =>
      tupleCV({
        to: standardPrincipalCV(r.address),
        [amountKey]: uintCV(toOnChainAmount(r.amount, currency)),
      })
    )
  );

  const result = await request("stx_callContract", {
    contract: CONTRACT,
    functionName,
    functionArgs: [recipientsList, stringAsciiCV(periodRef)],
    postConditions,
    postConditionMode: "deny",
    network,
  });

  return { success: true, txId: result.txid };
}
